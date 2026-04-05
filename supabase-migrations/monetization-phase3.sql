-- Monetization Phase 3: Institutional & Professional Development
-- Run in Supabase SQL Editor

-- ============================================================================
-- 1. TEACHER CPD ECOSYSTEM
-- ============================================================================

-- Track CPD points earned by teachers
CREATE TABLE IF NOT EXISTS teacher_cpd_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL,
  activity_type VARCHAR(50) NOT NULL, -- 'lesson_plan', 'quiz_creation', 'grading', 'webinar'
  description TEXT,
  metadata JSONB, -- store related entity IDs (e.g., lesson_id)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store generated CPD certificates
CREATE TABLE IF NOT EXISTS teacher_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  certificate_type VARCHAR(50) NOT NULL, -- 'level_1_pro', 'master_educator', 'ai_specialist'
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  certificate_url TEXT, -- URL to generated PDF
  verification_code VARCHAR(20) UNIQUE NOT NULL,
  metadata JSONB
);

-- ============================================================================
-- 2. CORPORATE SCHOLARSHIPS
-- ============================================================================

-- Corporate entities that fund students
CREATE TABLE IF NOT EXISTS corporate_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scholarship pools managed by corporates
CREATE TABLE IF NOT EXISTS scholarship_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID REFERENCES corporate_sponsors(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  total_slots INTEGER NOT NULL,
  used_slots INTEGER DEFAULT 0,
  duration_months INTEGER DEFAULT 12,
  funding_amount_usd DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students linked to specific scholarships
CREATE TABLE IF NOT EXISTS sponsored_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID REFERENCES scholarship_pools(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'revoked'
  UNIQUE(pool_id, student_id)
);

-- ============================================================================
-- 3. PARENT PREMIUM ANALYTICS
-- ============================================================================

-- AI-generated learning gap analysis
CREATE TABLE IF NOT EXISTS learning_gap_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID NOT NULL,
  analysis_data JSONB NOT NULL, -- topics, mastery levels, remediation links
  report_url TEXT, -- PDF version
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Career & University Path recommendations
CREATE TABLE IF NOT EXISTS career_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  suggested_paths JSONB NOT NULL, -- Array of paths with university/targets
  reasoning TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. INSTITUTIONAL WHITE-LABELING
-- ============================================================================

-- Extend profiles table for subscription plan tracking
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='plan') THEN
    ALTER TABLE profiles ADD COLUMN plan VARCHAR(20) DEFAULT 'basic';
  END IF;
END $$;

-- Extend schools table for premium branding (if column doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='custom_domain') THEN
    ALTER TABLE schools ADD COLUMN custom_domain VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='brand_color') THEN
    ALTER TABLE schools ADD COLUMN brand_color VARCHAR(7); -- hex code
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='is_premium') THEN
    ALTER TABLE schools ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

ALTER TABLE teacher_cpd_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_gap_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_recommendations ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own points
CREATE POLICY "Teachers can view own CPD points" ON teacher_cpd_points
  FOR SELECT USING (teacher_id = auth.uid());

-- Teachers can view their own certificates
CREATE POLICY "Teachers can view own certificates" ON teacher_certificates
  FOR SELECT USING (teacher_id = auth.uid());

-- Everyone can view corporate sponsors (for branding)
CREATE POLICY "Public can view corporate sponsors" ON corporate_sponsors
  FOR SELECT USING (true);

-- Parents can view reports for their linked children
CREATE POLICY "Parents can view child reports" ON learning_gap_reports
  FOR SELECT USING (
    parent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM student_profiles 
      WHERE parent_id = auth.uid() AND student_profiles.user_id = learning_gap_reports.student_id
    )
  );

-- Students can view their own career recs
CREATE POLICY "Students can view own career recs" ON career_recommendations
  FOR SELECT USING (student_id = auth.uid());

-- Parents can view career recs for their children
CREATE POLICY "Parents can view child career recs" ON career_recommendations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM student_profiles 
      WHERE parent_id = auth.uid() AND student_profiles.user_id = career_recommendations.student_id
    )
  );
