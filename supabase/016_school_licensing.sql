-- ============================================================
-- 016_school_licensing.sql
-- School licensing feature: schools table, school_admin role,
-- school_id on profiles, RLS, and school_stats view.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Add 'school_admin' to the user_role enum (idempotent)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'school_admin'
      AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'user_role'
      )
  ) THEN
    ALTER TYPE user_role ADD VALUE 'school_admin';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- already exists, safe to ignore
END;
$$;

-- ------------------------------------------------------------
-- 2. Create the schools table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schools (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT        NOT NULL,
  slug                    TEXT        UNIQUE,
  logo_url                TEXT,
  address                 TEXT,
  province                TEXT        CHECK (
                            province IN (
                              'Harare',
                              'Bulawayo',
                              'Manicaland',
                              'Mashonaland Central',
                              'Mashonaland East',
                              'Mashonaland West',
                              'Masvingo',
                              'Matabeleland North',
                              'Matabeleland South',
                              'Midlands'
                            )
                          ),
  phone                   TEXT,
  email                   TEXT,
  admin_user_id           UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  subscription_plan       TEXT        NOT NULL DEFAULT 'basic'
                            CHECK (subscription_plan IN ('basic', 'pro')),
  subscription_expires_at TIMESTAMPTZ,
  max_students            INTEGER     NOT NULL DEFAULT 50,
  is_active               BOOLEAN     NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_schools_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_schools_updated_at ON schools;
CREATE TRIGGER trg_schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION update_schools_updated_at();

-- ------------------------------------------------------------
-- 3. Add school_id to profiles (nullable FK)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'school_id'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN school_id UUID REFERENCES schools(id) ON DELETE SET NULL;
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- 4. Index on profiles(school_id)
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_school_id
  ON profiles(school_id);

-- ------------------------------------------------------------
-- 5. Enable RLS on schools
-- ------------------------------------------------------------
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (idempotent)
DROP POLICY IF EXISTS "school_admin_select_own"   ON schools;
DROP POLICY IF EXISTS "school_admin_update_own"   ON schools;
DROP POLICY IF EXISTS "global_admin_all"           ON schools;
DROP POLICY IF EXISTS "school_members_select"      ON schools;

-- 5a. Global admin can do everything
CREATE POLICY "global_admin_all"
  ON schools
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id   = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id   = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 5b. school_admin can SELECT their own school
CREATE POLICY "school_admin_select_own"
  ON schools
  FOR SELECT
  TO authenticated
  USING (
    id = (
      SELECT school_id FROM profiles
      WHERE profiles.id   = auth.uid()
        AND profiles.role = 'school_admin'
    )
  );

-- 5c. school_admin can UPDATE their own school
CREATE POLICY "school_admin_update_own"
  ON schools
  FOR UPDATE
  TO authenticated
  USING (
    id = (
      SELECT school_id FROM profiles
      WHERE profiles.id   = auth.uid()
        AND profiles.role = 'school_admin'
    )
  )
  WITH CHECK (
    id = (
      SELECT school_id FROM profiles
      WHERE profiles.id   = auth.uid()
        AND profiles.role = 'school_admin'
    )
  );

-- 5d. Students and teachers in the school can SELECT their school
CREATE POLICY "school_members_select"
  ON schools
  FOR SELECT
  TO authenticated
  USING (
    id = (
      SELECT school_id FROM profiles
      WHERE profiles.id   = auth.uid()
        AND profiles.role IN ('student', 'teacher')
    )
  );

-- ------------------------------------------------------------
-- 6. school_stats view
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW school_stats AS
SELECT
  s.id                                                         AS school_id,
  s.name                                                       AS school_name,
  COUNT(p.id) FILTER (WHERE p.role = 'student')               AS total_students,
  COUNT(p.id) FILTER (WHERE p.role = 'teacher')               AS total_teachers,
  COALESCE(
    SUM(p.ai_requests_today) FILTER (WHERE p.role = 'student'),
    0
  )                                                            AS total_ai_requests_today
FROM schools s
LEFT JOIN profiles p ON p.school_id = s.id
GROUP BY s.id, s.name;
