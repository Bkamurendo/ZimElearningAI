-- ============================================================
-- ZIM E-LEARNING PLATFORM — ZIMSEC CURRICULUM CONTENT SEED
-- Migration: 017_zimsec_content_seed.sql
-- Date: 2026-03-25
--
-- HOW TO RUN:
--   1. Go to supabase.com → your project → SQL Editor
--   2. Click "New query"
--   3. Paste this entire file and click Run
--
-- SAFE TO RE-RUN: fully idempotent (IF NOT EXISTS + DO $$ patterns)
-- ============================================================


-- ============================================================
-- SECTION 1: TOPICS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS topics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id      UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  order_index     INTEGER DEFAULT 0,
  parent_topic_id UUID REFERENCES topics(id),
  zimsec_level    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "topics_public_read" ON topics FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_topics_subject      ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_parent       ON topics(parent_topic_id);
CREATE INDEX IF NOT EXISTS idx_topics_level        ON topics(zimsec_level);


-- ============================================================
-- SECTION 2: O-LEVEL TOPIC TREES
-- ============================================================

-- ----------------------------------------------------------------
-- 2.1  Mathematics (MAT) — O-Level
-- ----------------------------------------------------------------
DO $$
DECLARE
  v_subject UUID;
  t_numbers UUID; t_algebra UUID; t_geometry UUID; t_trig UUID;
  t_stats UUID; t_calc UUID; t_vectors UUID; t_mens UUID;
BEGIN
  SELECT id INTO v_subject FROM subjects WHERE code = 'MAT' AND zimsec_level = 'olevel' LIMIT 1;
  IF v_subject IS NULL THEN RETURN; END IF;

  -- Parent topics
  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Numbers & Operations', 'Natural numbers, integers, fractions, decimals, percentages and number bases', 1, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_numbers;
  IF t_numbers IS NULL THEN SELECT id INTO t_numbers FROM topics WHERE subject_id = v_subject AND name = 'Numbers & Operations'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Algebra', 'Expressions, equations, inequalities, functions and sequences', 2, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_algebra;
  IF t_algebra IS NULL THEN SELECT id INTO t_algebra FROM topics WHERE subject_id = v_subject AND name = 'Algebra'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Geometry', 'Lines, angles, polygons, circles, constructions and transformations', 3, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_geometry;
  IF t_geometry IS NULL THEN SELECT id INTO t_geometry FROM topics WHERE subject_id = v_subject AND name = 'Geometry'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Trigonometry', 'Sine, cosine, tangent and their applications', 4, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_trig;
  IF t_trig IS NULL THEN SELECT id INTO t_trig FROM topics WHERE subject_id = v_subject AND name = 'Trigonometry'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Statistics & Probability', 'Data collection, representation, central tendency, probability', 5, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_stats;
  IF t_stats IS NULL THEN SELECT id INTO t_stats FROM topics WHERE subject_id = v_subject AND name = 'Statistics & Probability'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Calculus Introduction', 'Limits, differentiation and basic integration concepts', 6, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_calc;
  IF t_calc IS NULL THEN SELECT id INTO t_calc FROM topics WHERE subject_id = v_subject AND name = 'Calculus Introduction'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Vectors', 'Vector notation, operations, and simple vector geometry', 7, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_vectors;
  IF t_vectors IS NULL THEN SELECT id INTO t_vectors FROM topics WHERE subject_id = v_subject AND name = 'Vectors'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Mensuration', 'Perimeter, area and volume of 2D and 3D shapes', 8, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_mens;
  IF t_mens IS NULL THEN SELECT id INTO t_mens FROM topics WHERE subject_id = v_subject AND name = 'Mensuration'; END IF;

  -- Subtopics: Numbers & Operations
  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Number Bases & Place Value',    1, t_numbers, 'olevel'),
    (v_subject, 'Fractions & Decimals',          2, t_numbers, 'olevel'),
    (v_subject, 'Percentages & Ratios',          3, t_numbers, 'olevel'),
    (v_subject, 'Indices & Standard Form',       4, t_numbers, 'olevel'),
    (v_subject, 'Real Number Properties',        5, t_numbers, 'olevel')
  ON CONFLICT DO NOTHING;

  -- Subtopics: Algebra
  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Algebraic Expressions',         1, t_algebra, 'olevel'),
    (v_subject, 'Linear Equations',              2, t_algebra, 'olevel'),
    (v_subject, 'Quadratic Equations',           3, t_algebra, 'olevel'),
    (v_subject, 'Simultaneous Equations',        4, t_algebra, 'olevel'),
    (v_subject, 'Inequalities',                  5, t_algebra, 'olevel'),
    (v_subject, 'Functions & Graphs',            6, t_algebra, 'olevel'),
    (v_subject, 'Sequences & Series',            7, t_algebra, 'olevel')
  ON CONFLICT DO NOTHING;

  -- Subtopics: Geometry
  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Lines & Angles',                1, t_geometry, 'olevel'),
    (v_subject, 'Triangles & Congruence',        2, t_geometry, 'olevel'),
    (v_subject, 'Quadrilaterals & Polygons',     3, t_geometry, 'olevel'),
    (v_subject, 'Circles & Circle Theorems',     4, t_geometry, 'olevel'),
    (v_subject, 'Transformations',               5, t_geometry, 'olevel'),
    (v_subject, 'Constructions & Loci',          6, t_geometry, 'olevel')
  ON CONFLICT DO NOTHING;

  -- Subtopics: Statistics
  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Data Collection & Sampling',    1, t_stats, 'olevel'),
    (v_subject, 'Frequency Tables & Histograms', 2, t_stats, 'olevel'),
    (v_subject, 'Mean, Median & Mode',           3, t_stats, 'olevel'),
    (v_subject, 'Probability Basics',            4, t_stats, 'olevel'),
    (v_subject, 'Cumulative Frequency',          5, t_stats, 'olevel')
  ON CONFLICT DO NOTHING;

END $$;


-- ----------------------------------------------------------------
-- 2.2  English Language (ENG) — O-Level
-- ----------------------------------------------------------------
DO $$
DECLARE
  v_subject UUID;
  t_reading UUID; t_writing UUID; t_grammar UUID;
  t_vocab UUID; t_lit UUID; t_summary UUID;
BEGIN
  SELECT id INTO v_subject FROM subjects WHERE code = 'ENG' AND zimsec_level = 'olevel' LIMIT 1;
  IF v_subject IS NULL THEN RETURN; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Reading Comprehension', 'Unseen passages, inferencing, and critical reading skills', 1, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_reading;
  IF t_reading IS NULL THEN SELECT id INTO t_reading FROM topics WHERE subject_id = v_subject AND name = 'Reading Comprehension'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Writing Skills', 'Essays, formal letters, reports, and creative writing', 2, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_writing;
  IF t_writing IS NULL THEN SELECT id INTO t_writing FROM topics WHERE subject_id = v_subject AND name = 'Writing Skills'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Grammar & Punctuation', 'Parts of speech, sentence structure, punctuation rules', 3, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_grammar;
  IF t_grammar IS NULL THEN SELECT id INTO t_grammar FROM topics WHERE subject_id = v_subject AND name = 'Grammar & Punctuation'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Vocabulary Development', 'Word roots, synonyms, antonyms, contextual usage', 4, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_vocab;
  IF t_vocab IS NULL THEN SELECT id INTO t_vocab FROM topics WHERE subject_id = v_subject AND name = 'Vocabulary Development'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Literature Analysis', 'Poetry, prose and drama appreciation and analysis', 5, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_lit;
  IF t_lit IS NULL THEN SELECT id INTO t_lit FROM topics WHERE subject_id = v_subject AND name = 'Literature Analysis'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Summary Writing', 'Identifying key points and concise paraphrasing', 6, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_summary;
  IF t_summary IS NULL THEN SELECT id INTO t_summary FROM topics WHERE subject_id = v_subject AND name = 'Summary Writing'; END IF;

  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Skimming & Scanning',           1, t_reading, 'olevel'),
    (v_subject, 'Inference & Deduction',         2, t_reading, 'olevel'),
    (v_subject, 'Tone & Attitude',               3, t_reading, 'olevel'),
    (v_subject, 'Narrative Essays',              1, t_writing, 'olevel'),
    (v_subject, 'Argumentative Essays',          2, t_writing, 'olevel'),
    (v_subject, 'Formal & Informal Letters',     3, t_writing, 'olevel'),
    (v_subject, 'Report Writing',                4, t_writing, 'olevel'),
    (v_subject, 'Nouns, Pronouns & Verbs',       1, t_grammar, 'olevel'),
    (v_subject, 'Tenses & Aspect',               2, t_grammar, 'olevel'),
    (v_subject, 'Active & Passive Voice',        3, t_grammar, 'olevel'),
    (v_subject, 'Clauses & Conjunctions',        4, t_grammar, 'olevel'),
    (v_subject, 'Poetry Appreciation',           1, t_lit,     'olevel'),
    (v_subject, 'Prose Analysis',                2, t_lit,     'olevel'),
    (v_subject, 'Drama & Play Reading',          3, t_lit,     'olevel')
  ON CONFLICT DO NOTHING;

END $$;


