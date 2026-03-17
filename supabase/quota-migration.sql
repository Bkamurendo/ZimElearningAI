-- ─────────────────────────────────────────────────────────────────────────────
-- AI Quota + Monetisation columns
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan               TEXT        NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro')),
  ADD COLUMN IF NOT EXISTS ai_requests_today  INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_quota_reset_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS pro_expires_at     TIMESTAMPTZ;         -- NULL = never (lifetime) or future date

-- Index for quick plan lookups
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles (plan);

-- ── Helper: promote a user to Pro ────────────────────────────────────────────
-- Usage: SELECT promote_to_pro('user-uuid-here', 30);  -- 30 days
CREATE OR REPLACE FUNCTION promote_to_pro(
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
    plan           = 'pro',
    pro_expires_at = CASE
                       WHEN p_days IS NULL THEN NULL
                       ELSE now() + (p_days || ' days')::INTERVAL
                     END
  WHERE id = p_user_id;
END;
$$;

-- ── Helper: demote expired Pro users back to Free (run daily via pg_cron or a cron job) ──
CREATE OR REPLACE FUNCTION expire_pro_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET plan = 'free'
  WHERE plan = 'pro'
    AND pro_expires_at IS NOT NULL
    AND pro_expires_at < now();
END;
$$;
