-- Learning Sessions tracking table
-- Stores individual learning activity records for the Learning Minutes Tracker

CREATE TABLE IF NOT EXISTS public.learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('lesson', 'quiz', 'ai_chat', 'flashcard', 'revision', 'video')),
  duration_minutes INTEGER NOT NULL DEFAULT 1,
  subject_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON public.learning_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions"
  ON public.learning_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_learning_sessions_user_date
  ON public.learning_sessions (user_id, created_at);

CREATE INDEX idx_learning_sessions_type
  ON public.learning_sessions (user_id, session_type);
