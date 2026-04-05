-- Gift Cards & Tournaments Schema
-- Run in Supabase SQL Editor

-- ── Gift codes table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gift_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(16) UNIQUE NOT NULL,
  -- What the gift grants
  plan_tier VARCHAR(20) NOT NULL,        -- 'starter' | 'pro' | 'elite'
  days INTEGER NOT NULL,                  -- e.g. 30, 90, 365
  amount_usd DECIMAL(8,2) NOT NULL,
  -- Purchaser (may be unregistered/diaspora)
  purchaser_email VARCHAR(255) NOT NULL,
  purchaser_name VARCHAR(255),
  -- Recipient
  recipient_email VARCHAR(255),           -- pre-filled if gifting to known student
  recipient_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  gift_message TEXT,
  -- Payment
  payment_id UUID,                        -- FK to payments table
  paid BOOLEAN DEFAULT FALSE,
  -- Redemption
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year')
);

ALTER TABLE gift_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can redeem a gift code (checked by code lookup)
DROP POLICY IF EXISTS "Anyone can read gift codes by code" ON gift_codes;
CREATE POLICY "Anyone can read gift codes by code"
ON gift_codes FOR SELECT USING (true);

-- Service role manages everything
DROP POLICY IF EXISTS "Service role manages gift codes" ON gift_codes;
CREATE POLICY "Service role manages gift codes"
ON gift_codes FOR ALL USING (true);

-- ── Tournaments schema ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),                   -- null = all subjects
  zimsec_level VARCHAR(50),               -- null = all levels
  entry_fee_usd DECIMAL(8,2) DEFAULT 1.00,
  prize_pool_usd DECIMAL(8,2) DEFAULT 0,
  max_participants INTEGER DEFAULT 500,
  status VARCHAR(20) DEFAULT 'upcoming',  -- 'upcoming' | 'active' | 'ended'
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  question_count INTEGER DEFAULT 20,
  time_limit_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournament_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  payment_id UUID,                        -- nil for free tournaments
  paid BOOLEAN DEFAULT FALSE,
  score INTEGER,                          -- null until completed
  correct_answers INTEGER,
  time_taken_seconds INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  rank INTEGER,                           -- filled after tournament ends
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view tournaments" ON tournaments;
CREATE POLICY "Anyone can view tournaments"
ON tournaments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their own entries" ON tournament_entries;
CREATE POLICY "Users can view their own entries"
ON tournament_entries FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage tournaments" ON tournaments;
CREATE POLICY "Admins can manage tournaments"
ON tournaments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Service role manages tournament entries" ON tournament_entries;
CREATE POLICY "Service role manages tournament entries"
ON tournament_entries FOR ALL USING (true);
