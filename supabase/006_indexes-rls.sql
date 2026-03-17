-- ============================================================
-- Migration 006: Performance indexes + RLS gap fixes
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Performance indexes ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_student_subjects_student   ON public.student_subjects(student_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_subject   ON public.student_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_student      ON public.topic_mastery(student_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_subject      ON public.topic_mastery(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_student        ON public.study_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student      ON public.quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_subject      ON public.quiz_attempts(subject_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student    ON public.lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user         ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_messages_recipient         ON public.messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender            ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_student     ON public.student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_student_streaks_student    ON public.student_streaks(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role              ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_subject ON public.uploaded_documents(subject_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_status  ON public.uploaded_documents(moderation_status);

-- ── RLS: messages ────────────────────────────────────────────
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own messages" ON public.messages;
CREATE POLICY "Users can read their own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Recipients can mark messages read" ON public.messages;
CREATE POLICY "Recipients can mark messages read" ON public.messages
  FOR UPDATE USING (auth.uid() = recipient_id);

-- ── RLS: notifications ───────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ── RLS: bookmarks ───────────────────────────────────────────
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own bookmarks" ON public.bookmarks;
CREATE POLICY "Users manage own bookmarks" ON public.bookmarks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── RLS: announcements ───────────────────────────────────────
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read announcements" ON public.announcements;
CREATE POLICY "Anyone authenticated can read announcements" ON public.announcements
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
