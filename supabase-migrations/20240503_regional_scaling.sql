-- PAN-AFRICAN REGIONAL SCALING
-- Extends the platform to support Cambridge (IGCSE/A-Level) and CAPS (South Africa) curricula.

-- 1. Add curriculum field to subjects
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'curriculum') THEN
        ALTER TABLE public.subjects ADD COLUMN curriculum VARCHAR(50) DEFAULT 'ZIMSEC';
    END IF;
END $$;

-- 2. Add curriculum field to student profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'curriculum') THEN
        ALTER TABLE public.student_profiles ADD COLUMN curriculum VARCHAR(50) DEFAULT 'ZIMSEC';
    END IF;
END $$;

-- 3. Create a Curricula lookup table for system-wide configuration
CREATE TABLE IF NOT EXISTS public.educational_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- ZIMSEC, CAMBRIDGE, CAPS, CBC
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100),
    grading_system JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial frameworks
INSERT INTO public.educational_frameworks (code, name, country) VALUES
('ZIMSEC', 'ZIMSEC Heritage-Based', 'Zimbabwe'),
('CAMBRIDGE', 'Cambridge International (CIE)', 'Global'),
('CAPS', 'National Curriculum Statement (CAPS)', 'South Africa'),
('CBC', 'Competency Based Curriculum (CBC)', 'Kenya')
ON CONFLICT (code) DO NOTHING;

-- 4. Update Knowledge Engine Partitioning
-- (Conceptual: In production, we'd ensure RLS filters content by curriculum)
CREATE INDEX IF NOT EXISTS idx_subjects_curriculum ON public.subjects(curriculum);
CREATE INDEX IF NOT EXISTS idx_student_profiles_curriculum ON public.student_profiles(curriculum);
