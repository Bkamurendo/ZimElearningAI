-- Student Gamification & Social Infrastructure
-- Run in Supabase SQL Editor

-- ── 1. Badges & Mastering ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_name VARCHAR(50),                  -- lucide icon name
  criteria_type VARCHAR(50),               -- 'subject_mastery', 'streak', 'tournament_win'
  criteria_value INTEGER,                  -- e.g. 100 for 100% mastery
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ── 2. Study Squads (Social) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_private BOOLEAN DEFAULT FALSE,
  invite_code VARCHAR(10) UNIQUE,
  max_members INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_squad_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID REFERENCES study_squads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) DEFAULT 'member',      -- 'admin' | 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(squad_id, user_id)
);

-- ── 3. AI Study Autopilot Plans ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_autopilot_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  plan_data JSONB NOT NULL,               -- The 30-day schedule array
  starts_at DATE NOT NULL,
  ends_at DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── RLS Policies ────────────────────────────────────────────────────────────
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_autopilot_plans ENABLE ROW LEVEL SECURITY;

-- Reading badges/squads is public for students
DROP POLICY IF EXISTS "Anyone can view badges" ON badges;
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view all squads" ON study_squads;
CREATE POLICY "Users can view all squads" ON study_squads FOR SELECT USING (true);

-- User-specific access
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own autopilot plans" ON study_autopilot_plans;
CREATE POLICY "Users can view own autopilot plans" ON study_autopilot_plans FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Members can view squad membership" ON study_squad_members;
CREATE POLICY "Members can view squad membership" ON study_squad_members FOR SELECT USING (true);

-- Management
DROP POLICY IF EXISTS "Users can join squads" ON study_squad_members;
CREATE POLICY "Users can join squads" ON study_squad_members FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage squads" ON study_squads;
CREATE POLICY "Admins can manage squads" ON study_squads FOR ALL USING (created_by = auth.uid());
