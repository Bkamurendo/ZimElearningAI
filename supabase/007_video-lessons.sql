-- ============================================================
-- Migration 007: Video Lessons system
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.video_lessons (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id     UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  youtube_url    TEXT NOT NULL,
  youtube_id     TEXT GENERATED ALWAYS AS (
    CASE
      WHEN youtube_url LIKE '%watch?v=%' THEN split_part(split_part(youtube_url, 'watch?v=', 2), '&', 1)
      WHEN youtube_url LIKE '%youtu.be/%' THEN split_part(split_part(youtube_url, 'youtu.be/', 2), '?', 1)
      WHEN youtube_url LIKE '%embed/%' THEN split_part(split_part(youtube_url, 'embed/', 2), '?', 1)
      ELSE NULL
    END
  ) STORED,
  topic          TEXT,
  zimsec_level   TEXT CHECK (zimsec_level IN ('primary','olevel','alevel')),
  duration_mins  INTEGER,
  is_published   BOOLEAN DEFAULT true,
  sort_order     INTEGER DEFAULT 0,
  created_by     UUID REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id    UUID REFERENCES public.video_lessons(id) ON DELETE CASCADE,
  watched_at  TIMESTAMPTZ DEFAULT now(),
  completed   BOOLEAN DEFAULT false,
  UNIQUE (user_id, video_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_lessons_subject ON public.video_lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_video_lessons_level   ON public.video_lessons(zimsec_level);
CREATE INDEX IF NOT EXISTS idx_video_progress_user   ON public.video_progress(user_id);

-- RLS
ALTER TABLE public.video_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published videos visible to authenticated users" ON public.video_lessons
  FOR SELECT USING (is_published = true AND auth.role() = 'authenticated');

CREATE POLICY "Admins and teachers manage videos" ON public.video_lessons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','teacher'))
  );

CREATE POLICY "Users manage own video progress" ON public.video_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seed a few example ZIMSEC video lessons (YouTube public videos)
INSERT INTO public.video_lessons (subject_id, title, description, youtube_url, topic, zimsec_level, duration_mins, sort_order)
SELECT
  s.id,
  'Introduction to ' || s.name,
  'A comprehensive introduction to ' || s.name || ' for ZIMSEC ' ||
    CASE s.zimsec_level WHEN 'olevel' THEN 'O-Level' WHEN 'alevel' THEN 'A-Level' ELSE 'Primary' END || ' students.',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'Introduction',
  s.zimsec_level,
  30,
  1
FROM public.subjects s
WHERE s.zimsec_level = 'olevel'
LIMIT 3
ON CONFLICT DO NOTHING;
