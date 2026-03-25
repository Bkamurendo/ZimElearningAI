-- ============================================================
-- ZimLearn — Migration 010: Student Learning Features
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Student Notes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  lesson_id  UUID REFERENCES lessons(id) ON DELETE SET NULL,
  title      TEXT NOT NULL DEFAULT 'Untitled Note',
  content    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students manage own notes" ON student_notes;
CREATE POLICY "Students manage own notes" ON student_notes
  FOR ALL USING (student_id = (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS student_notes_student_idx ON student_notes(student_id);
CREATE INDEX IF NOT EXISTS student_notes_lesson_idx  ON student_notes(lesson_id);
CREATE INDEX IF NOT EXISTS student_notes_subject_idx ON student_notes(subject_id);

-- ── Flashcards ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flashcards (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  lesson_id  UUID REFERENCES lessons(id) ON DELETE SET NULL,
  front      TEXT NOT NULL,
  back       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students manage own flashcards" ON flashcards;
CREATE POLICY "Students manage own flashcards" ON flashcards
  FOR ALL USING (student_id = (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS flashcards_student_idx ON flashcards(student_id);
CREATE INDEX IF NOT EXISTS flashcards_subject_idx ON flashcards(subject_id);

-- ── Discussions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discussions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  pinned     BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read discussions"   ON discussions;
DROP POLICY IF EXISTS "Authenticated insert discussions" ON discussions;
DROP POLICY IF EXISTS "Owner or admin delete discussion" ON discussions;
CREATE POLICY "Authenticated read discussions"   ON discussions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated insert discussions" ON discussions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner or admin delete discussion" ON discussions FOR DELETE USING (auth.uid() = user_id OR public.get_my_role() = 'admin');
CREATE INDEX IF NOT EXISTS discussions_subject_idx ON discussions(subject_id);
CREATE INDEX IF NOT EXISTS discussions_created_idx ON discussions(created_at DESC);

-- ── Discussion Replies ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discussion_replies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read replies"   ON discussion_replies;
DROP POLICY IF EXISTS "Authenticated insert replies" ON discussion_replies;
DROP POLICY IF EXISTS "Owner or admin delete reply"  ON discussion_replies;
CREATE POLICY "Authenticated read replies"   ON discussion_replies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated insert replies" ON discussion_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner or admin delete reply"  ON discussion_replies FOR DELETE USING (auth.uid() = user_id OR public.get_my_role() = 'admin');
CREATE INDEX IF NOT EXISTS replies_discussion_idx ON discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS replies_created_idx    ON discussion_replies(created_at);
