-- ============================================================================
-- PRODUCTION MIGRATION — run this once in Supabase SQL Editor
-- Unblocks all monetization: AI quota, plan gating, payments, coupons
-- Safe to re-run (fully idempotent)
-- ============================================================================

-- ── 1. Add plan + AI quota columns to profiles ───────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan               TEXT        NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS ai_requests_today  INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_quota_reset_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS pro_expires_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS monitoring_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at      TIMESTAMPTZ;

-- ── 2. Fix plan CHECK constraint to include starter & elite ──────────────────
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'elite'));

CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles (plan);

-- ── 3. Create payments table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id           TEXT        NOT NULL,
  amount_usd        NUMERIC(10,2) NOT NULL,
  method            TEXT        NOT NULL DEFAULT 'ecocash',
  phone             TEXT,
  paynow_reference  TEXT,
  poll_url          TEXT,
  status            TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  gateway           TEXT        DEFAULT 'paynow',
  item_type         TEXT        DEFAULT 'subscription',
  item_id           TEXT,
  coupon_id         UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at           TIMESTAMPTZ
);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway    TEXT DEFAULT 'paynow';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS item_type  TEXT DEFAULT 'subscription';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS item_id    TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS coupon_id  UUID;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payments' AND policyname='Users read own payments') THEN
    CREATE POLICY "Users read own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payments' AND policyname='Admins read all payments') THEN
    CREATE POLICY "Admins read all payments" ON public.payments FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON public.payments (status);

-- ── 4. Create coupons tables ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT        UNIQUE NOT NULL,
  description    TEXT,
  discount_type  TEXT        NOT NULL CHECK (discount_type IN ('percent', 'fixed_usd')),
  discount_value NUMERIC(10,2) NOT NULL,
  max_uses       INT         DEFAULT NULL,
  uses_count     INT         DEFAULT 0,
  valid_from     TIMESTAMPTZ DEFAULT NOW(),
  valid_until    TIMESTAMPTZ DEFAULT NULL,
  applies_to     TEXT[]      DEFAULT '{}',
  min_amount_usd NUMERIC(10,2) DEFAULT 0,
  is_active      BOOLEAN     DEFAULT TRUE,
  created_by     UUID        REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coupon_uses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id       UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id         TEXT,
  amount_saved_usd NUMERIC(10,2),
  used_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coupon_id, user_id)
);

ALTER TABLE public.coupons    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='coupons' AND policyname='coupons_admin_all') THEN
    CREATE POLICY "coupons_admin_all"  ON public.coupons FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='coupons' AND policyname='coupons_read_active') THEN
    CREATE POLICY "coupons_read_active" ON public.coupons FOR SELECT USING (is_active = TRUE AND auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='coupon_uses' AND policyname='coupon_uses_own') THEN
    CREATE POLICY "coupon_uses_own"    ON public.coupon_uses FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='coupon_uses' AND policyname='coupon_uses_insert') THEN
    CREATE POLICY "coupon_uses_insert" ON public.coupon_uses FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION increment_coupon_uses_count(p_coupon_id UUID)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE public.coupons SET uses_count = uses_count + 1 WHERE id = p_coupon_id;
$$;

-- Seed launch coupons (safe to re-run — ON CONFLICT DO NOTHING)
INSERT INTO public.coupons (code, description, discount_type, discount_value, max_uses, valid_until, applies_to, is_active)
VALUES
  ('ZIMLEARN50', '50% off for early adopters', 'percent', 50, 100, '2026-12-31', '{}', true),
  ('LAUNCH2026', '1 month free — launch promo', 'percent', 100, 50, '2026-06-30', ARRAY['starter_monthly'], true)
ON CONFLICT (code) DO NOTHING;

-- ── 5. Create one_time_purchases table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.one_time_purchases (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type  VARCHAR(50) NOT NULL,
  item_id    VARCHAR(100),
  amount_usd DECIMAL(8,2) NOT NULL,
  status     VARCHAR(20)  DEFAULT 'pending',
  payment_id UUID,
  created_at TIMESTAMPTZ  DEFAULT NOW(),
  metadata   JSONB
);

ALTER TABLE public.one_time_purchases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='one_time_purchases' AND policyname='Users can view their own one-time purchases') THEN
    CREATE POLICY "Users can view their own one-time purchases"
      ON public.one_time_purchases FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- ── 6. Create subject_access table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subject_access (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subject_id)
);

ALTER TABLE public.subject_access ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subject_access' AND policyname='Users can view their own subject access') THEN
    CREATE POLICY "Users can view their own subject access"
      ON public.subject_access FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- ── 7. Functions: promote to any plan, expire subscriptions ──────────────────
CREATE OR REPLACE FUNCTION promote_to_plan(
  p_user_id UUID,
  p_plan    TEXT    DEFAULT 'pro',
  p_days    INTEGER DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles SET
    plan           = p_plan,
    pro_expires_at = CASE WHEN p_days IS NULL THEN NULL
                          ELSE now() + (p_days || ' days')::INTERVAL END
  WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION expire_pro_subscriptions()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles SET plan = 'free'
  WHERE plan IN ('starter', 'pro', 'elite')
    AND pro_expires_at IS NOT NULL
    AND pro_expires_at < now();
END;
$$;

-- ── 8. Grant service-role access to payments (for webhook callbacks) ──────────
GRANT SELECT, INSERT, UPDATE ON public.payments          TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.one_time_purchases TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.subject_access    TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.coupons           TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.coupon_uses       TO service_role;
GRANT SELECT, UPDATE         ON public.profiles          TO service_role;

-- ── Done ─────────────────────────────────────────────────────────────────────
-- After running this, verify with:
--   SELECT id, plan, ai_requests_today, pro_expires_at FROM profiles LIMIT 5;
--   SELECT * FROM payments LIMIT 5;
--   SELECT * FROM coupons;
