-- ─────────────────────────────────────────────────────────────────────────────
-- Custom MFA: email OTP + phone/SMS OTP
-- Adds mfa_method + mfa_phone to profiles
-- Creates otp_codes table to store hashed one-time codes
-- Run this in the Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Extend profiles with MFA preferences
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mfa_method TEXT NOT NULL DEFAULT 'none'
    CHECK (mfa_method IN ('none', 'totp', 'email', 'phone')),
  ADD COLUMN IF NOT EXISTS mfa_phone TEXT;

-- 2. OTP codes table (email & phone second-factor codes)
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash   TEXT        NOT NULL,   -- SHA-256 hash of the 6-digit code
  method      TEXT        NOT NULL CHECK (method IN ('email', 'phone')),
  expires_at  TIMESTAMPTZ NOT NULL,   -- 10 minutes from creation
  used        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id    ON public.otp_codes (user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes (expires_at);

-- 3. RLS — only the service role (API routes) can read/write otp_codes
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
-- No client-facing policies; all access via service role in API routes

-- 4. Allow users to read/update their own mfa_method and mfa_phone
-- (profiles table SELECT/UPDATE policies should already exist from schema.sql)
-- If not, uncomment below:
-- CREATE POLICY "Users update own mfa settings"
--   ON public.profiles FOR UPDATE
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Missing UNIQUE constraints (fixes silent upsert failures in features)
-- ─────────────────────────────────────────────────────────────────────────────

-- 5. study_plans — one plan per student (needed for delete+insert save pattern)
--    study_planner/generate was failing silently because no unique constraint
ALTER TABLE public.study_plans
  DROP CONSTRAINT IF EXISTS study_plans_student_id_key,
  ADD CONSTRAINT study_plans_student_id_key UNIQUE (student_id);

-- 6. student_badges — prevent duplicate badge types per student
--    quiz/submit was silently failing when awarding badges
ALTER TABLE public.student_badges
  DROP CONSTRAINT IF EXISTS student_badges_student_id_badge_type_key,
  ADD CONSTRAINT student_badges_student_id_badge_type_key UNIQUE (student_id, badge_type);
