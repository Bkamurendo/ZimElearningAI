-- ============================================================================
-- 024: Update O-Level & A-Level subjects to Heritage-Based Curriculum (2024-2030)
-- Run this in Supabase SQL Editor
-- Safe to re-run (ON CONFLICT DO UPDATE)
-- ============================================================================
-- HBC O-Level Compulsory (5): Mathematics, English Language, Heritage Studies,
--   Combined Science, + one Indigenous Language (Shona or Ndebele)
-- HBC O-Level Optional (up to 3 more from elective learning areas)
-- HBC A-Level: 3 specialisation subjects + 1 complementary
-- ============================================================================

-- ─── O-LEVEL: Add missing HBC subjects ────────────────────────────────────

INSERT INTO public.subjects (name, code, zimsec_level) VALUES

  -- Compulsory core (new additions)
  ('Heritage Studies',               'OL-HER',    'olevel'),

  -- Sciences
  ('Agricultural Science',           'OL-AGRI',   'olevel'),
  ('Environmental Science',          'OL-ENV',    'olevel'),

  -- Humanities
  ('Religious and Moral Education',  'OL-RME',    'olevel'),
  ('Sociology',                      'OL-SOC',    'olevel'),

  -- PE & Arts
  ('Drama and Theatre Arts',         'OL-DRA',    'olevel'),

  -- Commercials
  ('Entrepreneurship',               'OL-ENT',    'olevel'),
  ('Economics',                      'OL-ECON',   'olevel'),

  -- Languages (Indigenous)
  ('Tonga',                          'OL-TON',    'olevel'),
  ('Kalanga',                        'OL-KAL',    'olevel'),
  ('Shangani',                       'OL-SHA',    'olevel'),
  ('Venda',                          'OL-VEN',    'olevel'),
  ('Sotho',                          'OL-SOT',    'olevel'),
  ('Nambya',                         'OL-NAM',    'olevel'),
  ('Chewa',                          'OL-CHE',    'olevel'),
  ('Barwe',                          'OL-BAR',    'olevel'),
  ('Xhosa',                          'OL-XHO',    'olevel'),
  ('Tswana',                         'OL-TSW',    'olevel'),
  ('Khoisan',                        'OL-KHO',    'olevel'),

  -- Modern Foreign Languages
  ('French',                         'OL-FRE',    'olevel'),
  ('Portuguese',                     'OL-POR',    'olevel'),

  -- Technical / Vocational
  ('Technical Graphics',             'OL-TG',     'olevel'),
  ('Building Technology',            'OL-BT',     'olevel'),
  ('Metal Technology',               'OL-MET',    'olevel'),
  ('Wood Technology',                'OL-WOOD',   'olevel'),
  ('Fashion and Fabrics',            'OL-FF',     'olevel'),
  ('Home Economics',                 'OL-HE',     'olevel'),
  ('Automotive Technology',          'OL-AUTO',   'olevel')

ON CONFLICT (code) DO UPDATE SET
  name         = EXCLUDED.name,
  zimsec_level = EXCLUDED.zimsec_level;

-- Rename existing O-Level entries to align with HBC naming
UPDATE public.subjects SET name = 'Physical Education and Sport' WHERE code = 'OL-PE';
UPDATE public.subjects SET name = 'Art and Design'               WHERE code = 'OL-ART';

-- ─── A-LEVEL: Add missing HBC subjects ────────────────────────────────────

INSERT INTO public.subjects (name, code, zimsec_level) VALUES

  -- Humanities / Social Sciences
  ('Heritage Studies',               'AL-HER',    'alevel'),
  ('Religious Studies',              'AL-RS',     'alevel'),
  ('Global Perspectives',            'AL-GP',     'alevel'),

  -- Sciences
  ('Agricultural Science',           'AL-AGRI',   'alevel'),
  ('Environmental Science',          'AL-ENV',    'alevel'),
  ('Food Science and Technology',    'AL-FST',    'alevel'),

  -- Arts
  ('Art and Design',                 'AL-ART',    'alevel'),
  ('Music',                          'AL-MUS',    'alevel'),
  ('Drama and Theatre Arts',         'AL-DRA',    'alevel'),

  -- Commercials
  ('Entrepreneurship',               'AL-ENT',    'alevel'),

  -- Languages
  ('French',                         'AL-FRE',    'alevel'),
  ('Portuguese',                     'AL-POR',    'alevel'),
  ('Tonga',                          'AL-TON',    'alevel'),
  ('Kalanga',                        'AL-KAL',    'alevel'),

  -- Technical / Vocational
  ('Technical Graphics',             'AL-TG',     'alevel'),
  ('Fashion, Fabrics and Design',    'AL-FFD',    'alevel')

ON CONFLICT (code) DO UPDATE SET
  name         = EXCLUDED.name,
  zimsec_level = EXCLUDED.zimsec_level;

-- Align existing A-Level names with HBC terminology
UPDATE public.subjects SET name = 'Mathematics'          WHERE code = 'AL-PMATH';
UPDATE public.subjects SET name = 'Further Mathematics'  WHERE code = 'AL-FMATH';
UPDATE public.subjects SET name = 'Accounting'           WHERE code = 'AL-ACC';