-- ----------------------------------------------------------------
-- 2.3  Combined Science (SCI) — O-Level
-- ----------------------------------------------------------------
DO $$
DECLARE
  v_subject UUID;
  t_bio UUID; t_chem UUID; t_phys UUID;
BEGIN
  SELECT id INTO v_subject FROM subjects WHERE code = 'SCI' AND zimsec_level = 'olevel' LIMIT 1;
  IF v_subject IS NULL THEN RETURN; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Biology Section', 'Life processes, cells, ecosystems', 1, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_bio;
  IF t_bio IS NULL THEN SELECT id INTO t_bio FROM topics WHERE subject_id = v_subject AND name = 'Biology Section'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Chemistry Section', 'Matter, reactions and the periodic table', 2, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_chem;
  IF t_chem IS NULL THEN SELECT id INTO t_chem FROM topics WHERE subject_id = v_subject AND name = 'Chemistry Section'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Physics Section', 'Forces, energy, electricity and waves', 3, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_phys;
  IF t_phys IS NULL THEN SELECT id INTO t_phys FROM topics WHERE subject_id = v_subject AND name = 'Physics Section'; END IF;

  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Cell Structure & Function',     1, t_bio,  'olevel'),
    (v_subject, 'Nutrition in Living Things',    2, t_bio,  'olevel'),
    (v_subject, 'Respiration',                   3, t_bio,  'olevel'),
    (v_subject, 'Reproduction',                  4, t_bio,  'olevel'),
    (v_subject, 'Ecosystems & Environment',      5, t_bio,  'olevel'),
    (v_subject, 'States of Matter',              1, t_chem, 'olevel'),
    (v_subject, 'Atomic Structure',             2, t_chem, 'olevel'),
    (v_subject, 'Chemical Reactions',            3, t_chem, 'olevel'),
    (v_subject, 'Acids, Bases & Salts',          4, t_chem, 'olevel'),
    (v_subject, 'Forces & Motion',               1, t_phys, 'olevel'),
    (v_subject, 'Energy & Work',                 2, t_phys, 'olevel'),
    (v_subject, 'Electricity',                   3, t_phys, 'olevel'),
    (v_subject, 'Waves & Sound',                 4, t_phys, 'olevel')
  ON CONFLICT DO NOTHING;

END $$;


-- ----------------------------------------------------------------
-- 2.4  History (HIS) — O-Level
-- ----------------------------------------------------------------
DO $$
DECLARE
  v_subject UUID;
  t_pre UUID; t_col UUID; t_lib UUID; t_post UUID; t_world UUID;
BEGIN
  SELECT id INTO v_subject FROM subjects WHERE code = 'HIS' AND zimsec_level = 'olevel' LIMIT 1;
  IF v_subject IS NULL THEN RETURN; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Pre-Colonial Zimbabwe', 'Great Zimbabwe, Mutapa, Rozvi and other kingdoms', 1, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_pre;
  IF t_pre IS NULL THEN SELECT id INTO t_pre FROM topics WHERE subject_id = v_subject AND name = 'Pre-Colonial Zimbabwe'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Colonial Era', 'European colonisation, BSAC, Southern Rhodesia', 2, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_col;
  IF t_col IS NULL THEN SELECT id INTO t_col FROM topics WHERE subject_id = v_subject AND name = 'Colonial Era'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Liberation Struggle', 'First and Second Chimurenga, nationalist movements', 3, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_lib;
  IF t_lib IS NULL THEN SELECT id INTO t_lib FROM topics WHERE subject_id = v_subject AND name = 'Liberation Struggle'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Post-Independence Zimbabwe', 'Independence 1980, political and economic development', 4, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_post;
  IF t_post IS NULL THEN SELECT id INTO t_post FROM topics WHERE subject_id = v_subject AND name = 'Post-Independence Zimbabwe'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Africa & World History', 'African nationalism, World Wars, Cold War context', 5, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_world;
  IF t_world IS NULL THEN SELECT id INTO t_world FROM topics WHERE subject_id = v_subject AND name = 'Africa & World History'; END IF;

  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Great Zimbabwe Civilisation',   1, t_pre,   'olevel'),
    (v_subject, 'Mutapa State',                  2, t_pre,   'olevel'),
    (v_subject, 'Rozvi State',                   3, t_pre,   'olevel'),
    (v_subject, 'Ndebele Kingdom',               4, t_pre,   'olevel'),
    (v_subject, 'Pioneer Column 1890',           1, t_col,   'olevel'),
    (v_subject, 'Land Alienation & Policies',    2, t_col,   'olevel'),
    (v_subject, 'First Chimurenga 1896–97',      1, t_lib,   'olevel'),
    (v_subject, 'Nationalist Movements ZAPU/ZANU', 2, t_lib, 'olevel'),
    (v_subject, 'Second Chimurenga',             3, t_lib,   'olevel'),
    (v_subject, 'Lancaster House Agreement',     4, t_lib,   'olevel'),
    (v_subject, 'Independence & Reconciliation', 1, t_post,  'olevel'),
    (v_subject, 'Land Reform Programme',         2, t_post,  'olevel'),
    (v_subject, 'World War I Overview',          1, t_world, 'olevel'),
    (v_subject, 'World War II Overview',         2, t_world, 'olevel'),
    (v_subject, 'African Nationalism',           3, t_world, 'olevel')
  ON CONFLICT DO NOTHING;

END $$;


-- ----------------------------------------------------------------
-- 2.5  Geography (GEO) — O-Level
-- ----------------------------------------------------------------
DO $$
DECLARE
  v_subject UUID;
  t_phys UUID; t_human UUID; t_map UUID; t_zim UUID; t_env UUID;
BEGIN
  SELECT id INTO v_subject FROM subjects WHERE code = 'GEO' AND zimsec_level = 'olevel' LIMIT 1;
  IF v_subject IS NULL THEN RETURN; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Physical Geography', 'Landforms, weathering, rivers, climate and soils', 1, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_phys;
  IF t_phys IS NULL THEN SELECT id INTO t_phys FROM topics WHERE subject_id = v_subject AND name = 'Physical Geography'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Human Geography', 'Population, settlement, agriculture and industry', 2, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_human;
  IF t_human IS NULL THEN SELECT id INTO t_human FROM topics WHERE subject_id = v_subject AND name = 'Human Geography'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Map Reading & Skills', 'Topographic maps, scale, grid references, cross-sections', 3, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_map;
  IF t_map IS NULL THEN SELECT id INTO t_map FROM topics WHERE subject_id = v_subject AND name = 'Map Reading & Skills'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Zimbabwe Geography', 'Physical and human geography of Zimbabwe', 4, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_zim;
  IF t_zim IS NULL THEN SELECT id INTO t_zim FROM topics WHERE subject_id = v_subject AND name = 'Zimbabwe Geography'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Environmental Studies', 'Conservation, pollution, deforestation and sustainability', 5, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_env;
  IF t_env IS NULL THEN SELECT id INTO t_env FROM topics WHERE subject_id = v_subject AND name = 'Environmental Studies'; END IF;

  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Rocks & Weathering',            1, t_phys,  'olevel'),
    (v_subject, 'Rivers & Drainage',             2, t_phys,  'olevel'),
    (v_subject, 'Climate & Weather',             3, t_phys,  'olevel'),
    (v_subject, 'Soils & Vegetation',            4, t_phys,  'olevel'),
    (v_subject, 'Population & Settlement',       1, t_human, 'olevel'),
    (v_subject, 'Agriculture & Land Use',        2, t_human, 'olevel'),
    (v_subject, 'Industry & Trade',              3, t_human, 'olevel'),
    (v_subject, 'Contour Lines & Relief',        1, t_map,   'olevel'),
    (v_subject, 'Grid References & Scale',       2, t_map,   'olevel'),
    (v_subject, 'Zimbabwe''s Physical Regions',  1, t_zim,   'olevel'),
    (v_subject, 'Rivers of Zimbabwe',            2, t_zim,   'olevel'),
    (v_subject, 'Economic Activities in Zimbabwe',3,t_zim,   'olevel'),
    (v_subject, 'Deforestation & Conservation',  1, t_env,   'olevel'),
    (v_subject, 'Water Pollution',               2, t_env,   'olevel'),
    (v_subject, 'Sustainable Development',       3, t_env,   'olevel')
  ON CONFLICT DO NOTHING;

END $$;


-- ----------------------------------------------------------------
-- 2.6  Commerce (COM) — O-Level
-- ----------------------------------------------------------------
DO $$
DECLARE
  v_subject UUID;
  t_biz UUID; t_trade UUID; t_bank UUID; t_ins UUID; t_gov UUID;
