-- Trial Reminder Tracking — run once in Supabase SQL Editor
-- Prevents duplicate reminder emails at each stage

CREATE TABLE IF NOT EXISTS trial_reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL,
  -- '7_day' | '3_day' | '1_day' | 'expiry_day' | 'post_expiry'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  method VARCHAR(10) DEFAULT 'email', -- 'sms' or 'email'
  UNIQUE(user_id, stage)
);

ALTER TABLE trial_reminder_log ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by cron job)
CREATE POLICY "Service role full access to trial_reminder_log"
ON trial_reminder_log FOR ALL USING (true);
