-- MaFundi Universal Master Teacher: Language & Cycle Support
-- Run in Supabase SQL Editor

-- 1. Add preferred_language and phone_number to Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'english' 
CHECK (preferred_language IN ('english', 'shona', 'ndebele'));

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 2. Create Syllabus Cycles table (Three-Cycle Mastery)
CREATE TABLE IF NOT EXISTS public.syllabus_cycles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID        NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  subject_id  UUID        NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  subject_name TEXT        NOT NULL, -- Denormalized for easier reporting
  pass_number INTEGER     NOT NULL DEFAULT 1 CHECK (pass_number IN (1, 2, 3)),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, subject_id, pass_number)
);

-- RLS Policies
ALTER TABLE public.syllabus_cycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own cycles" ON public.syllabus_cycles;
CREATE POLICY "Students can view own cycles" ON public.syllabus_cycles 
FOR SELECT USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Parents can view children's cycles" ON public.syllabus_cycles;
CREATE POLICY "Parents can view children's cycles" ON public.syllabus_cycles 
FOR SELECT USING (student_id IN (SELECT id FROM public.student_profiles WHERE parent_id = auth.uid()));

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_syllabus_cycles_student ON public.syllabus_cycles(student_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_cycles_subject ON public.syllabus_cycles(subject_id);