BEGIN
  SELECT id INTO v_subject FROM subjects WHERE code = 'COM' AND zimsec_level = 'olevel' LIMIT 1;
  IF v_subject IS NULL THEN RETURN; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Business Concepts', 'Forms of business ownership and management', 1, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_biz;
  IF t_biz IS NULL THEN SELECT id INTO t_biz FROM topics WHERE subject_id = v_subject AND name = 'Business Concepts'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Trade', 'Home trade, international trade, and channels of distribution', 2, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_trade;
  IF t_trade IS NULL THEN SELECT id INTO t_trade FROM topics WHERE subject_id = v_subject AND name = 'Trade'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Banking & Finance', 'Commercial banks, central bank, financial services', 3, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_bank;
  IF t_bank IS NULL THEN SELECT id INTO t_bank FROM topics WHERE subject_id = v_subject AND name = 'Banking & Finance'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Insurance', 'Principles and types of insurance', 4, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_ins;
  IF t_ins IS NULL THEN SELECT id INTO t_ins FROM topics WHERE subject_id = v_subject AND name = 'Insurance'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Government & Economy', 'Government role in commerce, taxation, and economic policies', 5, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_gov;
  IF t_gov IS NULL THEN SELECT id INTO t_gov FROM topics WHERE subject_id = v_subject AND name = 'Government & Economy'; END IF;

  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Sole Trader & Partnership',     1, t_biz,   'olevel'),
    (v_subject, 'Limited Companies',             2, t_biz,   'olevel'),
    (v_subject, 'Co-operatives & Parastatals',   3, t_biz,   'olevel'),
    (v_subject, 'Retail & Wholesale Trade',      1, t_trade, 'olevel'),
    (v_subject, 'Import & Export',               2, t_trade, 'olevel'),
    (v_subject, 'Commercial Banks',              1, t_bank,  'olevel'),
    (v_subject, 'Reserve Bank of Zimbabwe',      2, t_bank,  'olevel'),
    (v_subject, 'Principles of Insurance',       1, t_ins,   'olevel'),
    (v_subject, 'Types of Insurance',            2, t_ins,   'olevel'),
    (v_subject, 'Taxation & Government Revenue', 1, t_gov,   'olevel'),
    (v_subject, 'Economic Policy & Inflation',   2, t_gov,   'olevel')
  ON CONFLICT DO NOTHING;

END $$;


-- ----------------------------------------------------------------
-- 2.7  Accounts / Accounting (ACC) — O-Level
-- ----------------------------------------------------------------
DO $$
DECLARE
  v_subject UUID;
  t_double UUID; t_trial UUID; t_trading UUID; t_balance UUID; t_cash UUID;
BEGIN
  SELECT id INTO v_subject FROM subjects WHERE code = 'ACC' AND zimsec_level = 'olevel' LIMIT 1;
  IF v_subject IS NULL THEN RETURN; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Double Entry Bookkeeping', 'Debit and credit rules, journals and ledgers', 1, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_double;
  IF t_double IS NULL THEN SELECT id INTO t_double FROM topics WHERE subject_id = v_subject AND name = 'Double Entry Bookkeeping'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Trial Balance', 'Extracting and correcting the trial balance', 2, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_trial;
  IF t_trial IS NULL THEN SELECT id INTO t_trial FROM topics WHERE subject_id = v_subject AND name = 'Trial Balance'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Trading Account', 'Gross profit, cost of sales and adjustments', 3, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_trading;
  IF t_trading IS NULL THEN SELECT id INTO t_trading FROM topics WHERE subject_id = v_subject AND name = 'Trading Account'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Balance Sheet', 'Assets, liabilities and capital', 4, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_balance;
  IF t_balance IS NULL THEN SELECT id INTO t_balance FROM topics WHERE subject_id = v_subject AND name = 'Balance Sheet'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Cash Flow & Bank Reconciliation', 'Cash book, petty cash, bank reconciliation', 5, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_cash;
  IF t_cash IS NULL THEN SELECT id INTO t_cash FROM topics WHERE subject_id = v_subject AND name = 'Cash Flow & Bank Reconciliation'; END IF;

  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Debit & Credit Rules',          1, t_double,  'olevel'),
    (v_subject, 'Source Documents',              2, t_double,  'olevel'),
    (v_subject, 'Journals & Day Books',          3, t_double,  'olevel'),
    (v_subject, 'Ledger Accounts',               4, t_double,  'olevel'),
    (v_subject, 'Errors of Commission & Omission',1,t_trial,   'olevel'),
    (v_subject, 'Suspense Accounts',             2, t_trial,   'olevel'),
    (v_subject, 'Gross Profit Calculation',      1, t_trading, 'olevel'),
    (v_subject, 'Stock Valuation (FIFO/AVCO)',   2, t_trading, 'olevel'),
    (v_subject, 'Fixed & Current Assets',        1, t_balance, 'olevel'),
    (v_subject, 'Depreciation',                  2, t_balance, 'olevel'),
    (v_subject, 'Cash Book Preparation',         1, t_cash,    'olevel'),
    (v_subject, 'Bank Reconciliation Statement', 2, t_cash,    'olevel')
  ON CONFLICT DO NOTHING;

END $$;


-- ----------------------------------------------------------------
-- 2.8  Biology (BIO) — O-Level
-- ----------------------------------------------------------------
DO $$
DECLARE
  v_subject UUID;
  t_cell UUID; t_nutr UUID; t_resp UUID; t_trans UUID;
  t_repro UUID; t_gen UUID; t_eco UUID;
BEGIN
  SELECT id INTO v_subject FROM subjects WHERE code = 'BIO' AND zimsec_level = 'olevel' LIMIT 1;
  IF v_subject IS NULL THEN RETURN; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Cell Biology', 'Cell structure, organelles and cell division', 1, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_cell;
  IF t_cell IS NULL THEN SELECT id INTO t_cell FROM topics WHERE subject_id = v_subject AND name = 'Cell Biology'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Nutrition', 'Nutrients, digestion, photosynthesis', 2, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_nutr;
  IF t_nutr IS NULL THEN SELECT id INTO t_nutr FROM topics WHERE subject_id = v_subject AND name = 'Nutrition'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Respiration', 'Aerobic and anaerobic respiration', 3, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_resp;
  IF t_resp IS NULL THEN SELECT id INTO t_resp FROM topics WHERE subject_id = v_subject AND name = 'Respiration'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Transport in Living Things', 'Blood, lymph, transpiration and osmosis', 4, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_trans;
  IF t_trans IS NULL THEN SELECT id INTO t_trans FROM topics WHERE subject_id = v_subject AND name = 'Transport in Living Things'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Reproduction', 'Sexual and asexual reproduction in plants and animals', 5, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_repro;
  IF t_repro IS NULL THEN SELECT id INTO t_repro FROM topics WHERE subject_id = v_subject AND name = 'Reproduction'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Genetics', 'Heredity, DNA, Mendelian genetics', 6, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_gen;
  IF t_gen IS NULL THEN SELECT id INTO t_gen FROM topics WHERE subject_id = v_subject AND name = 'Genetics'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Ecology', 'Ecosystems, food webs, conservation', 7, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_eco;
  IF t_eco IS NULL THEN SELECT id INTO t_eco FROM topics WHERE subject_id = v_subject AND name = 'Ecology'; END IF;

  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Plant & Animal Cells',          1, t_cell,  'olevel'),
    (v_subject, 'Cell Membrane & Diffusion',     2, t_cell,  'olevel'),
    (v_subject, 'Mitosis & Meiosis',             3, t_cell,  'olevel'),
    (v_subject, 'Photosynthesis',                1, t_nutr,  'olevel'),
    (v_subject, 'Human Digestive System',        2, t_nutr,  'olevel'),
    (v_subject, 'Balanced Diet & Malnutrition',  3, t_nutr,  'olevel'),
    (v_subject, 'Aerobic Respiration',           1, t_resp,  'olevel'),
    (v_subject, 'Anaerobic Respiration',         2, t_resp,  'olevel'),
    (v_subject, 'Blood & Circulatory System',    1, t_trans, 'olevel'),
    (v_subject, 'Osmosis & Water Transport',     2, t_trans, 'olevel'),
    (v_subject, 'DNA Structure & Replication',   1, t_gen,   'olevel'),
    (v_subject, 'Monohybrid Inheritance',        2, t_gen,   'olevel'),
    (v_subject, 'Sex-Linked Traits',             3, t_gen,   'olevel'),
    (v_subject, 'Food Chains & Webs',            1, t_eco,   'olevel'),
    (v_subject, 'Nutrient Cycles',               2, t_eco,   'olevel'),
    (v_subject, 'Biodiversity & Conservation',   3, t_eco,   'olevel')
  ON CONFLICT DO NOTHING;

END $$;


-- ----------------------------------------------------------------
-- 2.9  Chemistry (CHE) — O-Level
-- ----------------------------------------------------------------
DO $$
DECLARE
  v_subject UUID;
  t_atom UUID; t_bond UUID; t_acid UUID; t_org UUID; t_electro UUID; t_rate UUID;
