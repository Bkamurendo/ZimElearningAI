-- ============================================================
-- Migration 008: Web Push Notification subscriptions
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth_key    TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

-- AI response cache table
CREATE TABLE IF NOT EXISTS public.ai_cache (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key    TEXT NOT NULL UNIQUE,   -- hash of user_id + route + params
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  route        TEXT NOT NULL,          -- 'grade-predictor' | 'study-planner'
  response     JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL    -- generated_at + 6 hours
);

-- Subscription plans column (already added by quota-migration.sql but ensure it's here)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro')),
  ADD COLUMN IF NOT EXISTS ai_requests_today  INTEGER   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_quota_reset_at  TIMESTAMPTZ DEFAULT now();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_cache_key             ON public.ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires         ON public.ai_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_plan            ON public.profiles(plan);

-- RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own cache" ON public.ai_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manages cache" ON public.ai_cache
  FOR ALL USING (true);

-- Function to clean expired cache entries (call periodically)
CREATE OR REPLACE FUNCTION public.clean_expired_ai_cache()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.ai_cache WHERE expires_at < now();
END;
$$;
