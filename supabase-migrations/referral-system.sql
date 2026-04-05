-- Referral System Schema
-- Run in Supabase SQL Editor

-- 1. Add referral_code column to profiles (unique per user, generated on registration)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12) UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_credits INTEGER DEFAULT 0; -- months of free access earned

-- Generate referral codes for existing users who don't have one
UPDATE profiles
SET referral_code = UPPER(SUBSTRING(MD5(id::text || RANDOM()::text), 1, 8))
WHERE referral_code IS NULL;

-- 2. Referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted_at TIMESTAMP WITH TIME ZONE, -- when referred user upgraded to paid
  reward_granted BOOLEAN DEFAULT FALSE,   -- whether referrer got their free month
  reward_granted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referred_id) -- each user can only be referred once
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (to see who they referred)
CREATE POLICY "Users can view their own referrals"
ON referrals FOR SELECT
USING (referrer_id = auth.uid());

-- Service role has full access (for cron/backend updates)
CREATE POLICY "Service role full access to referrals"
ON referrals FOR ALL USING (true);

-- 3. Function to generate referral code on new user creation
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.id::text || EXTRACT(EPOCH FROM NOW())::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on profiles insert
DROP TRIGGER IF EXISTS set_referral_code ON profiles;
CREATE TRIGGER set_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();