BEGIN
  SELECT id INTO v_subject FROM subjects WHERE code = 'CHE' AND zimsec_level = 'olevel' LIMIT 1;
  IF v_subject IS NULL THEN RETURN; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Atomic Structure', 'Protons, neutrons, electrons, isotopes and electronic configuration', 1, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_atom;
  IF t_atom IS NULL THEN SELECT id INTO t_atom FROM topics WHERE subject_id = v_subject AND name = 'Atomic Structure'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Chemical Bonding', 'Ionic, covalent, and metallic bonding', 2, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_bond;
  IF t_bond IS NULL THEN SELECT id INTO t_bond FROM topics WHERE subject_id = v_subject AND name = 'Chemical Bonding'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Acids, Bases & Salts', 'pH, neutralisation, salt preparation', 3, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_acid;
  IF t_acid IS NULL THEN SELECT id INTO t_acid FROM topics WHERE subject_id = v_subject AND name = 'Acids, Bases & Salts'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Organic Chemistry', 'Alkanes, alkenes, alcohols and polymers', 4, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_org;
  IF t_org IS NULL THEN SELECT id INTO t_org FROM topics WHERE subject_id = v_subject AND name = 'Organic Chemistry'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Electrochemistry', 'Electrolysis, electrode reactions, applications', 5, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_electro;
  IF t_electro IS NULL THEN SELECT id INTO t_electro FROM topics WHERE subject_id = v_subject AND name = 'Electrochemistry'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Rates of Reaction', 'Factors affecting rate, activation energy, catalysts', 6, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_rate;
  IF t_rate IS NULL THEN SELECT id INTO t_rate FROM topics WHERE subject_id = v_subject AND name = 'Rates of Reaction'; END IF;

  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Protons, Neutrons & Electrons', 1, t_atom,    'olevel'),
    (v_subject, 'Periodic Table Trends',         2, t_atom,    'olevel'),
    (v_subject, 'Isotopes & Relative Mass',      3, t_atom,    'olevel'),
    (v_subject, 'Ionic Bonding',                 1, t_bond,    'olevel'),
    (v_subject, 'Covalent Bonding',              2, t_bond,    'olevel'),
    (v_subject, 'Metallic Bonding',              3, t_bond,    'olevel'),
    (v_subject, 'pH Scale & Indicators',         1, t_acid,    'olevel'),
    (v_subject, 'Neutralisation Reactions',      2, t_acid,    'olevel'),
    (v_subject, 'Salt Preparation Methods',      3, t_acid,    'olevel'),
    (v_subject, 'Alkanes & Alkenes',             1, t_org,     'olevel'),
    (v_subject, 'Alcohols & Esters',             2, t_org,     'olevel'),
    (v_subject, 'Polymers & Plastics',           3, t_org,     'olevel'),
    (v_subject, 'Electrolysis of Solutions',     1, t_electro, 'olevel'),
    (v_subject, 'Industrial Electrolysis',       2, t_electro, 'olevel'),
    (v_subject, 'Collision Theory',              1, t_rate,    'olevel'),
    (v_subject, 'Temperature, Concentration & Catalyst Effects', 2, t_rate, 'olevel')
  ON CONFLICT DO NOTHING;

END $$;


-- ----------------------------------------------------------------
-- 2.10  Physics (PHY) — O-Level
-- ----------------------------------------------------------------
DO $$
DECLARE
  v_subject UUID;
  t_mech UUID; t_elec UUID; t_waves UUID; t_thermal UUID; t_modern UUID;
BEGIN
  SELECT id INTO v_subject FROM subjects WHERE code = 'PHY' AND zimsec_level = 'olevel' LIMIT 1;
  IF v_subject IS NULL THEN RETURN; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Mechanics', 'Motion, forces, Newton''s laws, work and energy', 1, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_mech;
  IF t_mech IS NULL THEN SELECT id INTO t_mech FROM topics WHERE subject_id = v_subject AND name = 'Mechanics'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Electricity & Magnetism', 'Circuits, Ohm''s law, electromagnetic induction', 2, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_elec;
  IF t_elec IS NULL THEN SELECT id INTO t_elec FROM topics WHERE subject_id = v_subject AND name = 'Electricity & Magnetism'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Waves & Optics', 'Wave properties, light, sound and electromagnetic spectrum', 3, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_waves;
  IF t_waves IS NULL THEN SELECT id INTO t_waves FROM topics WHERE subject_id = v_subject AND name = 'Waves & Optics'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Thermal Physics', 'Heat, temperature, thermal expansion and gas laws', 4, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_thermal;
  IF t_thermal IS NULL THEN SELECT id INTO t_thermal FROM topics WHERE subject_id = v_subject AND name = 'Thermal Physics'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Modern Physics', 'Radioactivity, atomic structure, nuclear energy', 5, 'olevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_modern;
  IF t_modern IS NULL THEN SELECT id INTO t_modern FROM topics WHERE subject_id = v_subject AND name = 'Modern Physics'; END IF;

  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Kinematics',                    1, t_mech,    'olevel'),
    (v_subject, 'Newton''s Laws of Motion',      2, t_mech,    'olevel'),
    (v_subject, 'Work, Energy & Power',          3, t_mech,    'olevel'),
    (v_subject, 'Momentum & Impulse',            4, t_mech,    'olevel'),
    (v_subject, 'Pressure & Density',            5, t_mech,    'olevel'),
    (v_subject, 'Electric Circuits',             1, t_elec,    'olevel'),
    (v_subject, 'Ohm''s Law & Resistance',       2, t_elec,    'olevel'),
    (v_subject, 'Magnetic Fields',               3, t_elec,    'olevel'),
    (v_subject, 'Electromagnetic Induction',     4, t_elec,    'olevel'),
    (v_subject, 'Wave Properties',               1, t_waves,   'olevel'),
    (v_subject, 'Reflection & Refraction',       2, t_waves,   'olevel'),
    (v_subject, 'Sound & Hearing',               3, t_waves,   'olevel'),
    (v_subject, 'Electromagnetic Spectrum',      4, t_waves,   'olevel'),
    (v_subject, 'Heat Transfer',                 1, t_thermal, 'olevel'),
    (v_subject, 'Thermal Expansion',             2, t_thermal, 'olevel'),
    (v_subject, 'Gas Laws',                      3, t_thermal, 'olevel'),
    (v_subject, 'Radioactive Decay',             1, t_modern,  'olevel'),
    (v_subject, 'Nuclear Reactions',             2, t_modern,  'olevel'),
    (v_subject, 'Uses of Radiation',             3, t_modern,  'olevel')
  ON CONFLICT DO NOTHING;

END $$;


-- ============================================================
-- SECTION 3: A-LEVEL TOPIC TREES
-- ============================================================

-- ----------------------------------------------------------------
-- 3.1  A-Level Mathematics (AMAT)
-- ----------------------------------------------------------------
DO $$
DECLARE
  v_subject UUID;
  t_pure1 UUID; t_pure2 UUID; t_stat UUID; t_mech UUID;
BEGIN
  SELECT id INTO v_subject FROM subjects WHERE code = 'AMAT' AND zimsec_level = 'alevel' LIMIT 1;
  IF v_subject IS NULL THEN RETURN; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Pure Mathematics 1', 'Algebra, coordinate geometry, sequences, calculus foundations', 1, 'alevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_pure1;
  IF t_pure1 IS NULL THEN SELECT id INTO t_pure1 FROM topics WHERE subject_id = v_subject AND name = 'Pure Mathematics 1'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Pure Mathematics 2', 'Functions, logarithms, trigonometry, differentiation, integration', 2, 'alevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_pure2;
  IF t_pure2 IS NULL THEN SELECT id INTO t_pure2 FROM topics WHERE subject_id = v_subject AND name = 'Pure Mathematics 2'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Statistics', 'Probability distributions, hypothesis testing, regression', 3, 'alevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_stat;
  IF t_stat IS NULL THEN SELECT id INTO t_stat FROM topics WHERE subject_id = v_subject AND name = 'Statistics'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Mechanics', 'Kinematics, Newton''s laws, projectiles, circular motion', 4, 'alevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_mech;
  IF t_mech IS NULL THEN SELECT id INTO t_mech FROM topics WHERE subject_id = v_subject AND name = 'Mechanics'; END IF;

  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Binomial Theorem',              1, t_pure1, 'alevel'),
    (v_subject, 'Quadratics & Inequalities',     2, t_pure1, 'alevel'),
    (v_subject, 'Coordinate Geometry',           3, t_pure1, 'alevel'),
    (v_subject, 'Arithmetic & Geometric Series', 4, t_pure1, 'alevel'),
    (v_subject, 'Differentiation',               1, t_pure2, 'alevel'),
    (v_subject, 'Integration Techniques',        2, t_pure2, 'alevel'),
    (v_subject, 'Logarithms & Exponentials',     3, t_pure2, 'alevel'),
    (v_subject, 'Trigonometric Identities',      4, t_pure2, 'alevel'),
    (v_subject, 'Numerical Methods',             5, t_pure2, 'alevel'),
    (v_subject, 'Normal Distribution',           1, t_stat,  'alevel'),
    (v_subject, 'Hypothesis Testing',            2, t_stat,  'alevel'),
    (v_subject, 'Correlation & Regression',      3, t_stat,  'alevel'),
    (v_subject, 'Permutations & Combinations',   4, t_stat,  'alevel'),
    (v_subject, 'Kinematics in 2D',              1, t_mech,  'alevel'),
    (v_subject, 'Projectile Motion',             2, t_mech,  'alevel'),
    (v_subject, 'Circular Motion',               3, t_mech,  'alevel'),
    (v_subject, 'Equilibrium & Statics',         4, t_mech,  'alevel')
  ON CONFLICT DO NOTHING;

