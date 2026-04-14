-- ─────────────────────────────────────────────────────────────────────────────
-- Multi-tier subscription plans: add 'starter' and 'elite' to the plan column
-- Run this in the Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop existing CHECK constraint on plan column and replace with updated one
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
    CHECK (plan IN ('free', 'starter', 'pro', 'elite'));

-- ── Helper: promote a user to Starter ────────────────────────────────────────
CREATE OR REPLACE FUNCTION promote_to_starter(
  p_user_id UUID,
  p_days     INTEGER DEFAULT NULL  -- NULL = lifetime
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET
    plan           = 'starter',
    pro_expires_at = CASE
                       WHEN p_days IS NULL THEN NULL
                       ELSE now() + (p_days || ' days')::INTERVAL
                     END
  WHERE id = p_user_id;
END;
$$;

-- ── Helper: promote a user to Elite ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION promote_to_elite(
  p_user_id UUID,
  p_days     INTEGER DEFAULT NULL  -- NULL = lifetime
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET
    plan           = 'elite',
    pro_expires_at = CASE
                       WHEN p_days IS NULL THEN NULL
                       ELSE now() + (p_days || ' days')::INTERVAL
                     END
  WHERE id = p_user_id;
END;
$$;

-- ── Update expiry function to handle all paid tiers ───────────────────────────
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

-- ── Update payments table plan_id to support new tiers ────────────────────────
-- New plan IDs: starter_monthly, elite_monthly, elite_quarterly, elite_yearly
-- Existing: pro_monthly, pro_quarterly, pro_yearly
-- No schema change needed — plan_id is TEXT without a CHECK constraint
