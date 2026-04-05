-- 1. Extend profiles to support monitoring for parents
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monitoring_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Extend payments table to support one-time items
ALTER TABLE payments ADD COLUMN IF NOT EXISTS item_type VARCHAR(50); -- 'subscription', 'ai_grade_report', 'subject_pack'
ALTER TABLE payments ADD COLUMN IF NOT EXISTS item_id VARCHAR(100);   -- subject_id, etc.

-- 3. One-time purchases tracking table (separate from payments for cleaner history)
CREATE TABLE IF NOT EXISTS one_time_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_type VARCHAR(50) NOT NULL, -- 'ai_grade_report', 'subject_pack', 'tournament_entry'
  item_id VARCHAR(100),          -- subject_id or tournament_id
  amount_usd DECIMAL(8,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  payment_id UUID,                -- reference to payments table
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB                 -- for extra info like current score, etc.
);

ALTER TABLE one_time_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own one-time purchases"
ON one_time_purchases FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role manages one-time purchases"
ON one_time_purchases FOR ALL USING (true);

-- 3. Subject-specific access table (for students who buy single subjects)
CREATE TABLE IF NOT EXISTS subject_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = permanent for current year
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subject_id)
);

ALTER TABLE subject_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subject access"
ON subject_access FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role manages subject access"
ON subject_access FOR ALL USING (true);
