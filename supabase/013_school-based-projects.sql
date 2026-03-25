-- ─────────────────────────────────────────────────────────────────────────────
-- 013_school-based-projects.sql
-- ZIMSEC Heritage-Based Curriculum — School-Based Projects (SBPs)
-- Teachers create a project brief; students work through 6 progressive stages;
-- MaFundi provides Socratic guidance at every stage; teachers mark & grade.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. SBP Assignments — teacher creates a project brief ─────────────────────
CREATE TABLE IF NOT EXISTS sbp_assignments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id     UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  subject_id     UUID REFERENCES subjects(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  guidelines     TEXT,
  heritage_theme TEXT,          -- e.g. 'local environment', 'indigenous knowledge', 'community entrepreneurship'
  max_marks      INT  NOT NULL DEFAULT 100,
  due_date       DATE,
  zimsec_level   TEXT,          -- 'primary', 'olevel', 'alevel'
  published      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sbp_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers manage own SBP assignments" ON sbp_assignments;
CREATE POLICY "Teachers manage own SBP assignments" ON sbp_assignments
  FOR ALL USING (
    teacher_id = (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Students view published SBP assignments" ON sbp_assignments;
CREATE POLICY "Students view published SBP assignments" ON sbp_assignments
  FOR SELECT USING (
    published = true
    AND subject_id IN (
      SELECT subject_id FROM student_subjects ss
      JOIN student_profiles sp ON sp.id = ss.student_id
      WHERE sp.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS sbp_assignments_teacher_idx ON sbp_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS sbp_assignments_subject_idx ON sbp_assignments(subject_id);

-- ── 2. SBP Submissions — one document per student per assignment ──────────────
CREATE TABLE IF NOT EXISTS sbp_submissions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sbp_assignment_id   UUID NOT NULL REFERENCES sbp_assignments(id) ON DELETE CASCADE,
  student_id          UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  project_title       TEXT,                              -- student's chosen project title
  current_stage       TEXT NOT NULL DEFAULT 'proposal',  -- proposal|research|planning|implementation|evaluation|submitted
  marks_awarded       INT,
  teacher_feedback    TEXT,
  ai_summary          TEXT,                              -- MaFundi's overall project summary
  submitted_at        TIMESTAMPTZ,
  graded_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sbp_assignment_id, student_id)
);

ALTER TABLE sbp_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage own SBP submissions" ON sbp_submissions;
CREATE POLICY "Students manage own SBP submissions" ON sbp_submissions
  FOR ALL USING (
    student_id = (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Teachers view submissions for their assignments" ON sbp_submissions;
CREATE POLICY "Teachers view submissions for their assignments" ON sbp_submissions
  FOR SELECT USING (
    sbp_assignment_id IN (
      SELECT id FROM sbp_assignments
      WHERE teacher_id = (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers grade submissions" ON sbp_submissions;
CREATE POLICY "Teachers grade submissions" ON sbp_submissions
  FOR UPDATE USING (
    sbp_assignment_id IN (
      SELECT id FROM sbp_assignments
      WHERE teacher_id = (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS sbp_submissions_student_idx    ON sbp_submissions(student_id);
CREATE INDEX IF NOT EXISTS sbp_submissions_assignment_idx ON sbp_submissions(sbp_assignment_id);

-- ── 3. SBP Stage Entries — journal log entries per stage ─────────────────────
CREATE TABLE IF NOT EXISTS sbp_stage_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id    UUID NOT NULL REFERENCES sbp_submissions(id) ON DELETE CASCADE,
  stage            TEXT NOT NULL,   -- 'proposal'|'research'|'planning'|'implementation'|'evaluation'
  content          TEXT NOT NULL,   -- student's written work for this entry
  ai_feedback      TEXT,            -- MaFundi's Socratic feedback on this entry
  teacher_comment  TEXT,            -- teacher's annotation on this entry
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sbp_stage_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage own stage entries" ON sbp_stage_entries;
CREATE POLICY "Students manage own stage entries" ON sbp_stage_entries
  FOR ALL USING (
    submission_id IN (
      SELECT id FROM sbp_submissions
      WHERE student_id = (SELECT id FROM student_profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers view stage entries for their assignments" ON sbp_stage_entries;
CREATE POLICY "Teachers view stage entries for their assignments" ON sbp_stage_entries
  FOR SELECT USING (
    submission_id IN (
      SELECT sub.id FROM sbp_submissions sub
      JOIN sbp_assignments asgn ON asgn.id = sub.sbp_assignment_id
      WHERE asgn.teacher_id = (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers add comments to stage entries" ON sbp_stage_entries;
CREATE POLICY "Teachers add comments to stage entries" ON sbp_stage_entries
  FOR UPDATE USING (
    submission_id IN (
      SELECT sub.id FROM sbp_submissions sub
      JOIN sbp_assignments asgn ON asgn.id = sub.sbp_assignment_id
      WHERE asgn.teacher_id = (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS sbp_entries_submission_idx ON sbp_stage_entries(submission_id);
CREATE INDEX IF NOT EXISTS sbp_entries_stage_idx      ON sbp_stage_entries(stage);