END $$;


-- ----------------------------------------------------------------
-- 3.2  A-Level Biology (ABIO)
-- ----------------------------------------------------------------
DO $$
DECLARE
  v_subject UUID;
  t_cell UUID; t_physio UUID; t_gen UUID; t_eco UUID;
BEGIN
  SELECT id INTO v_subject FROM subjects WHERE code = 'ABIO' AND zimsec_level = 'alevel' LIMIT 1;
  IF v_subject IS NULL THEN RETURN; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Cell & Molecular Biology', 'Cell ultrastructure, biochemistry and cell signalling', 1, 'alevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_cell;
  IF t_cell IS NULL THEN SELECT id INTO t_cell FROM topics WHERE subject_id = v_subject AND name = 'Cell & Molecular Biology'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Physiology', 'Digestion, gas exchange, transport, excretion, coordination', 2, 'alevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_physio;
  IF t_physio IS NULL THEN SELECT id INTO t_physio FROM topics WHERE subject_id = v_subject AND name = 'Physiology'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Genetics & Evolution', 'DNA replication, gene expression, inheritance and speciation', 3, 'alevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_gen;
  IF t_gen IS NULL THEN SELECT id INTO t_gen FROM topics WHERE subject_id = v_subject AND name = 'Genetics & Evolution'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Ecology', 'Populations, communities, energy flow and conservation', 4, 'alevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_eco;
  IF t_eco IS NULL THEN SELECT id INTO t_eco FROM topics WHERE subject_id = v_subject AND name = 'Ecology'; END IF;

  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Electron Microscopy & Organelles', 1, t_cell,   'alevel'),
    (v_subject, 'Enzyme Kinetics',               2, t_cell,   'alevel'),
    (v_subject, 'Cell Division & Cancer',        3, t_cell,   'alevel'),
    (v_subject, 'Membrane Transport',            4, t_cell,   'alevel'),
    (v_subject, 'Digestion & Absorption',        1, t_physio, 'alevel'),
    (v_subject, 'Gas Exchange Systems',          2, t_physio, 'alevel'),
    (v_subject, 'Cardiovascular System',         3, t_physio, 'alevel'),
    (v_subject, 'Nervous & Endocrine Systems',   4, t_physio, 'alevel'),
    (v_subject, 'Kidney & Osmoregulation',       5, t_physio, 'alevel'),
    (v_subject, 'DNA Replication & PCR',         1, t_gen,    'alevel'),
    (v_subject, 'Transcription & Translation',   2, t_gen,    'alevel'),
    (v_subject, 'Dihybrid & Linkage',            3, t_gen,    'alevel'),
    (v_subject, 'Natural Selection & Speciation',4, t_gen,    'alevel'),
    (v_subject, 'Population Dynamics',           1, t_eco,    'alevel'),
    (v_subject, 'Energy Flow & Pyramids',        2, t_eco,    'alevel'),
    (v_subject, 'Carbon & Nitrogen Cycles',      3, t_eco,    'alevel'),
    (v_subject, 'Conservation Strategies',       4, t_eco,    'alevel')
  ON CONFLICT DO NOTHING;

END $$;


-- ----------------------------------------------------------------
-- 3.3  A-Level Chemistry (ACHE)
-- ----------------------------------------------------------------
DO $$
DECLARE
  v_subject UUID;
  t_phys UUID; t_org UUID; t_inorg UUID;
BEGIN
  SELECT id INTO v_subject FROM subjects WHERE code = 'ACHE' AND zimsec_level = 'alevel' LIMIT 1;
  IF v_subject IS NULL THEN RETURN; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Physical Chemistry', 'Thermodynamics, kinetics, equilibrium, electrochemistry', 1, 'alevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_phys;
  IF t_phys IS NULL THEN SELECT id INTO t_phys FROM topics WHERE subject_id = v_subject AND name = 'Physical Chemistry'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Organic Chemistry', 'Functional groups, reaction mechanisms, synthesis', 2, 'alevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_org;
  IF t_org IS NULL THEN SELECT id INTO t_org FROM topics WHERE subject_id = v_subject AND name = 'Organic Chemistry'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Inorganic Chemistry', 'Periodic trends, transition metals, coordination compounds', 3, 'alevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_inorg;
  IF t_inorg IS NULL THEN SELECT id INTO t_inorg FROM topics WHERE subject_id = v_subject AND name = 'Inorganic Chemistry'; END IF;

  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Thermodynamics (ΔH, ΔS, ΔG)',  1, t_phys,  'alevel'),
    (v_subject, 'Reaction Kinetics',             2, t_phys,  'alevel'),
    (v_subject, 'Chemical Equilibrium & Kc',     3, t_phys,  'alevel'),
    (v_subject, 'Acids, Bases & Buffers',        4, t_phys,  'alevel'),
    (v_subject, 'Electrochemical Cells',         5, t_phys,  'alevel'),
    (v_subject, 'Stereoisomerism',               1, t_org,   'alevel'),
    (v_subject, 'Carbonyl Chemistry',            2, t_org,   'alevel'),
    (v_subject, 'Aromatic Chemistry',            3, t_org,   'alevel'),
    (v_subject, 'Amines & Amino Acids',          4, t_org,   'alevel'),
    (v_subject, 'Polymers',                      5, t_org,   'alevel'),
    (v_subject, 'Period 3 Elements',             1, t_inorg, 'alevel'),
    (v_subject, 'Transition Metal Chemistry',    2, t_inorg, 'alevel'),
    (v_subject, 'Complex Ions & Colour',         3, t_inorg, 'alevel')
  ON CONFLICT DO NOTHING;

END $$;


-- ----------------------------------------------------------------
-- 3.4  A-Level Physics (APHY)
-- ----------------------------------------------------------------
DO $$
DECLARE
  v_subject UUID;
  t_mech UUID; t_fields UUID; t_waves UUID; t_thermal UUID; t_modern UUID; t_nuclear UUID;
BEGIN
  SELECT id INTO v_subject FROM subjects WHERE code = 'APHY' AND zimsec_level = 'alevel' LIMIT 1;
  IF v_subject IS NULL THEN RETURN; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Mechanics', 'Kinematics, dynamics, circular motion, oscillations', 1, 'alevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_mech;
  IF t_mech IS NULL THEN SELECT id INTO t_mech FROM topics WHERE subject_id = v_subject AND name = 'Mechanics'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Fields', 'Gravitational, electric and magnetic fields', 2, 'alevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_fields;
  IF t_fields IS NULL THEN SELECT id INTO t_fields FROM topics WHERE subject_id = v_subject AND name = 'Fields'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Waves', 'Superposition, diffraction, polarisation, standing waves', 3, 'alevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_waves;
  IF t_waves IS NULL THEN SELECT id INTO t_waves FROM topics WHERE subject_id = v_subject AND name = 'Waves'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Thermal Physics', 'Ideal gas laws, kinetic theory, thermodynamic cycles', 4, 'alevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_thermal;
  IF t_thermal IS NULL THEN SELECT id INTO t_thermal FROM topics WHERE subject_id = v_subject AND name = 'Thermal Physics'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Modern Physics', 'Photoelectric effect, de Broglie, quantum mechanics basics', 5, 'alevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_modern;
  IF t_modern IS NULL THEN SELECT id INTO t_modern FROM topics WHERE subject_id = v_subject AND name = 'Modern Physics'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Nuclear Physics', 'Radioactivity, binding energy, fission and fusion', 6, 'alevel')
    ON CONFLICT DO NOTHING RETURNING id INTO t_nuclear;
  IF t_nuclear IS NULL THEN SELECT id INTO t_nuclear FROM topics WHERE subject_id = v_subject AND name = 'Nuclear Physics'; END IF;

  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Projectile & Circular Motion',  1, t_mech,    'alevel'),
    (v_subject, 'Simple Harmonic Motion',        2, t_mech,    'alevel'),
    (v_subject, 'Gravitational Fields',          1, t_fields,  'alevel'),
    (v_subject, 'Electric Fields & Capacitors',  2, t_fields,  'alevel'),
    (v_subject, 'Magnetic Fields & Induction',   3, t_fields,  'alevel'),
    (v_subject, 'Stationary Waves',              1, t_waves,   'alevel'),
    (v_subject, 'Diffraction & Interference',    2, t_waves,   'alevel'),
    (v_subject, 'Ideal Gas Equation',            1, t_thermal, 'alevel'),
    (v_subject, 'Kinetic Theory of Gases',       2, t_thermal, 'alevel'),
    (v_subject, 'Photoelectric Effect',          1, t_modern,  'alevel'),
    (v_subject, 'Wave-Particle Duality',         2, t_modern,  'alevel'),
    (v_subject, 'Nuclear Stability & Decay',     1, t_nuclear, 'alevel'),
    (v_subject, 'Fission & Fusion',              2, t_nuclear, 'alevel'),
    (v_subject, 'Radioactive Dating',            3, t_nuclear, 'alevel')
  ON CONFLICT DO NOTHING;

END $$;


-- ============================================================
-- SECTION 4: PRIMARY TOPIC TREES (ECD–Grade 7)
-- ============================================================

