-- ==========================================
-- MaFundi Teaching Excellence: Pedagogical Memory
-- Safe to re-run (idempotent)
-- ==========================================

-- 1. Create student_teaching_memory table
CREATE TABLE IF NOT EXISTS public.student_teaching_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
    confidence_score FLOAT DEFAULT 0.5,
    last_explained_at TIMESTAMPTZ DEFAULT NOW(),
    common_mistakes JSONB DEFAULT '[]',
    aha_moments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, topic)
);

-- 2. Enable RLS
ALTER TABLE public.student_teaching_memory ENABLE ROW LEVEL SECURITY;

-- 3. Policies (drop first so re-runs don't fail)
DROP POLICY IF EXISTS "Students can view their own teaching memory" ON public.student_teaching_memory;
DROP POLICY IF EXISTS "Students can update their own teaching memory" ON public.student_teaching_memory;

CREATE POLICY "Students can view their own teaching memory"
    ON public.student_teaching_memory FOR SELECT
    USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students can update their own teaching memory"
    ON public.student_teaching_memory FOR ALL
    USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_teaching_memory_student ON public.student_teaching_memory(student_id);
CREATE INDEX IF NOT EXISTS idx_teaching_memory_topic ON public.student_teaching_memory(topic);

-- 5. Trigger for updated_at (drop first to avoid duplicate trigger error)
DROP TRIGGER IF EXISTS set_updated_at_teaching_memory ON public.student_teaching_memory;
CREATE TRIGGER set_updated_at_teaching_memory
    BEFORE UPDATE ON public.student_teaching_memory
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
