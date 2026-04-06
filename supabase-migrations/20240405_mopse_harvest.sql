-- MoPSE Bulk Content Harvest Storage
CREATE TABLE IF NOT EXISTS public.mopse_raw_harvest (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_level TEXT NOT NULL, -- e.g. "Grade 1-2", "Form 3-4"
    subject     TEXT NOT NULL, -- e.g. "Mathematics", "Science"
    course_name TEXT NOT NULL, -- e.g. "Matrices", "Algebraic Expressions"
    lesson_title TEXT NOT NULL,
    raw_content TEXT NOT NULL, -- All slide notes concatenated
    slide_count INTEGER DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Teacher/Admin access only)
ALTER TABLE public.mopse_raw_harvest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view/manage harvest" ON public.mopse_raw_harvest
FOR ALL USING (EXISTS (SELECT 1 FROM public.teacher_profiles WHERE user_id = auth.uid()));

-- Indexing
CREATE INDEX IF NOT EXISTS idx_mopse_harvest_grade ON public.mopse_raw_harvest(grade_level);
CREATE INDEX IF NOT EXISTS idx_mopse_harvest_subject ON public.mopse_raw_harvest(subject);
