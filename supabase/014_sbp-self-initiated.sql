-- ─────────────────────────────────────────────────────────────────────────────
-- 014_sbp-self-initiated.sql
-- Allow students to create their own SBPs without a teacher assignment.
-- sbp_assignment_id becomes nullable; self_initiated flag + subject_name text
-- field are added so self-started projects still have context.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Make sbp_assignment_id nullable (students can self-initiate)
ALTER TABLE sbp_submissions
  ALTER COLUMN sbp_assignment_id DROP NOT NULL;

-- 2. Add self_initiated flag and optional subject/heritage fields
ALTER TABLE sbp_submissions
  ADD COLUMN IF NOT EXISTS self_initiated   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subject_name     TEXT,          -- student picks a subject label
  ADD COLUMN IF NOT EXISTS heritage_theme   TEXT;          -- student picks their own heritage connection

-- 3. The unique constraint (sbp_assignment_id, student_id) only applies when
--    sbp_assignment_id IS NOT NULL.  Drop the old one and recreate as partial.
ALTER TABLE sbp_submissions
  DROP CONSTRAINT IF EXISTS sbp_submissions_sbp_assignment_id_student_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS sbp_submissions_assignment_student_uq
  ON sbp_submissions (sbp_assignment_id, student_id)
  WHERE sbp_assignment_id IS NOT NULL;

-- 4. Allow students to INSERT their own self-initiated submissions
--    (the existing "Students manage own SBP submissions" policy already covers
--    SELECT/UPDATE/DELETE via student_id check — but we need INSERT too).
DROP POLICY IF EXISTS "Students insert own submissions" ON sbp_submissions;
CREATE POLICY "Students insert own submissions" ON sbp_submissions
  FOR INSERT WITH CHECK (
    student_id = (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );
