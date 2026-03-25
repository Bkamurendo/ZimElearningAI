-- ─────────────────────────────────────────────────────────────────
-- 012_ai-teacher-autonomous.sql
-- Exam Timetable + AI Content Log
-- ─────────────────────────────────────────────────────────────────

-- Exam timetable — student enters their ZIMSEC exam schedule
CREATE TABLE IF NOT EXISTS exam_timetable (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  subject_id       UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  exam_date        DATE NOT NULL,
  paper_number     TEXT DEFAULT '1',
  start_time       TIME,
  duration_minutes INT  DEFAULT 150,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE exam_timetable ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students manage own timetable" ON exam_timetable;
CREATE POLICY "Students manage own timetable" ON exam_timetable
  FOR ALL USING (student_id = (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS timetable_student_idx ON exam_timetable(student_id);
CREATE INDEX IF NOT EXISTS timetable_date_idx    ON exam_timetable(exam_date);

-- AI content log — tracks what MaFundi auto-generated, prevents duplicates
CREATE TABLE IF NOT EXISTS ai_content_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  subject_id   UUID REFERENCES subjects(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL,  -- 'notes','mock_exam','revision','flashcards'
  content_id   UUID,           -- lesson_id, test_id, note_id of the created content
  topic        TEXT,
  trigger      TEXT,           -- 'weak_topic','exam_approaching','manual'
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE ai_content_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students view own ai log" ON ai_content_log;
CREATE POLICY "Students view own ai log" ON ai_content_log
  FOR SELECT USING (student_id = (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
-- Service role (server) can insert
DROP POLICY IF EXISTS "Service insert ai log" ON ai_content_log;
CREATE POLICY "Service insert ai log" ON ai_content_log
  FOR INSERT WITH CHECK (true);
CREATE INDEX IF NOT EXISTS ai_log_student_idx ON ai_content_log(student_id);
CREATE INDEX IF NOT EXISTS ai_log_type_idx    ON ai_content_log(content_type);
