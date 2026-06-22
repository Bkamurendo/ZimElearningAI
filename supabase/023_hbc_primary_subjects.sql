-- ============================================================================
-- 023: Update primary subjects to Heritage-Based Curriculum (2024-2030)
-- Run this in Supabase SQL Editor
-- Safe to re-run (ON CONFLICT DO NOTHING)
-- ============================================================================

-- Remove old primary subjects that no longer exist in HBC
DELETE FROM public.subjects
WHERE zimsec_level = 'primary'
  AND code IN ('PRI-ENV', 'PRI-HER');

-- Add / update HBC core subjects
INSERT INTO public.subjects (name, code, zimsec_level) VALUES
  ('Mathematics',               'PRI-MATH',  'primary'),
  ('English Language',          'PRI-ENG',   'primary'),
  ('Science and Technology',    'PRI-SCI',   'primary'),
  ('Social Science',            'PRI-SS',    'primary'),
  ('Physical Education & Arts', 'PRI-PEA',   'primary'),
  -- Indigenous Languages
  ('Shona',                     'PRI-SHO',   'primary'),
  ('Ndebele',                   'PRI-NDE',   'primary'),
  ('Tonga',                     'PRI-TON',   'primary'),
  ('Kalanga',                   'PRI-KAL',   'primary'),
  ('Shangani',                  'PRI-SHA',   'primary'),
  ('Venda',                     'PRI-VEN',   'primary'),
  ('Sotho',                     'PRI-SOT',   'primary'),
  ('Xhosa',                     'PRI-XHO',   'primary'),
  ('Tswana',                    'PRI-TSW',   'primary'),
  ('Nambya',                    'PRI-NAM',   'primary'),
  ('Chewa',                     'PRI-CHE',   'primary'),
  ('Barwe',                     'PRI-BAR',   'primary'),
  ('Khoisan',                   'PRI-KHO',   'primary')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  zimsec_level = EXCLUDED.zimsec_level;

-- Rename 'Social Studies' → 'Social Science' if old row exists
UPDATE public.subjects SET name = 'Social Science' WHERE code = 'PRI-SS';
