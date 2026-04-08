-- ============================================================================
-- 021: Fix all payment system blocking issues
-- Run this in Supabase SQL Editor to unblock payments
-- ============================================================================

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ FIX 1: profiles.plan CHECK constraint only allows 'free'/'pro'         ║
-- ║ but starter & elite tiers exist. Payments crash on upgrade callback.   ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Drop the old constraint and add the correct one
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'elite'));

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ FIX 2: payments table missing columns (coupon_id, item_type, item_id,  ║
-- ║ gateway). The initiate & callback APIs write these but they don't exist.║
-- ╚══════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS coupon_id  UUID REFERENCES public.coupons(id) ON DELETE SET NULL;
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS item_type  TEXT DEFAULT 'subscription';
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS item_id    TEXT;
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS gateway    TEXT DEFAULT 'paynow';

CREATE INDEX IF NOT EXISTS idx_payments_coupon_id ON public.payments (coupon_id)
  WHERE coupon_id IS NOT NULL;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ FIX 3: profiles missing monitoring_expires_at column                    ║
-- ║ Payment callback tries to set it for parent monitoring purchases.       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monitoring_expires_at TIMESTAMPTZ;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ FIX 4: Create one_time_purchases table (AI grade reports, subject packs)║
-- ║ Payment callback inserts into this table after one-time purchases.      ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.one_time_purchases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  item_type   VARCHAR(50)  NOT NULL,
  item_id     VARCHAR(100),
  amount_usd  DECIMAL(8,2) NOT NULL,
  status      VARCHAR(20)  DEFAULT 'pending',
  payment_id  UUID,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  metadata    JSONB
);

ALTER TABLE public.one_time_purchases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own one-time purchases') THEN
    CREATE POLICY "Users can view their own one-time purchases"
      ON public.one_time_purchases FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ FIX 5: Create subject_access table (per-subject unlock for students)   ║
-- ║ Payment callback inserts here when a subject pack is purchased.        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.subject_access (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject_id  UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(user_id, subject_id)
);

ALTER TABLE public.subject_access ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own subject access') THEN
    CREATE POLICY "Users can view their own subject access"
      ON public.subject_access FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ FIX 6: push_subscriptions.plan CHECK only allows 'free'/'pro'          ║
-- ║ Breaks push notifications for starter/elite users.                      ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_plan_check;
-- Re-add if the table/column exists (may not on all environments)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'push_subscriptions' AND column_name = 'plan'
  ) THEN
    ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_plan_check
      CHECK (plan IN ('free', 'starter', 'pro', 'elite'));
  END IF;
END $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ FIX 7: Update promote_to_pro to support all tiers                      ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION promote_to_plan(
  p_user_id UUID,
  p_plan    TEXT DEFAULT 'pro',
  p_days    INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET
    plan           = p_plan,
    pro_expires_at = CASE
                       WHEN p_days IS NULL THEN NULL
                       ELSE now() + (p_days || ' days')::INTERVAL
                     END
  WHERE id = p_user_id;
END;
$$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ FIX 8: Update expire function to handle all paid tiers                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION expire_pro_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET plan = 'free'
  WHERE plan IN ('starter', 'pro', 'elite')
    AND pro_expires_at IS NOT NULL
    AND pro_expires_at < now();
END;
$$;
