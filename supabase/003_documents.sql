-- ============================================================
-- ZimLearn: Document Upload & Content Management System
-- Run this in Supabase SQL Editor after 002_features.sql
-- ============================================================

-- ── uploaded_documents ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS uploaded_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  document_type text NOT NULL CHECK (document_type IN (
    'past_paper', 'notes', 'textbook', 'syllabus', 'marking_scheme', 'other'
  )),
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  zimsec_level text CHECK (zimsec_level IN ('primary', 'olevel', 'alevel')),
  year integer,
  paper_number integer,
  file_url text NOT NULL DEFAULT '',   -- legacy / fallback
  file_path text NOT NULL,             -- Supabase storage path
  file_name text NOT NULL,
  file_size bigint,
  extracted_text text,                 -- Claude-extracted full text
  ai_summary text,                     -- Claude-generated summary (≤300 words)
  topics text[] DEFAULT '{}',          -- AI-identified key topics
  moderation_status text NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'processing', 'ai_reviewed', 'published', 'rejected')),
  moderation_notes text,               -- AI or human review notes
  visibility text NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'subject', 'public')),
  uploaded_by uuid REFERENCES auth.users(id) NOT NULL,
  uploader_role text NOT NULL CHECK (uploader_role IN ('student', 'teacher', 'admin')),
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_documents_subject  ON uploaded_documents(subject_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploader ON uploaded_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_status   ON uploaded_documents(moderation_status);
CREATE INDEX IF NOT EXISTS idx_documents_type     ON uploaded_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_visibility ON uploaded_documents(visibility, moderation_status);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;

-- Owners always see their own
CREATE POLICY "owners_see_own_documents" ON uploaded_documents
  FOR SELECT USING (uploaded_by = auth.uid());

-- Admins see and modify all
CREATE POLICY "admins_full_access_documents" ON uploaded_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated users see published documents for their subject
CREATE POLICY "authenticated_see_published" ON uploaded_documents
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND moderation_status = 'published'
    AND visibility IN ('subject', 'public')
  );

-- Any authenticated user can insert (upload)
CREATE POLICY "authenticated_can_upload" ON uploaded_documents
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND uploaded_by = auth.uid());

-- Owners can update their pending documents (edit metadata before approval)
CREATE POLICY "owners_update_pending" ON uploaded_documents
  FOR UPDATE USING (
    uploaded_by = auth.uid()
    AND moderation_status IN ('pending', 'ai_reviewed')
  );

-- ── Missing tables referenced in existing API routes ────────

-- quiz_attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic text NOT NULL,
  score integer NOT NULL,
  total integer NOT NULL,
  questions jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_subject ON quiz_attempts(subject_id);
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_see_own_attempts" ON quiz_attempts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM student_profiles WHERE id = student_id AND user_id = auth.uid())
  );

-- topic_mastery
CREATE TABLE IF NOT EXISTS topic_mastery (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic text NOT NULL,
  mastery_level text NOT NULL CHECK (mastery_level IN ('mastered', 'competent', 'learning', 'not_started')),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_id, topic)
);
CREATE INDEX IF NOT EXISTS idx_mastery_student ON topic_mastery(student_id);
ALTER TABLE topic_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_manage_own_mastery" ON topic_mastery
  FOR ALL USING (
    EXISTS (SELECT 1 FROM student_profiles WHERE id = student_id AND user_id = auth.uid())
  );

-- student_streaks
CREATE TABLE IF NOT EXISTS student_streaks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL UNIQUE REFERENCES student_profiles(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  total_xp integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE student_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_see_own_streak" ON student_streaks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM student_profiles WHERE id = student_id AND user_id = auth.uid())
  );
-- Parents and teachers can view (needed for dashboards)
CREATE POLICY "all_can_view_streaks" ON student_streaks
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- student_badges
CREATE TABLE IF NOT EXISTS student_badges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  badge_name text NOT NULL,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(student_id, badge_type)
);
CREATE INDEX IF NOT EXISTS idx_badges_student ON student_badges(student_id);
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_see_own_badges" ON student_badges
  FOR ALL USING (
    EXISTS (SELECT 1 FROM student_profiles WHERE id = student_id AND user_id = auth.uid())
  );
CREATE POLICY "all_can_view_badges" ON student_badges
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- study_plans
CREATE TABLE IF NOT EXISTS study_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL UNIQUE REFERENCES student_profiles(id) ON DELETE CASCADE,
  exam_date date,
  plan_data jsonb,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_manage_own_plan" ON study_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM student_profiles WHERE id = student_id AND user_id = auth.uid())
  );

-- ── Supabase Storage bucket note ─────────────────────────────
-- Create a PRIVATE bucket called "platform-documents" in your
-- Supabase dashboard (Storage → New bucket → uncheck "Public bucket")
-- Files are served via signed URLs generated server-side.
-- Suggested bucket policy (Storage → Policies):
--   INSERT: authenticated users (path: {user_id}/*)
--   SELECT: authenticated users (server-side signed URL generation)
--   DELETE: owner or admin only