-- ----------------------------------------------------------------
-- 4.1  Primary Mathematics (PMAT)
-- ----------------------------------------------------------------
DO $$
DECLARE
  v_subject UUID;
  t_num UUID; t_ops UUID; t_frac UUID; t_meas UUID; t_geo UUID; t_data UUID;
BEGIN
  SELECT id INTO v_subject FROM subjects WHERE code = 'PMAT' AND zimsec_level = 'primary' LIMIT 1;
  IF v_subject IS NULL THEN RETURN; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Number Work', 'Counting, place value, number patterns', 1, 'primary')
    ON CONFLICT DO NOTHING RETURNING id INTO t_num;
  IF t_num IS NULL THEN SELECT id INTO t_num FROM topics WHERE subject_id = v_subject AND name = 'Number Work'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Operations', 'Addition, subtraction, multiplication, division', 2, 'primary')
    ON CONFLICT DO NOTHING RETURNING id INTO t_ops;
  IF t_ops IS NULL THEN SELECT id INTO t_ops FROM topics WHERE subject_id = v_subject AND name = 'Operations'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Fractions & Decimals', 'Simple fractions, equivalent fractions, decimals', 3, 'primary')
    ON CONFLICT DO NOTHING RETURNING id INTO t_frac;
  IF t_frac IS NULL THEN SELECT id INTO t_frac FROM topics WHERE subject_id = v_subject AND name = 'Fractions & Decimals'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Measurement', 'Length, mass, capacity, time, money', 4, 'primary')
    ON CONFLICT DO NOTHING RETURNING id INTO t_meas;
  IF t_meas IS NULL THEN SELECT id INTO t_meas FROM topics WHERE subject_id = v_subject AND name = 'Measurement'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Geometry', 'Shapes, angles, symmetry, coordinates', 5, 'primary')
    ON CONFLICT DO NOTHING RETURNING id INTO t_geo;
  IF t_geo IS NULL THEN SELECT id INTO t_geo FROM topics WHERE subject_id = v_subject AND name = 'Geometry'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Data Handling', 'Tallies, bar graphs, pictographs, simple statistics', 6, 'primary')
    ON CONFLICT DO NOTHING RETURNING id INTO t_data;
  IF t_data IS NULL THEN SELECT id INTO t_data FROM topics WHERE subject_id = v_subject AND name = 'Data Handling'; END IF;

  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Counting to 1000000',           1, t_num,  'primary'),
    (v_subject, 'Place Value',                   2, t_num,  'primary'),
    (v_subject, 'Number Patterns',               3, t_num,  'primary'),
    (v_subject, 'Addition & Subtraction',        1, t_ops,  'primary'),
    (v_subject, 'Multiplication Tables',         2, t_ops,  'primary'),
    (v_subject, 'Long Division',                 3, t_ops,  'primary'),
    (v_subject, 'Simple Fractions',              1, t_frac, 'primary'),
    (v_subject, 'Equivalent Fractions',          2, t_frac, 'primary'),
    (v_subject, 'Decimals & Percentages',        3, t_frac, 'primary'),
    (v_subject, 'Length & Mass',                 1, t_meas, 'primary'),
    (v_subject, 'Time & Calendar',               2, t_meas, 'primary'),
    (v_subject, 'Money (ZWL)',                   3, t_meas, 'primary'),
    (v_subject, '2D Shapes',                     1, t_geo,  'primary'),
    (v_subject, '3D Shapes',                     2, t_geo,  'primary'),
    (v_subject, 'Lines of Symmetry',             3, t_geo,  'primary'),
    (v_subject, 'Tally Charts & Bar Graphs',     1, t_data, 'primary'),
    (v_subject, 'Pictographs',                   2, t_data, 'primary'),
    (v_subject, 'Mode & Range',                  3, t_data, 'primary')
  ON CONFLICT DO NOTHING;

END $$;


-- ----------------------------------------------------------------
-- 4.2  Primary English (PENG)
-- ----------------------------------------------------------------
DO $$
DECLARE
  v_subject UUID;
  t_read UUID; t_write UUID; t_gram UUID; t_oral UUID;
BEGIN
  SELECT id INTO v_subject FROM subjects WHERE code = 'PENG' AND zimsec_level = 'primary' LIMIT 1;
  IF v_subject IS NULL THEN RETURN; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Reading', 'Phonics, fluency, comprehension and reading strategies', 1, 'primary')
    ON CONFLICT DO NOTHING RETURNING id INTO t_read;
  IF t_read IS NULL THEN SELECT id INTO t_read FROM topics WHERE subject_id = v_subject AND name = 'Reading'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Writing', 'Handwriting, composition, creative and functional writing', 2, 'primary')
    ON CONFLICT DO NOTHING RETURNING id INTO t_write;
  IF t_write IS NULL THEN SELECT id INTO t_write FROM topics WHERE subject_id = v_subject AND name = 'Writing'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Grammar', 'Parts of speech, sentence structure, punctuation', 3, 'primary')
    ON CONFLICT DO NOTHING RETURNING id INTO t_gram;
  IF t_gram IS NULL THEN SELECT id INTO t_gram FROM topics WHERE subject_id = v_subject AND name = 'Grammar'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Oral Communication', 'Speaking, listening, rhymes and oral stories', 4, 'primary')
    ON CONFLICT DO NOTHING RETURNING id INTO t_oral;
  IF t_oral IS NULL THEN SELECT id INTO t_oral FROM topics WHERE subject_id = v_subject AND name = 'Oral Communication'; END IF;

  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Phonics & Blending',            1, t_read,  'primary'),
    (v_subject, 'Reading Fluency',               2, t_read,  'primary'),
    (v_subject, 'Comprehension Skills',          3, t_read,  'primary'),
    (v_subject, 'Handwriting',                   1, t_write, 'primary'),
    (v_subject, 'Story Writing',                 2, t_write, 'primary'),
    (v_subject, 'Letter Writing',                3, t_write, 'primary'),
    (v_subject, 'Nouns & Pronouns',              1, t_gram,  'primary'),
    (v_subject, 'Verbs & Tenses',                2, t_gram,  'primary'),
    (v_subject, 'Adjectives & Adverbs',          3, t_gram,  'primary'),
    (v_subject, 'Listening Skills',              1, t_oral,  'primary'),
    (v_subject, 'Speaking & Presentation',       2, t_oral,  'primary'),
    (v_subject, 'Oral Storytelling',             3, t_oral,  'primary')
  ON CONFLICT DO NOTHING;

END $$;


-- ----------------------------------------------------------------
-- 4.3  Environmental Science (ENV) — Primary
-- ----------------------------------------------------------------
DO $$
DECLARE
  v_subject UUID;
  t_living UUID; t_earth UUID; t_health UUID;
BEGIN
  SELECT id INTO v_subject FROM subjects WHERE code = 'ENV' AND zimsec_level = 'primary' LIMIT 1;
  IF v_subject IS NULL THEN RETURN; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Living Things', 'Plants, animals, humans and their habitats', 1, 'primary')
    ON CONFLICT DO NOTHING RETURNING id INTO t_living;
  IF t_living IS NULL THEN SELECT id INTO t_living FROM topics WHERE subject_id = v_subject AND name = 'Living Things'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Earth & Environment', 'Soil, water, air, weather and conservation', 2, 'primary')
    ON CONFLICT DO NOTHING RETURNING id INTO t_earth;
  IF t_earth IS NULL THEN SELECT id INTO t_earth FROM topics WHERE subject_id = v_subject AND name = 'Earth & Environment'; END IF;

  INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
    VALUES (v_subject, 'Health & Safety', 'Personal hygiene, disease prevention, community health', 3, 'primary')
    ON CONFLICT DO NOTHING RETURNING id INTO t_health;
  IF t_health IS NULL THEN SELECT id INTO t_health FROM topics WHERE subject_id = v_subject AND name = 'Health & Safety'; END IF;

  INSERT INTO topics (subject_id, name, order_index, parent_topic_id, zimsec_level) VALUES
    (v_subject, 'Plants & Their Parts',          1, t_living, 'primary'),
    (v_subject, 'Animals & Classification',      2, t_living, 'primary'),
    (v_subject, 'Human Body',                    3, t_living, 'primary'),
    (v_subject, 'Food Chains',                   4, t_living, 'primary'),
    (v_subject, 'Types of Soil',                 1, t_earth,  'primary'),
    (v_subject, 'Water Cycle',                   2, t_earth,  'primary'),
    (v_subject, 'Weather & Seasons',             3, t_earth,  'primary'),
    (v_subject, 'Pollution & Waste Management',  4, t_earth,  'primary'),
    (v_subject, 'Personal Hygiene',              1, t_health, 'primary'),
    (v_subject, 'Common Diseases',               2, t_health, 'primary'),
    (v_subject, 'Road Safety',                   3, t_health, 'primary'),
    (v_subject, 'First Aid Basics',              4, t_health, 'primary')
  ON CONFLICT DO NOTHING;

END $$;


