-- ============================================================================
-- 023: Add 'ultimate' tier to profiles.plan CHECK constraint
-- This unblocks payments for the Ultimate plan.
-- ============================================================================

-- 1. Update profiles table constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'elite', 'ultimate'));

-- 2. Update push_subscriptions table constraint (if it exists)
ALTER TABLE public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_plan_check;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'push_subscriptions' AND column_name = 'plan'
  ) THEN
    ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_plan_check
      CHECK (plan IN ('free', 'starter', 'pro', 'elite', 'ultimate'));
  END IF;
END $$;

-- 3. Update expire function to include 'ultimate'
CREATE OR REPLACE FUNCTION expire_pro_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET plan = 'free'
  WHERE plan IN ('starter', 'pro', 'elite', 'ultimate')
    AND pro_expires_at IS NOT NULL
    AND pro_expires_at < now();
END;
$$;
