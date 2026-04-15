-- ============================================================
-- ZIM E-LEARNING PLATFORM — COMPLETE SUPABASE SCHEMA
-- v2.0 — All 24 tables
--
-- HOW TO RUN:
--   1. Go to supabase.com → your project → SQL Editor
--   2. Click "New query"
--   3. Paste this entire file and click Run
--   4. You should see "Success. No rows returned."
--
-- SAFE TO RE-RUN: uses CREATE IF NOT EXISTS / DO $$ patterns
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fast text search

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role    AS ENUM ('student', 'teacher', 'parent', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE zimsec_level AS ENUM ('primary', 'olevel', 'alevel');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE doc_type AS ENUM ('past_paper', 'marking_scheme', 'notes', 'textbook', 'syllabus', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE doc_status AS ENUM ('pending', 'processing', 'ai_reviewed', 'published', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE doc_visibility AS ENUM ('private', 'subject', 'public');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mastery_level AS ENUM ('not_started', 'learning', 'practicing', 'mastered');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE announcement_audience AS ENUM ('all', 'students', 'teachers', 'parents');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE announcement_priority AS ENUM ('normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- HELPER FUNCTION: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT        NOT NULL UNIQUE,
  full_name             TEXT,
  avatar_url            TEXT,
  role                  user_role   NOT NULL DEFAULT 'student',
  onboarding_completed  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-create profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- HELPER FUNCTION: get current user role
-- (defined AFTER profiles table so the table reference resolves)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 2. STUDENT PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.student_profiles (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  zimsec_level zimsec_level NOT NULL,
  grade        TEXT,
  parent_id    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS student_profiles_updated_at ON public.student_profiles;
CREATE TRIGGER student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 3. TEACHER PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  qualification TEXT,
  bio           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS teacher_profiles_updated_at ON public.teacher_profiles;
CREATE TRIGGER teacher_profiles_updated_at
  BEFORE UPDATE ON public.teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 4. PARENT PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.parent_profiles (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone_number TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. SUBJECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subjects (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT         NOT NULL,
  code         TEXT         NOT NULL UNIQUE,
  zimsec_level zimsec_level NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. STUDENT ↔ SUBJECT ENROLMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.student_subjects (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID        NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  subject_id  UUID        NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, subject_id)
);

-- ============================================================
-- 7. TEACHER ↔ SUBJECT ASSIGNMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.teacher_subjects (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id  UUID        NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
  subject_id  UUID        NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(teacher_id, subject_id)
);

-- ============================================================
-- 8. UPLOADED DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.uploaded_documents (
  id                UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             TEXT           NOT NULL,
  description       TEXT,
  document_type     doc_type       NOT NULL DEFAULT 'other',
  subject_id        UUID           REFERENCES public.subjects(id) ON DELETE SET NULL,
  zimsec_level      zimsec_level,
  year              INTEGER,
  paper_number      INTEGER,
  file_path         TEXT           NOT NULL,
  file_name         TEXT           NOT NULL,
  file_size         BIGINT,
  file_url          TEXT           NOT NULL DEFAULT '',
  extracted_text    TEXT,
  ai_summary        TEXT,
  topics            TEXT[],
  uploaded_by       UUID           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploader_role     TEXT           NOT NULL DEFAULT 'student',
  moderation_status doc_status     NOT NULL DEFAULT 'pending',
  moderation_notes  TEXT,
  visibility        doc_visibility NOT NULL DEFAULT 'private',
  processed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS uploaded_documents_subject_idx    ON public.uploaded_documents(subject_id);
CREATE INDEX IF NOT EXISTS uploaded_documents_status_idx     ON public.uploaded_documents(moderation_status);
CREATE INDEX IF NOT EXISTS uploaded_documents_uploader_idx   ON public.uploaded_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS uploaded_documents_visibility_idx ON public.uploaded_documents(visibility, moderation_status);
CREATE INDEX IF NOT EXISTS uploaded_documents_search_idx     ON public.uploaded_documents USING gin(to_tsvector('english', title || ' ' || COALESCE(ai_summary, '')));

-- ============================================================
-- 9. DOCUMENT STUDY CONTENT (cached AI-generated materials)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.document_study_content (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id  UUID        NOT NULL REFERENCES public.uploaded_documents(id) ON DELETE CASCADE,
  content_type TEXT        NOT NULL, -- 'teaching_guide' | 'snap_notes' | 'glossary' | 'practice_questions'
  content      JSONB       NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_id, content_type)
);

CREATE INDEX IF NOT EXISTS doc_study_content_doc_idx ON public.document_study_content(document_id);

-- ============================================================
-- 10. COURSES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.courses (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id  UUID        NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id  UUID        REFERENCES public.teacher_profiles(id) ON DELETE SET NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  published   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS courses_updated_at ON public.courses;
CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS courses_subject_idx ON public.courses(subject_id);
CREATE INDEX IF NOT EXISTS courses_teacher_idx ON public.courses(teacher_id);

-- ============================================================
-- 11. LESSONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lessons (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id    UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  content_type TEXT        NOT NULL DEFAULT 'text', -- 'text' | 'video' | 'quiz' | 'pdf'
  content      TEXT,
  order_index  INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS lessons_updated_at ON public.lessons;
CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS lessons_course_idx ON public.lessons(course_id, order_index);

-- ============================================================
-- 12. LESSON PROGRESS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID        NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  lesson_id    UUID        NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS lesson_progress_student_idx ON public.lesson_progress(student_id);

-- ============================================================
-- 13. QUIZ ATTEMPTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID        NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  subject_id UUID        REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic      TEXT,
  score      INTEGER     NOT NULL DEFAULT 0,
  total      INTEGER     NOT NULL DEFAULT 0,
  questions  JSONB       NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quiz_attempts_student_idx ON public.quiz_attempts(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS quiz_attempts_subject_idx ON public.quiz_attempts(subject_id);

-- ============================================================
-- 14. TOPIC MASTERY
-- ============================================================

CREATE TABLE IF NOT EXISTS public.topic_mastery (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID          NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  subject_id    UUID          REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic         TEXT          NOT NULL,
  mastery_level mastery_level NOT NULL DEFAULT 'not_started',
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, topic)
);

CREATE INDEX IF NOT EXISTS topic_mastery_student_idx ON public.topic_mastery(student_id);
CREATE INDEX IF NOT EXISTS topic_mastery_level_idx   ON public.topic_mastery(student_id, mastery_level);

-- ============================================================
-- 15. STUDENT STREAKS & XP
-- ============================================================

CREATE TABLE IF NOT EXISTS public.student_streaks (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id         UUID        NOT NULL UNIQUE REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  current_streak     INTEGER     NOT NULL DEFAULT 0,
  longest_streak     INTEGER     NOT NULL DEFAULT 0,
  last_activity_date DATE,
  total_xp           INTEGER     NOT NULL DEFAULT 0,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS student_streaks_xp_idx ON public.student_streaks(total_xp DESC);

-- ============================================================
-- 16. STUDENT BADGES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.student_badges (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID        NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  badge_type TEXT        NOT NULL,
  badge_name TEXT        NOT NULL,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS student_badges_student_idx ON public.student_badges(student_id, earned_at DESC);

-- ============================================================
-- 17. ASSIGNMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.assignments (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id  UUID        NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id  UUID        NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT,
  due_date    TIMESTAMPTZ,
  max_score   INTEGER     NOT NULL DEFAULT 100,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS assignments_updated_at ON public.assignments;
CREATE TRIGGER assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS assignments_teacher_idx  ON public.assignments(teacher_id);
CREATE INDEX IF NOT EXISTS assignments_subject_idx  ON public.assignments(subject_id);

-- ============================================================
-- 18. ASSIGNMENT SUBMISSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID        NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id    UUID        NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  content       TEXT,
  file_path     TEXT,
  score         INTEGER,
  feedback      TEXT,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  graded_at     TIMESTAMPTZ,
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS assignment_submissions_assignment_idx ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS assignment_submissions_student_idx    ON public.assignment_submissions(student_id);

-- ============================================================
-- 19. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL DEFAULT 'general',
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  metadata   JSONB       NOT NULL DEFAULT '{}',
  read       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx    ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx  ON public.notifications(user_id, read) WHERE read = FALSE;

-- ============================================================
-- 20. ANNOUNCEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.announcements (
  id         UUID                     PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      TEXT                     NOT NULL,
  body       TEXT                     NOT NULL,
  audience   announcement_audience    NOT NULL DEFAULT 'all',
  priority   announcement_priority    NOT NULL DEFAULT 'normal',
  is_active  BOOLEAN                  NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  posted_by  UUID                     REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ              NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS announcements_active_idx    ON public.announcements(is_active, audience);
CREATE INDEX IF NOT EXISTS announcements_created_idx   ON public.announcements(created_at DESC);

-- ============================================================
-- 21. BOOKMARKS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID        NOT NULL REFERENCES public.uploaded_documents(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, document_id)
);

CREATE INDEX IF NOT EXISTS bookmarks_user_idx ON public.bookmarks(user_id, created_at DESC);

-- ============================================================
-- 22. MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id   UUID        REFERENCES public.subjects(id) ON DELETE SET NULL,
  content      TEXT        NOT NULL,
  read         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_recipient_idx ON public.messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_idx    ON public.messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_unread_idx    ON public.messages(recipient_id, read) WHERE read = FALSE;

-- ============================================================
-- 23. STUDY PLANS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.study_plans (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID        NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  exam_date  DATE,
  plan_data  JSONB       NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS study_plans_updated_at ON public.study_plans;
CREATE TRIGGER study_plans_updated_at
  BEFORE UPDATE ON public.study_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS study_plans_student_idx ON public.study_plans(student_id);

-- ============================================================
-- 24. AI CHAT MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID        REFERENCES public.subjects(id) ON DELETE SET NULL,
  role       TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_chat_user_idx    ON public.ai_chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_chat_subject_idx ON public.ai_chat_messages(user_id, subject_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY — enable on all tables
-- ============================================================

ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subjects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_documents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_study_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_mastery          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_streaks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- ── profiles ──────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_update"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin"        ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.get_my_role() IN ('teacher', 'admin'));

CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin" ON public.profiles FOR ALL
  USING (public.get_my_role() = 'admin');

-- ── student_profiles ──────────────────────────────────────
DROP POLICY IF EXISTS "sp_own"    ON public.student_profiles;
DROP POLICY IF EXISTS "sp_parent" ON public.student_profiles;
DROP POLICY IF EXISTS "sp_staff"  ON public.student_profiles;
DROP POLICY IF EXISTS "sp_insert" ON public.student_profiles;
DROP POLICY IF EXISTS "sp_update" ON public.student_profiles;

CREATE POLICY "sp_own"    ON public.student_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "sp_parent" ON public.student_profiles FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "sp_staff"  ON public.student_profiles FOR SELECT USING (public.get_my_role() IN ('teacher', 'admin'));
CREATE POLICY "sp_insert" ON public.student_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "sp_update" ON public.student_profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── teacher_profiles ──────────────────────────────────────
DROP POLICY IF EXISTS "tp_view"   ON public.teacher_profiles;
DROP POLICY IF EXISTS "tp_manage" ON public.teacher_profiles;

CREATE POLICY "tp_view"   ON public.teacher_profiles FOR SELECT USING (true);
CREATE POLICY "tp_manage" ON public.teacher_profiles FOR ALL USING (user_id = auth.uid() OR public.get_my_role() = 'admin');

-- ── parent_profiles ───────────────────────────────────────
DROP POLICY IF EXISTS "pp_manage" ON public.parent_profiles;
CREATE POLICY "pp_manage" ON public.parent_profiles FOR ALL USING (user_id = auth.uid() OR public.get_my_role() = 'admin');

-- ── subjects ──────────────────────────────────────────────
DROP POLICY IF EXISTS "subjects_view"  ON public.subjects;
DROP POLICY IF EXISTS "subjects_admin" ON public.subjects;

CREATE POLICY "subjects_view"  ON public.subjects FOR SELECT USING (true);
CREATE POLICY "subjects_admin" ON public.subjects FOR ALL   USING (public.get_my_role() = 'admin');

-- ── student_subjects ──────────────────────────────────────
DROP POLICY IF EXISTS "ss_own"   ON public.student_subjects;
DROP POLICY IF EXISTS "ss_staff" ON public.student_subjects;

CREATE POLICY "ss_own"   ON public.student_subjects FOR ALL
  USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "ss_staff" ON public.student_subjects FOR SELECT
  USING (public.get_my_role() IN ('teacher', 'admin'));

-- ── teacher_subjects ──────────────────────────────────────
DROP POLICY IF EXISTS "ts_own" ON public.teacher_subjects;

CREATE POLICY "ts_own" ON public.teacher_subjects FOR ALL
  USING (
    teacher_id IN (SELECT id FROM public.teacher_profiles WHERE user_id = auth.uid())
    OR public.get_my_role() = 'admin'
  );

-- ── uploaded_documents ────────────────────────────────────
DROP POLICY IF EXISTS "docs_public"    ON public.uploaded_documents;
DROP POLICY IF EXISTS "docs_subject"   ON public.uploaded_documents;
DROP POLICY IF EXISTS "docs_own"       ON public.uploaded_documents;
DROP POLICY IF EXISTS "docs_admin"     ON public.uploaded_documents;
DROP POLICY IF EXISTS "docs_insert"    ON public.uploaded_documents;

-- Public docs visible to all authenticated users
CREATE POLICY "docs_public" ON public.uploaded_documents FOR SELECT
  USING (auth.uid() IS NOT NULL AND visibility = 'public' AND moderation_status = 'published');

-- Subject docs visible to enrolled students + teacher's subjects + admins
CREATE POLICY "docs_subject" ON public.uploaded_documents FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND visibility = 'subject' AND moderation_status = 'published'
    AND (
      public.get_my_role() IN ('teacher', 'admin')
      OR subject_id IN (
        SELECT ss.subject_id FROM public.student_subjects ss
        JOIN public.student_profiles sp ON ss.student_id = sp.id
        WHERE sp.user_id = auth.uid()
      )
    )
  );

-- Own uploads always visible to uploader
CREATE POLICY "docs_own" ON public.uploaded_documents FOR SELECT
  USING (uploaded_by = auth.uid());

-- Admin sees everything + can update/delete
CREATE POLICY "docs_admin" ON public.uploaded_documents FOR ALL
  USING (public.get_my_role() = 'admin');

-- Authenticated users can insert
CREATE POLICY "docs_insert" ON public.uploaded_documents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND uploaded_by = auth.uid());

-- Uploader can update own docs
CREATE POLICY "docs_update_own" ON public.uploaded_documents FOR UPDATE
  USING (uploaded_by = auth.uid());

-- ── document_study_content ────────────────────────────────
DROP POLICY IF EXISTS "dsc_select" ON public.document_study_content;
DROP POLICY IF EXISTS "dsc_insert" ON public.document_study_content;

CREATE POLICY "dsc_select" ON public.document_study_content FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "dsc_insert" ON public.document_study_content FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ── courses ───────────────────────────────────────────────
DROP POLICY IF EXISTS "courses_view"   ON public.courses;
DROP POLICY IF EXISTS "courses_manage" ON public.courses;

CREATE POLICY "courses_view" ON public.courses FOR SELECT
  USING (
    published = true
    OR public.get_my_role() = 'admin'
    OR teacher_id IN (SELECT id FROM public.teacher_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "courses_manage" ON public.courses FOR ALL
  USING (
    teacher_id IN (SELECT id FROM public.teacher_profiles WHERE user_id = auth.uid())
    OR public.get_my_role() = 'admin'
  );

-- ── lessons ───────────────────────────────────────────────
DROP POLICY IF EXISTS "lessons_view"   ON public.lessons;
DROP POLICY IF EXISTS "lessons_manage" ON public.lessons;

CREATE POLICY "lessons_view" ON public.lessons FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "lessons_manage" ON public.lessons FOR ALL
  USING (
    course_id IN (
      SELECT id FROM public.courses
      WHERE teacher_id IN (SELECT id FROM public.teacher_profiles WHERE user_id = auth.uid())
    )
    OR public.get_my_role() = 'admin'
  );

-- ── lesson_progress ───────────────────────────────────────
DROP POLICY IF EXISTS "lp_own"   ON public.lesson_progress;
DROP POLICY IF EXISTS "lp_staff" ON public.lesson_progress;

CREATE POLICY "lp_own" ON public.lesson_progress FOR ALL
  USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "lp_staff" ON public.lesson_progress FOR SELECT
  USING (public.get_my_role() IN ('teacher', 'admin'));

-- ── quiz_attempts ─────────────────────────────────────────
DROP POLICY IF EXISTS "qa_own"   ON public.quiz_attempts;
DROP POLICY IF EXISTS "qa_staff" ON public.quiz_attempts;

CREATE POLICY "qa_own" ON public.quiz_attempts FOR ALL
  USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "qa_staff" ON public.quiz_attempts FOR SELECT
  USING (public.get_my_role() IN ('teacher', 'admin'));

-- ── topic_mastery ─────────────────────────────────────────
DROP POLICY IF EXISTS "tm_own"   ON public.topic_mastery;
DROP POLICY IF EXISTS "tm_staff" ON public.topic_mastery;

CREATE POLICY "tm_own" ON public.topic_mastery FOR ALL
  USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "tm_staff" ON public.topic_mastery FOR SELECT
  USING (public.get_my_role() IN ('teacher', 'admin', 'parent'));

-- ── student_streaks ───────────────────────────────────────
DROP POLICY IF EXISTS "streaks_own"   ON public.student_streaks;
DROP POLICY IF EXISTS "streaks_view"  ON public.student_streaks;

CREATE POLICY "streaks_own"  ON public.student_streaks FOR ALL
  USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

-- Leaderboard: all authenticated users can view streaks
CREATE POLICY "streaks_view" ON public.student_streaks FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── student_badges ────────────────────────────────────────
DROP POLICY IF EXISTS "badges_own"  ON public.student_badges;
DROP POLICY IF EXISTS "badges_view" ON public.student_badges;

CREATE POLICY "badges_own"  ON public.student_badges FOR ALL
  USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "badges_view" ON public.student_badges FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── assignments ───────────────────────────────────────────
DROP POLICY IF EXISTS "assign_view"   ON public.assignments;
DROP POLICY IF EXISTS "assign_manage" ON public.assignments;

CREATE POLICY "assign_view" ON public.assignments FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      public.get_my_role() IN ('teacher', 'admin')
      OR subject_id IN (
        SELECT ss.subject_id FROM public.student_subjects ss
        JOIN public.student_profiles sp ON ss.student_id = sp.id
        WHERE sp.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "assign_manage" ON public.assignments FOR ALL
  USING (
    teacher_id IN (SELECT id FROM public.teacher_profiles WHERE user_id = auth.uid())
    OR public.get_my_role() = 'admin'
  );

-- ── assignment_submissions ────────────────────────────────
DROP POLICY IF EXISTS "asub_own"     ON public.assignment_submissions;
DROP POLICY IF EXISTS "asub_teacher" ON public.assignment_submissions;

CREATE POLICY "asub_own" ON public.assignment_submissions FOR ALL
  USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "asub_teacher" ON public.assignment_submissions FOR SELECT
  USING (
    assignment_id IN (
      SELECT id FROM public.assignments
      WHERE teacher_id IN (SELECT id FROM public.teacher_profiles WHERE user_id = auth.uid())
    )
    OR public.get_my_role() = 'admin'
  );

CREATE POLICY "asub_teacher_grade" ON public.assignment_submissions FOR UPDATE
  USING (
    assignment_id IN (
      SELECT id FROM public.assignments
      WHERE teacher_id IN (SELECT id FROM public.teacher_profiles WHERE user_id = auth.uid())
    )
    OR public.get_my_role() = 'admin'
  );

-- ── notifications ─────────────────────────────────────────
DROP POLICY IF EXISTS "notif_own"   ON public.notifications;
DROP POLICY IF EXISTS "notif_admin" ON public.notifications;

CREATE POLICY "notif_own" ON public.notifications FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "notif_admin" ON public.notifications FOR ALL
  USING (public.get_my_role() = 'admin');

-- ── announcements ─────────────────────────────────────────
DROP POLICY IF EXISTS "ann_view"   ON public.announcements;
DROP POLICY IF EXISTS "ann_manage" ON public.announcements;

CREATE POLICY "ann_view" ON public.announcements FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "ann_manage" ON public.announcements FOR ALL
  USING (public.get_my_role() = 'admin');

-- ── bookmarks ─────────────────────────────────────────────
DROP POLICY IF EXISTS "bm_own" ON public.bookmarks;

CREATE POLICY "bm_own" ON public.bookmarks FOR ALL
  USING (user_id = auth.uid());

-- ── messages ──────────────────────────────────────────────
DROP POLICY IF EXISTS "msg_select" ON public.messages;
DROP POLICY IF EXISTS "msg_insert" ON public.messages;
DROP POLICY IF EXISTS "msg_update" ON public.messages;

CREATE POLICY "msg_select" ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "msg_insert" ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "msg_update" ON public.messages FOR UPDATE
  USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

-- ── study_plans ───────────────────────────────────────────
DROP POLICY IF EXISTS "sp_plan_own" ON public.study_plans;

CREATE POLICY "sp_plan_own" ON public.study_plans FOR ALL
  USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

-- ── ai_chat_messages ──────────────────────────────────────
DROP POLICY IF EXISTS "chat_own" ON public.ai_chat_messages;

CREATE POLICY "chat_own" ON public.ai_chat_messages FOR ALL
  USING (user_id = auth.uid());

-- ============================================================
-- SEED DATA — ZIMSEC SUBJECTS
-- (safe to re-run — ON CONFLICT DO NOTHING)
-- ============================================================

INSERT INTO public.subjects (name, code, zimsec_level) VALUES
  -- PRIMARY
  ('Mathematics',           'PRI-MATH',  'primary'),
  ('English Language',      'PRI-ENG',   'primary'),
  ('Shona',                 'PRI-SHO',   'primary'),
  ('Ndebele',               'PRI-NDE',   'primary'),
  ('Environmental Science', 'PRI-ENV',   'primary'),
  ('Social Studies',        'PRI-SS',    'primary'),
  ('Heritage Studies',      'PRI-HER',   'primary'),
  -- O-LEVEL
  ('Mathematics',           'OL-MATH',   'olevel'),
  ('English Language',      'OL-ENG',    'olevel'),
  ('Shona',                 'OL-SHO',    'olevel'),
  ('Ndebele',               'OL-NDE',    'olevel'),
  ('Combined Science',      'OL-CSCI',   'olevel'),
  ('Physics',               'OL-PHY',    'olevel'),
  ('Chemistry',             'OL-CHEM',   'olevel'),
  ('Biology',               'OL-BIO',    'olevel'),
  ('History',               'OL-HIST',   'olevel'),
  ('Geography',             'OL-GEO',    'olevel'),
  ('Commerce',              'OL-COM',    'olevel'),
  ('Accounts',              'OL-ACC',    'olevel'),
  ('Business Studies',      'OL-BS',     'olevel'),
  ('Computer Science',      'OL-CS',     'olevel'),
  ('Food & Nutrition',      'OL-FN',     'olevel'),
  ('Art',                   'OL-ART',    'olevel'),
  ('Music',                 'OL-MUS',    'olevel'),
  ('Physical Education',    'OL-PE',     'olevel'),
  -- A-LEVEL
  ('Pure Mathematics',      'AL-PMATH',  'alevel'),
  ('Further Mathematics',   'AL-FMATH',  'alevel'),
  ('Statistics',            'AL-STAT',   'alevel'),
  ('Physics',               'AL-PHY',    'alevel'),
  ('Chemistry',             'AL-CHEM',   'alevel'),
  ('Biology',               'AL-BIO',    'alevel'),
  ('History',               'AL-HIST',   'alevel'),
  ('Geography',             'AL-GEO',    'alevel'),
  ('Economics',             'AL-ECON',   'alevel'),
  ('Accounting',            'AL-ACC',    'alevel'),
  ('Business Studies',      'AL-BS',     'alevel'),
  ('Computer Science',      'AL-CS',     'alevel'),
  ('Literature in English', 'AL-LIT',    'alevel'),
  ('Shona',                 'AL-SHO',    'alevel'),
  ('Ndebele',               'AL-NDE',    'alevel'),
  ('Divinity',              'AL-DIV',    'alevel'),
  ('Sociology',             'AL-SOC',    'alevel')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- STORAGE BUCKET SETUP NOTE
-- ============================================================
-- After running this schema, create the storage bucket manually:
--   1. Go to Supabase Dashboard → Storage
--   2. Click "New bucket"
--   3. Name: platform-documents
--   4. Public: OFF (private)
--   5. File size limit: 50MB
--   6. Allowed MIME types: application/pdf, text/plain, image/*
--
-- Then add this storage RLS policy in Storage → Policies:
--   "Authenticated users can upload"
--   INSERT: (auth.role() = 'authenticated')
--   "Users can read their own files"
--   SELECT: (auth.uid()::text = (storage.foldername(name))[2])
-- ============================================================

-- ============================================================
-- DONE — All 24 tables created successfully
-- ============================================================