-- ============================================================
-- SECTION 5: DAILY CHALLENGES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_challenges (
  id             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  question       TEXT      NOT NULL,
  option_a       TEXT      NOT NULL,
  option_b       TEXT      NOT NULL,
  option_c       TEXT      NOT NULL,
  option_d       TEXT      NOT NULL,
  correct_answer CHAR(1)   NOT NULL CHECK (correct_answer IN ('a','b','c','d')),
  explanation    TEXT,
  subject_id     UUID      REFERENCES subjects(id),
  topic_id       UUID      REFERENCES topics(id),
  zimsec_level   TEXT,
  difficulty     TEXT      DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  challenge_date DATE      DEFAULT CURRENT_DATE,
  xp_reward      INTEGER   DEFAULT 10,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "challenges_public_read" ON daily_challenges FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_challenges_date    ON daily_challenges(challenge_date);
CREATE INDEX IF NOT EXISTS idx_challenges_subject ON daily_challenges(subject_id);
CREATE INDEX IF NOT EXISTS idx_challenges_level   ON daily_challenges(zimsec_level);


-- ============================================================
-- SECTION 6: DAILY CHALLENGE SAMPLE QUESTIONS (30 questions)
-- ============================================================

DO $$
DECLARE
  s_mat  UUID; s_eng  UUID; s_bio  UUID; s_che  UUID; s_phy  UUID;
  s_his  UUID; s_geo  UUID; s_com  UUID; s_acc  UUID; s_sci  UUID;
  s_amat UUID; s_abio UUID; s_ache UUID; s_aphy UUID;
  s_pmat UUID; s_peng UUID; s_env  UUID;
  base_date DATE := CURRENT_DATE;
BEGIN
  -- Fetch subject IDs
  SELECT id INTO s_mat  FROM subjects WHERE code = 'MAT'  AND zimsec_level = 'olevel'  LIMIT 1;
  SELECT id INTO s_eng  FROM subjects WHERE code = 'ENG'  AND zimsec_level = 'olevel'  LIMIT 1;
  SELECT id INTO s_bio  FROM subjects WHERE code = 'BIO'  AND zimsec_level = 'olevel'  LIMIT 1;
  SELECT id INTO s_che  FROM subjects WHERE code = 'CHE'  AND zimsec_level = 'olevel'  LIMIT 1;
  SELECT id INTO s_phy  FROM subjects WHERE code = 'PHY'  AND zimsec_level = 'olevel'  LIMIT 1;
  SELECT id INTO s_his  FROM subjects WHERE code = 'HIS'  AND zimsec_level = 'olevel'  LIMIT 1;
  SELECT id INTO s_geo  FROM subjects WHERE code = 'GEO'  AND zimsec_level = 'olevel'  LIMIT 1;
  SELECT id INTO s_com  FROM subjects WHERE code = 'COM'  AND zimsec_level = 'olevel'  LIMIT 1;
  SELECT id INTO s_acc  FROM subjects WHERE code = 'ACC'  AND zimsec_level = 'olevel'  LIMIT 1;
  SELECT id INTO s_sci  FROM subjects WHERE code = 'SCI'  AND zimsec_level = 'olevel'  LIMIT 1;
  SELECT id INTO s_amat FROM subjects WHERE code = 'AMAT' AND zimsec_level = 'alevel'  LIMIT 1;
  SELECT id INTO s_abio FROM subjects WHERE code = 'ABIO' AND zimsec_level = 'alevel'  LIMIT 1;
  SELECT id INTO s_ache FROM subjects WHERE code = 'ACHE' AND zimsec_level = 'alevel'  LIMIT 1;
  SELECT id INTO s_aphy FROM subjects WHERE code = 'APHY' AND zimsec_level = 'alevel'  LIMIT 1;
  SELECT id INTO s_pmat FROM subjects WHERE code = 'PMAT' AND zimsec_level = 'primary' LIMIT 1;
  SELECT id INTO s_peng FROM subjects WHERE code = 'PENG' AND zimsec_level = 'primary' LIMIT 1;
  SELECT id INTO s_env  FROM subjects WHERE code = 'ENV'  AND zimsec_level = 'primary' LIMIT 1;

  INSERT INTO daily_challenges
    (question, option_a, option_b, option_c, option_d, correct_answer, explanation,
     subject_id, zimsec_level, difficulty, challenge_date, xp_reward)
  VALUES

  -- Q1: O-Level Mathematics — Algebra (easy)
  ('Solve for x: 3x + 7 = 22',
   'x = 3', 'x = 5', 'x = 7', 'x = 4',
   'b',
   '3x = 22 − 7 = 15, so x = 5.',
   s_mat, 'olevel', 'easy', base_date, 10),

  -- Q2: O-Level Mathematics — Quadratics (medium)
  ('The roots of x² − 5x + 6 = 0 are:',
   '2 and 3', '1 and 6', '−2 and −3', '3 and 4',
   'a',
   'Factorising: (x − 2)(x − 3) = 0, giving x = 2 or x = 3.',
   s_mat, 'olevel', 'medium', base_date + 1, 15),

  -- Q3: O-Level Mathematics — Geometry (medium)
  ('A triangle has angles of 50° and 70°. What is the third angle?',
   '50°', '60°', '70°', '80°',
   'b',
   'Angles in a triangle sum to 180°. 180 − 50 − 70 = 60°.',
   s_mat, 'olevel', 'easy', base_date + 2, 10),

  -- Q4: O-Level Mathematics — Statistics (medium)
  ('The mean of 4, 7, 9, 10 and x is 8. What is x?',
   '8', '10', '12', '6',
   'b',
   '(4 + 7 + 9 + 10 + x) / 5 = 8  ⟹  30 + x = 40  ⟹  x = 10.',
   s_mat, 'olevel', 'medium', base_date + 3, 15),

  -- Q5: O-Level English (easy)
  ('Which sentence uses the correct form of the verb?',
   'She don''t know the answer.',
   'She doesn''t knows the answer.',
   'She doesn''t know the answer.',
   'She do not knows the answer.',
   'c',
   'Third-person singular requires "doesn''t" and the base form "know".',
   s_eng, 'olevel', 'easy', base_date + 4, 10),

  -- Q6: O-Level English — Grammar (medium)
  ('Identify the passive voice: "The cake was eaten by the students."',
   'Active voice', 'Passive voice', 'Imperative mood', 'Subjunctive mood',
   'b',
   'The subject (the cake) receives the action; this is passive voice.',
   s_eng, 'olevel', 'medium', base_date + 5, 15),

  -- Q7: O-Level Biology — Cell Biology (medium)
  ('Which organelle is responsible for producing ATP in a cell?',
   'Nucleus', 'Ribosome', 'Mitochondrion', 'Golgi apparatus',
   'c',
   'The mitochondrion is the site of aerobic respiration and ATP synthesis.',
   s_bio, 'olevel', 'medium', base_date + 6, 15),

  -- Q8: O-Level Biology — Genetics (hard)
  ('In a monohybrid cross between two heterozygous tall plants (Tt × Tt), what proportion of offspring will be short (tt)?',
   '1/4', '1/2', '3/4', '0',
   'a',
   'Punnett square gives TT : Tt : tt = 1:2:1. Therefore tt = 1/4 of offspring.',
   s_bio, 'olevel', 'hard', base_date + 7, 20),

  -- Q9: O-Level Biology — Photosynthesis (easy)
  ('Which gas is produced during photosynthesis?',
   'Carbon dioxide', 'Nitrogen', 'Oxygen', 'Hydrogen',
   'c',
   'Photosynthesis splits water molecules and releases oxygen as a by-product.',
   s_bio, 'olevel', 'easy', base_date + 8, 10),

  -- Q10: O-Level Chemistry — Atomic Structure (medium)
  ('An atom has atomic number 11 and mass number 23. How many neutrons does it have?',
   '11', '12', '23', '34',
   'b',
   'Neutrons = mass number − atomic number = 23 − 11 = 12.',
   s_che, 'olevel', 'easy', base_date + 9, 10),

  -- Q11: O-Level Chemistry — Acids & Bases (medium)
  ('Which of the following is a strong acid?',
   'Ethanoic acid', 'Citric acid', 'Hydrochloric acid', 'Carbonic acid',
   'c',
   'HCl fully dissociates in water, making it a strong acid.',
   s_che, 'olevel', 'medium', base_date + 10, 15),

  -- Q12: O-Level Chemistry — Organic Chemistry (hard)
  ('What is the general formula for alkanes?',
   'CₙH₂ₙ', 'CₙH₂ₙ₊₂', 'CₙH₂ₙ₋₂', 'CₙHₙ',
   'b',
   'Alkanes are saturated hydrocarbons with general formula CₙH₂ₙ₊₂.',
   s_che, 'olevel', 'medium', base_date + 11, 15),

  -- Q13: O-Level Physics — Mechanics (medium)
  ('A car travels 120 km in 2 hours. What is its average speed?',
   '60 km/h', '240 km/h', '40 km/h', '30 km/h',
   'a',
   'Speed = distance ÷ time = 120 ÷ 2 = 60 km/h.',
   s_phy, 'olevel', 'easy', base_date + 12, 10),

  -- Q14: O-Level Physics — Electricity (medium)
  ('A resistor of 4 Ω is connected to a 12 V supply. What is the current?',
   '3 A', '48 A', '0.33 A', '8 A',
   'a',
   'By Ohm''s Law: I = V/R = 12/4 = 3 A.',
   s_phy, 'olevel', 'medium', base_date + 13, 15),

  -- Q15: O-Level Physics — Waves (medium)
  ('The speed of light in a vacuum is approximately:',
   '3 × 10⁶ m/s', '3 × 10⁸ m/s', '3 × 10¹⁰ m/s', '3 × 10⁴ m/s',
   'b',
   'The speed of light c ≈ 3 × 10⁸ m/s is a fundamental constant.',
   s_phy, 'olevel', 'medium', base_date + 14, 15),

  -- Q16: O-Level History — Zimbabwe (medium)
  ('In which year did Zimbabwe achieve independence?',
   '1965', '1978', '1980', '1990',
   'c',
   'Zimbabwe gained independence on 18 April 1980 under Robert Mugabe.',
   s_his, 'olevel', 'easy', base_date + 15, 10),

  -- Q17: O-Level History — Colonisation (medium)
  ('Which company colonised Zimbabwe in 1890?',
   'East India Company', 'British South Africa Company', 'Royal Niger Company', 'Imperial British East Africa Company',
   'b',
   'Cecil Rhodes''s BSAC (British South Africa Company) sent the Pioneer Column in 1890.',
   s_his, 'olevel', 'medium', base_date + 16, 15),

  -- Q18: O-Level Geography — Map Reading (easy)
  ('What does a contour line on a topographic map represent?',
   'A road', 'A river', 'Points of equal elevation', 'A political boundary',
   'c',
   'Contour lines join points of equal height above sea level.',
   s_geo, 'olevel', 'easy', base_date + 17, 10),

  -- Q19: O-Level Commerce — Banking (medium)
  ('Which institution controls monetary policy in Zimbabwe?',
   'Commercial banks', 'Reserve Bank of Zimbabwe', 'Ministry of Finance', 'ZIMRA',
   'b',
   'The Reserve Bank of Zimbabwe (RBZ) is the central bank that manages monetary policy.',
   s_com, 'olevel', 'medium', base_date + 18, 15),

  -- Q20: O-Level Accounts — Bookkeeping (medium)
  ('When a business pays rent, which account is debited?',
   'Capital account', 'Cash account', 'Rent account', 'Creditors account',
   'c',
   'Paying rent is an expense; the Rent account is debited (expense increases).',
   s_acc, 'olevel', 'medium', base_date + 19, 15),

  -- Q21: O-Level Accounts — Trial Balance (hard)
  ('If a trial balance does not balance, which of the following could be a cause?',
   'A transaction posted twice to both sides', 'An error of omission', 'An error of commission', 'A transposition error',
   'd',
   'A transposition error (digits reversed, e.g. 54 written as 45) causes an imbalance detectable in the trial balance.',
   s_acc, 'olevel', 'hard', base_date + 20, 20),

  -- Q22: A-Level Mathematics — Pure (hard)
  ('Differentiate y = 3x⁴ − 2x² + 5x − 1 with respect to x.',
   '12x³ − 4x + 5', '12x³ − 2x + 5', '3x³ − 4x + 5', '12x³ − 4x',
   'a',
   'Using power rule: dy/dx = 12x³ − 4x + 5 (constant −1 differentiates to 0).',
   s_amat, 'alevel', 'hard', base_date + 21, 20),

  -- Q23: A-Level Biology — Genetics (hard)
  ('Which enzyme is responsible for unzipping the DNA double helix during replication?',
   'DNA polymerase', 'RNA polymerase', 'Helicase', 'Ligase',
   'c',
   'Helicase breaks the hydrogen bonds between base pairs, unwinding the double helix.',
   s_abio, 'alevel', 'hard', base_date + 22, 20),

  -- Q24: A-Level Chemistry — Physical Chemistry (hard)
  ('For the reaction A ⇌ B, ΔG° = −RT ln K. If K > 1, then ΔG° is:',
   'Positive', 'Zero', 'Negative', 'Cannot be determined',
   'c',
   'If K > 1, ln K > 0, so ΔG° = −RT ln K is negative, meaning the reaction is spontaneous.',
   s_ache, 'alevel', 'hard', base_date + 23, 20),

  -- Q25: A-Level Physics — Mechanics (hard)
  ('A satellite orbits Earth at radius r. If the radius doubles, the orbital period T changes by a factor of:',
   '√2', '2', '2√2', '4',
   'c',
   'By Kepler''s Third Law T² ∝ r³, so T ∝ r^(3/2). When r doubles: T_new = T × 2^(3/2) = 2√2 T.',
   s_aphy, 'alevel', 'hard', base_date + 24, 20),

  -- Q26: Primary Mathematics — Number Work (easy)
  ('What is 345 + 278?',
   '613', '623', '523', '633',
   'b',
   '345 + 278: add units 5+8=13 carry 1; tens 4+7+1=12 carry 1; hundreds 3+2+1=6. Answer: 623.',
   s_pmat, 'primary', 'easy', base_date + 25, 5),

  -- Q27: Primary Mathematics — Fractions (easy)
  ('What is ½ + ¼?',
   '2/6', '3/4', '2/4', '1/3',
   'b',
   '½ = 2/4, so 2/4 + 1/4 = 3/4.',
   s_pmat, 'primary', 'easy', base_date + 26, 5),

  -- Q28: Primary English — Grammar (easy)
  ('Which word is a noun in this sentence: "The dog runs fast."?',
   'The', 'dog', 'runs', 'fast',
   'b',
   '"Dog" names a living creature — it is a noun.',
   s_peng, 'primary', 'easy', base_date + 27, 5),

  -- Q29: Environmental Science — Living Things (easy)
  ('Which part of a plant makes food using sunlight?',
   'Root', 'Stem', 'Leaf', 'Flower',
   'c',
   'Leaves contain chlorophyll which captures sunlight for photosynthesis.',
   s_env, 'primary', 'easy', base_date + 28, 5),

  -- Q30: Combined Science — Physics section (medium)
  ('Which form of energy is stored in a compressed spring?',
   'Kinetic energy', 'Thermal energy', 'Chemical energy', 'Elastic potential energy',
   'd',
   'A compressed spring stores elastic potential energy due to its deformation.',
   s_sci, 'olevel', 'medium', base_date + 29, 15)

  ON CONFLICT DO NOTHING;

END $$;


-- ============================================================
-- SECTION 7: DAILY CHALLENGE ATTEMPTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_challenge_attempts (
  id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID      REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID      REFERENCES daily_challenges(id),
  answer       CHAR(1),
  is_correct   BOOLEAN,
  xp_earned    INTEGER   DEFAULT 0,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE daily_challenge_attempts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "attempts_own" ON daily_challenge_attempts
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_attempts_user      ON daily_challenge_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_challenge ON daily_challenge_attempts(challenge_id);
CREATE INDEX IF NOT EXISTS idx_attempts_date      ON daily_challenge_attempts(attempted_at);


-- ============================================================
-- SECTION 8: COUPONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS coupons (
  id               UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT       UNIQUE NOT NULL,
  description      TEXT,
  discount_type    TEXT       DEFAULT 'percent'
                              CHECK (discount_type IN ('percent', 'fixed')),
  discount_value   NUMERIC(10,2) NOT NULL,
  max_uses         INTEGER    DEFAULT NULL,
  uses_count       INTEGER    DEFAULT 0,
  valid_from       TIMESTAMPTZ DEFAULT NOW(),
  valid_until      TIMESTAMPTZ,
  applicable_plans TEXT[]     DEFAULT ARRAY['pro', 'elite'],
  is_active        BOOLEAN    DEFAULT TRUE,
  created_by       UUID       REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "coupons_admin_all" ON coupons
    FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "coupons_public_read_active" ON coupons
    FOR SELECT USING (is_active = TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_coupons_code   ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);


-- ============================================================
-- SECTION 9: SAMPLE COUPONS
-- ============================================================

INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, applicable_plans, is_active)
VALUES
  ('LAUNCH50',
   '50% off launch promotion — valid on all plans, up to 100 uses',
   'percent', 50.00, 100, ARRAY['pro', 'elite'], TRUE),

  ('SCHOOL20',
   '20% off the Elite plan for school groups',
   'percent', 20.00, 50, ARRAY['elite'], TRUE),

  ('ZIMSEC2025',
   'USD $2 off the Pro plan',
   'fixed', 2.00, 200, ARRAY['pro'], TRUE),

  ('TEACHERS30',
   '30% off for teachers — both Pro and Elite plans',
   'percent', 30.00, 30, ARRAY['pro', 'elite'], TRUE)

ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- SECTION 10: REFERRALS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS referrals (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id    UUID    REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id    UUID    REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code  TEXT    NOT NULL,
  reward_granted BOOLEAN DEFAULT FALSE,
  reward_type    TEXT    DEFAULT 'pro_days',
  reward_value   INTEGER DEFAULT 7,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id)
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "referrals_own" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code     ON referrals(referral_code);


-- ============================================================
-- SECTION 11: REFERRAL CODE COLUMN ON PROFILES
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);


-- ============================================================
-- END OF MIGRATION 017
-- ============================================================
