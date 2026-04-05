-- Daily Challenges & Student Streaks Schema
-- Run in Supabase SQL Editor

-- 1. Daily Challenges Table
CREATE TABLE IF NOT EXISTS public.daily_challenges (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_date      DATE NOT NULL,
    zimsec_level        TEXT NOT NULL CHECK (zimsec_level IN ('primary', 'olevel', 'alevel')),
    title               TEXT NOT NULL,
    questions           JSONB NOT NULL, -- Array of question objects
    xp_reward           INTEGER DEFAULT 50,
    bonus_xp            INTEGER DEFAULT 25,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(challenge_date, zimsec_level)
);

-- 2. Daily Challenge Attempts Table
CREATE TABLE IF NOT EXISTS public.daily_challenge_attempts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id        UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score               INTEGER NOT NULL,
    xp_earned           INTEGER NOT NULL,
    time_taken_seconds  INTEGER,
    answers             JSONB NOT NULL, -- Array of student answers
    completed_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

-- 3. Student Streaks Table (if missing)
CREATE TABLE IF NOT EXISTS public.student_streaks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    current_streak      INTEGER DEFAULT 0,
    longest_streak      INTEGER DEFAULT 0,
    last_activity_date  DATE,
    total_xp            INTEGER DEFAULT 0,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id)
);

-- RLS POLICIES

-- Daily Challenges (Read-only for all authenticated users)
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view challenges" ON public.daily_challenges;
CREATE POLICY "Anyone can view challenges" ON public.daily_challenges 
FOR SELECT TO authenticated USING (true);

-- Daily Challenge Attempts (Users can see/create their own attempts)
ALTER TABLE public.daily_challenge_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own attempts" ON public.daily_challenge_attempts;
CREATE POLICY "Users can view own attempts" ON public.daily_challenge_attempts 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own attempts" ON public.daily_challenge_attempts;
CREATE POLICY "Users can create own attempts" ON public.daily_challenge_attempts 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Student Streaks (Users can view/update their own streaks)
ALTER TABLE public.student_streaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own streaks" ON public.student_streaks;
CREATE POLICY "Users can view own streaks" ON public.student_streaks 
FOR SELECT USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own streaks" ON public.student_streaks;
CREATE POLICY "Users can update own streaks" ON public.student_streaks 
FOR UPDATE USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON public.daily_challenges(challenge_date);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_level ON public.daily_challenges(zimsec_level);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_user ON public.daily_challenge_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_student_streaks_id ON public.student_streaks(student_id);
