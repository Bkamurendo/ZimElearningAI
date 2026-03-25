-- Daily Challenges feature
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  zimsec_level zimsec_level NOT NULL,
  title TEXT NOT NULL, -- e.g. "Tuesday Challenge — Mixed Subjects"
  questions JSONB NOT NULL, -- array of 5 question objects
  xp_reward INT DEFAULT 50,
  bonus_xp INT DEFAULT 25, -- bonus for perfect score
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_date, zimsec_level)
);

CREATE TABLE IF NOT EXISTS daily_challenge_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL, -- [{questionIndex: 0, selected: 'A', correct: true}, ...]
  score INT NOT NULL, -- number correct out of 5
  xp_earned INT NOT NULL,
  time_taken_seconds INT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id) -- one attempt per day per user
);

ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenge_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenges_public_read" ON daily_challenges FOR SELECT USING (true);
CREATE POLICY "attempts_own" ON daily_challenge_attempts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "attempts_read_leaderboard" ON daily_challenge_attempts FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS challenge_date_level_idx ON daily_challenges(challenge_date, zimsec_level);
CREATE INDEX IF NOT EXISTS attempts_challenge_idx ON daily_challenge_attempts(challenge_id);
CREATE INDEX IF NOT EXISTS attempts_user_idx ON daily_challenge_attempts(user_id);
