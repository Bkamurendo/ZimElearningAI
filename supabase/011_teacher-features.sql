-- ─────────────────────────────────────────────────────────────────
-- 011_teacher-features.sql
-- Question Bank, Tests, AI Teacher conversations
-- ─────────────────────────────────────────────────────────────────

-- Question Bank (teacher-owned reusable questions)
CREATE TABLE IF NOT EXISTS question_bank (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id    UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  subject_id    UUID REFERENCES subjects(id) ON DELETE SET NULL,
  topic         TEXT,
  question      TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'short_answer', -- 'mcq','short_answer','essay','structured'
  marks         INT  NOT NULL DEFAULT 1,
  difficulty    TEXT DEFAULT 'medium',                -- 'easy','medium','hard'
  answer        TEXT,
  options       JSONB,                                -- [{label,text,correct}] for MCQ
  zimsec_level  TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage own questions" ON question_bank
  FOR ALL USING (teacher_id = (SELECT id FROM teacher_profiles WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS qbank_teacher_idx  ON question_bank(teacher_id);
CREATE INDEX IF NOT EXISTS qbank_subject_idx  ON question_bank(subject_id);

-- Tests / Assessments
CREATE TABLE IF NOT EXISTS tests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id       UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  subject_id       UUID REFERENCES subjects(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  instructions     TEXT,
  duration_minutes INT,
  total_marks      INT  DEFAULT 100,
  published        BOOLEAN DEFAULT false,
  due_date         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage own tests" ON tests
  FOR ALL USING (teacher_id = (SELECT id FROM teacher_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Students view published tests" ON tests
  FOR SELECT USING (published = true AND auth.role() = 'authenticated');
CREATE INDEX IF NOT EXISTS tests_teacher_idx ON tests(teacher_id);

-- Questions attached to a test (can reference bank or be inline)
CREATE TABLE IF NOT EXISTS test_questions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id          UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_bank_id UUID REFERENCES question_bank(id) ON DELETE SET NULL,
  question         TEXT,          -- inline question text (fallback if bank_id null)
  question_type    TEXT DEFAULT 'short_answer',
  marks            INT  NOT NULL DEFAULT 1,
  order_index      INT  DEFAULT 0,
  answer           TEXT,
  options          JSONB
);

-- Student test submissions
CREATE TABLE IF NOT EXISTS test_submissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id      UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id   UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  answers      JSONB,
  score        INT,
  feedback     TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  graded_at    TIMESTAMPTZ,
  UNIQUE(test_id, student_id)
);
ALTER TABLE test_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own test submissions" ON test_submissions
  FOR ALL USING (student_id = (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Teachers view test submissions" ON test_submissions
  FOR SELECT USING (
    test_id IN (
      SELECT id FROM tests
      WHERE teacher_id = (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "Teachers grade test submissions" ON test_submissions
  FOR UPDATE USING (
    test_id IN (
      SELECT id FROM tests
      WHERE teacher_id = (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
    )
  );

-- AI Teacher conversations (per student)
CREATE TABLE IF NOT EXISTS ai_teacher_conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  title      TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE ai_teacher_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own conversations" ON ai_teacher_conversations
  FOR ALL USING (student_id = (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS ai_conv_student_idx ON ai_teacher_conversations(student_id);

-- AI Teacher messages
CREATE TABLE IF NOT EXISTS ai_teacher_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_teacher_conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,    -- 'user' | 'assistant'
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE ai_teacher_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students access own AI messages" ON ai_teacher_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM ai_teacher_conversations
      WHERE student_id = (SELECT id FROM student_profiles WHERE user_id = auth.uid())
    )
  );
CREATE INDEX IF NOT EXISTS ai_msg_conv_idx ON ai_teacher_messages(conversation_id);
