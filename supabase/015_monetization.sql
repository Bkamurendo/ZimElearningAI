-- ============================================================
-- Migration 015: Monetization enhancements
-- - Add 7-day free trial column to profiles
-- - Create school_inquiries table
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Add trial_ends_at column to profiles (safe to re-run)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Backfill: give all existing student accounts a trial that expires immediately
-- (they already signed up, so we don't want to give them a new trial retroactively)
-- New sign-ups will get trial_ends_at = now() + 7 days from the auth.ts register action.

-- 2. School inquiries table (stores pilot / demo requests from the /schools page)
CREATE TABLE IF NOT EXISTS school_inquiries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name     TEXT NOT NULL,
  contact_name    TEXT NOT NULL,
  contact_role    TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  student_count   TEXT,
  message         TEXT,
  status          TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'contacted', 'piloting', 'converted', 'closed')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS school_inquiries_status_idx ON school_inquiries(status);
CREATE INDEX IF NOT EXISTS school_inquiries_created_idx ON school_inquiries(created_at DESC);

-- RLS: only admins can read; the API route uses the service role to insert
ALTER TABLE school_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view school inquiries" ON school_inquiries;
CREATE POLICY "Admins can view school inquiries"
  ON school_inquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Service role insert is allowed because the API route uses anon key with no auth
-- Alternatively, add an unrestricted INSERT policy:
DROP POLICY IF EXISTS "Anyone can submit school inquiry" ON school_inquiries;
CREATE POLICY "Anyone can submit school inquiry"
  ON school_inquiries FOR INSERT
  WITH CHECK (true);
