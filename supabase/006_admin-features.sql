-- ============================================================
-- ZimLearn — Migration 006: Admin Feature Tables
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Teacher approval columns ─────────────────────────────────
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS approval_notes TEXT;
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- ── Account suspension on profiles ───────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES profiles(id);

-- ── Question bank ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy','medium','hard')) DEFAULT 'medium',
  question_text TEXT NOT NULL,
  options JSONB,        -- [{label:'A',text:'...'}, ...] for MCQ; null for open-ended
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access questions" ON questions;
DROP POLICY IF EXISTS "Authenticated read questions" ON questions;
CREATE POLICY "Admin full access questions" ON questions FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Authenticated read questions" ON questions FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS questions_subject_idx ON questions(subject_id);
CREATE INDEX IF NOT EXISTS questions_difficulty_idx ON questions(difficulty);
CREATE INDEX IF NOT EXISTS questions_topic_idx ON questions(topic);

-- ── Platform settings ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id)
);
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access settings" ON platform_settings;
CREATE POLICY "Admin full access settings" ON platform_settings FOR ALL USING (public.get_my_role() = 'admin');

INSERT INTO platform_settings (key, value) VALUES
  ('maintenance_mode',           'false'),
  ('free_tier_quiz_limit',       '10'),
  ('free_tier_ai_messages',      '20'),
  ('max_upload_size_mb',         '50'),
  ('allow_student_registration', 'true'),
  ('allow_teacher_registration', 'true'),
  ('featured_subjects',          '[]')
ON CONFLICT (key) DO NOTHING;

-- ── Audit logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin read audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admin insert audit logs" ON audit_logs;
CREATE POLICY "Admin read audit logs"   ON audit_logs FOR SELECT USING (public.get_my_role() = 'admin');
CREATE POLICY "Admin insert audit logs" ON audit_logs FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

CREATE INDEX IF NOT EXISTS audit_logs_admin_idx    ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx  ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_resource_idx ON audit_logs(resource_type, resource_id);
