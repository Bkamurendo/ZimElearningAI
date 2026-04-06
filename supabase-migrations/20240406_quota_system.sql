-- AI Quota & Subscription System Migration
-- Run in Supabase SQL Editor

-- 1. Add quota columns to profiles table if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ai_requests_today') THEN
        ALTER TABLE profiles ADD COLUMN ai_requests_today INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ai_quota_reset_at') THEN
        ALTER TABLE profiles ADD COLUMN ai_quota_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'plan') THEN
        ALTER TABLE profiles ADD COLUMN plan VARCHAR(20) DEFAULT 'free';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trial_ends_at') THEN
        ALTER TABLE profiles ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_expires_at') THEN
        ALTER TABLE profiles ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Ensure plan has a valid default
    UPDATE profiles SET plan = 'free' WHERE plan IS NULL;
END $$;

-- 2. Add index for faster quota resets
CREATE INDEX IF NOT EXISTS idx_profiles_quota_reset ON profiles(ai_quota_reset_at);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
