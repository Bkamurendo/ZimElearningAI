-- PHASE 8: PROACTIVE REMEDIATION SYSTEM
CREATE TABLE IF NOT EXISTS student_remediation_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
    score_at_failure INT,
    total_at_failure INT,
    diagnosis TEXT,
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by student
CREATE INDEX IF NOT EXISTS idx_remediation_student ON student_remediation_missions(student_id, status);

-- Enable RLS
ALTER TABLE student_remediation_missions ENABLE ROW LEVEL SECURITY;

-- Policy: Students can see their own missions
CREATE POLICY "Students can view own missions"
    ON student_remediation_missions FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM student_profiles WHERE id = student_id));
