-- MaFundi Workspace: Student Notes, AI Logs & Exam Timetable
-- Run in Supabase SQL Editor

-- 1. Student Notes Table (if missing)
CREATE TABLE IF NOT EXISTS public.student_notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    subject_id  UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    title       TEXT NOT NULL,
    content     TEXT NOT NULL, -- Markdown content
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. AI Content Log Table (History of workspace generation)
CREATE TABLE IF NOT EXISTS public.ai_content_log (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id   UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    subject_id   UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('notes', 'mock_exam', 'revision', 'quiz')),
    content_id   UUID, -- Optional reference to student_notes.id or quiz.id
    topic        TEXT,
    trigger      TEXT NOT NULL DEFAULT 'manual' CHECK (trigger IN ('manual', 'auto')),
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Exam Timetable Table (ZIMSEC Schedule)
CREATE TABLE IF NOT EXISTS public.exam_timetable (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id    UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    subject_id    UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    exam_date     DATE NOT NULL,
    paper_number  TEXT NOT NULL, -- e.g. "1", "2", "3"
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject_id, paper_number)
);

-- 4. ZIMSEC Syllabus Topics Table (for progress tracking)
CREATE TABLE IF NOT EXISTS public.subject_topics (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id   UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_name   TEXT NOT NULL,
    importance   TEXT DEFAULT 'normal', -- 'normal', 'high', 'low'
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subject_id, topic_name)
);

-- RLS POLICIES

-- Student Notes
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view/manage own notes" ON public.student_notes;
CREATE POLICY "Users can view/manage own notes" ON public.student_notes 
FOR ALL USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

-- AI Content Log
ALTER TABLE public.ai_content_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own logs" ON public.ai_content_log;
CREATE POLICY "Users can view own logs" ON public.ai_content_log 
FOR SELECT USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create own logs" ON public.ai_content_log;
CREATE POLICY "Users can create own logs" ON public.ai_content_log 
FOR INSERT WITH CHECK (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

-- Exam Timetable
ALTER TABLE public.exam_timetable ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own timetable" ON public.exam_timetable;
CREATE POLICY "Users can manage own timetable" ON public.exam_timetable 
FOR ALL USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

-- Subject Topics (Public read-only)
ALTER TABLE public.subject_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read topics" ON public.subject_topics;
CREATE POLICY "Anyone can read topics" ON public.subject_topics 
FOR SELECT USING (true);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_student_notes_student ON public.student_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_log_student ON public.ai_content_log(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_timetable_student  ON public.exam_timetable(student_id);
CREATE INDEX IF NOT EXISTS idx_subject_topics_subject  ON public.subject_topics(subject_id);

-- 5. Seed Data: Sample ZIMSEC Syllabus Topics
INSERT INTO public.subject_topics (subject_id, topic_name, importance)
SELECT id, 'Numbers and Operations', 'high' FROM public.subjects WHERE code = 'OL-MATH'
ON CONFLICT DO NOTHING;
INSERT INTO public.subject_topics (subject_id, topic_name, importance)
SELECT id, 'Algebraic Expressions', 'high' FROM public.subjects WHERE code = 'OL-MATH'
ON CONFLICT DO NOTHING;
INSERT INTO public.subject_topics (subject_id, topic_name, importance)
SELECT id, 'Geometry and Symmetry', 'normal' FROM public.subjects WHERE code = 'OL-MATH'
ON CONFLICT DO NOTHING;
INSERT INTO public.subject_topics (subject_id, topic_name, importance)
SELECT id, 'Trigonometry', 'high' FROM public.subjects WHERE code = 'OL-MATH'
ON CONFLICT DO NOTHING;

INSERT INTO public.subject_topics (subject_id, topic_name, importance)
SELECT id, 'Essay Writing', 'high' FROM public.subjects WHERE code = 'OL-ENG'
ON CONFLICT DO NOTHING;
INSERT INTO public.subject_topics (subject_id, topic_name, importance)
SELECT id, 'Comprehension', 'high' FROM public.subjects WHERE code = 'OL-ENG'
ON CONFLICT DO NOTHING;
INSERT INTO public.subject_topics (subject_id, topic_name, importance)
SELECT id, 'Summary Writing', 'high' FROM public.subjects WHERE code = 'OL-ENG'
ON CONFLICT DO NOTHING;
INSERT INTO public.subject_topics (subject_id, topic_name, importance)
SELECT id, 'Grammar and Usage', 'normal' FROM public.subjects WHERE code = 'OL-ENG'
ON CONFLICT DO NOTHING;
