-- ============================================================
-- 017_zimsec_content.sql
-- ZIMSEC Curriculum Content Seed: Topics, Subtopics, Question Bank
-- Safe to re-run (IF NOT EXISTS, ON CONFLICT DO NOTHING)
-- ============================================================

-- ============================================================
-- TOPICS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS topics (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id   UUID         REFERENCES subjects(id) ON DELETE CASCADE,
  name         TEXT         NOT NULL,
  description  TEXT,
  order_index  INT          DEFAULT 0,
  zimsec_level zimsec_level NOT NULL,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "topics_public_read" ON topics FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS topics_subject_idx ON topics(subject_id);
CREATE INDEX IF NOT EXISTS topics_level_idx   ON topics(zimsec_level);

-- ============================================================
-- SUBTOPICS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS subtopics (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id    UUID        REFERENCES topics(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  order_index INT         DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subtopics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "subtopics_public_read" ON subtopics FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS subtopics_topic_idx ON subtopics(topic_id);

-- ============================================================
-- QUESTION BANK TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS question_bank (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id      UUID         REFERENCES topics(id)    ON DELETE SET NULL,
  subtopic_id   UUID         REFERENCES subtopics(id) ON DELETE SET NULL,
  subject_id    UUID         REFERENCES subjects(id)  ON DELETE CASCADE,
  zimsec_level  zimsec_level NOT NULL,
  question_text TEXT         NOT NULL,
  question_type TEXT         DEFAULT 'mcq'
                             CHECK (question_type IN ('mcq', 'structured', 'essay')),
  options       JSONB,       -- MCQ: [{label, text, correct}]
  answer_text   TEXT,        -- structured / essay model answer
  marks         INT          DEFAULT 1,
  year          INT,
  source        TEXT,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "question_bank_read" ON question_bank FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS qb_subject_idx ON question_bank(subject_id);
CREATE INDEX IF NOT EXISTS qb_topic_idx   ON question_bank(topic_id);
CREATE INDEX IF NOT EXISTS qb_level_idx   ON question_bank(zimsec_level);

-- ============================================================
-- O-LEVEL TOPICS & SUBTOPICS
-- ============================================================

-- ─── MATHEMATICS O-LEVEL ────────────────────────────────────

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Number & Algebra',
  'Integers, fractions, decimals, indices, surds, linear and quadratic equations, simultaneous equations, inequalities and algebraic manipulation.',
  1, 'olevel' FROM subjects WHERE code = 'MATH_O'
ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Geometry & Measurement',
  'Properties of shapes, angles, area, perimeter, volume, surface area, circle theorems and geometric constructions.',
  2, 'olevel' FROM subjects WHERE code = 'MATH_O'
ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Statistics & Probability',
  'Data collection, frequency tables, mean/median/mode, histograms, cumulative frequency, probability and combined events.',
  3, 'olevel' FROM subjects WHERE code = 'MATH_O'
ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Trigonometry',
  'Sine, cosine and tangent ratios, angles of elevation and depression, sine rule, cosine rule, and area of a triangle.',
  4, 'olevel' FROM subjects WHERE code = 'MATH_O'
ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Graphs & Functions',
  'Cartesian plane, gradient, equation of a straight line, quadratic graphs, distance-time and speed-time graphs, and transformation of functions.',
  5, 'olevel' FROM subjects WHERE code = 'MATH_O'
ON CONFLICT DO NOTHING;

-- Subtopics: Number & Algebra
INSERT INTO subtopics (topic_id, name, description, order_index)
SELECT t.id, 'Indices & Surds', 'Laws of indices, standard form, simplification of surds.', 1
FROM topics t JOIN subjects s ON t.subject_id = s.id
WHERE s.code = 'MATH_O' AND t.name = 'Number & Algebra' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, description, order_index)
SELECT t.id, 'Linear Equations & Inequalities', 'Solving linear equations, inequalities and representing on a number line.', 2
FROM topics t JOIN subjects s ON t.subject_id = s.id
WHERE s.code = 'MATH_O' AND t.name = 'Number & Algebra' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, description, order_index)
SELECT t.id, 'Quadratic Equations', 'Factorisation, completing the square, quadratic formula.', 3
FROM topics t JOIN subjects s ON t.subject_id = s.id
WHERE s.code = 'MATH_O' AND t.name = 'Number & Algebra' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, description, order_index)
SELECT t.id, 'Simultaneous Equations', 'Solving two equations with two unknowns algebraically and graphically.', 4
FROM topics t JOIN subjects s ON t.subject_id = s.id
WHERE s.code = 'MATH_O' AND t.name = 'Number & Algebra' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, description, order_index)
SELECT t.id, 'Algebraic Manipulation', 'Expansion, factorisation, algebraic fractions, changing the subject.', 5
FROM topics t JOIN subjects s ON t.subject_id = s.id
WHERE s.code = 'MATH_O' AND t.name = 'Number & Algebra' ON CONFLICT DO NOTHING;

-- Subtopics: Geometry & Measurement
INSERT INTO subtopics (topic_id, name, description, order_index)
SELECT t.id, 'Circle Theorems', 'Angles in a semicircle, alternate segment theorem, cyclic quadrilaterals.', 1
FROM topics t JOIN subjects s ON t.subject_id = s.id
WHERE s.code = 'MATH_O' AND t.name = 'Geometry & Measurement' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, description, order_index)
SELECT t.id, 'Area & Perimeter', 'Area of plane shapes, perimeter calculations, composite shapes.', 2
FROM topics t JOIN subjects s ON t.subject_id = s.id
WHERE s.code = 'MATH_O' AND t.name = 'Geometry & Measurement' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, description, order_index)
SELECT t.id, 'Volume & Surface Area', 'Prisms, cylinders, cones, pyramids, spheres.', 3
FROM topics t JOIN subjects s ON t.subject_id = s.id
WHERE s.code = 'MATH_O' AND t.name = 'Geometry & Measurement' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, description, order_index)
SELECT t.id, 'Transformations', 'Reflection, rotation, translation and enlargement on the Cartesian plane.', 4
FROM topics t JOIN subjects s ON t.subject_id = s.id
WHERE s.code = 'MATH_O' AND t.name = 'Geometry & Measurement' ON CONFLICT DO NOTHING;

-- Subtopics: Statistics & Probability
INSERT INTO subtopics (topic_id, name, description, order_index)
SELECT t.id, 'Measures of Central Tendency', 'Mean, median, mode for grouped and ungrouped data.', 1
FROM topics t JOIN subjects s ON t.subject_id = s.id
WHERE s.code = 'MATH_O' AND t.name = 'Statistics & Probability' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, description, order_index)
SELECT t.id, 'Histograms & Frequency Polygons', 'Drawing and interpreting frequency histograms and polygons.', 2
FROM topics t JOIN subjects s ON t.subject_id = s.id
WHERE s.code = 'MATH_O' AND t.name = 'Statistics & Probability' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, description, order_index)
SELECT t.id, 'Cumulative Frequency', 'Cumulative frequency curves, median, quartiles and interquartile range.', 3
FROM topics t JOIN subjects s ON t.subject_id = s.id
WHERE s.code = 'MATH_O' AND t.name = 'Statistics & Probability' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, description, order_index)
SELECT t.id, 'Probability', 'Single events, combined events, tree diagrams, mutually exclusive events.', 4
FROM topics t JOIN subjects s ON t.subject_id = s.id
WHERE s.code = 'MATH_O' AND t.name = 'Statistics & Probability' ON CONFLICT DO NOTHING;

-- ─── ENGLISH LANGUAGE O-LEVEL ───────────────────────────────

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Reading Comprehension', 'Techniques for answering unseen passages, inference, vocabulary in context, author purpose and tone.', 1, 'olevel' FROM subjects WHERE code = 'ENG_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Essay Writing', 'Narrative, descriptive, argumentative and discursive essays; structure, paragraphing and coherence.', 2, 'olevel' FROM subjects WHERE code = 'ENG_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Summary Writing', 'Identifying key points, paraphrasing, conciseness and accurate representation of source text.', 3, 'olevel' FROM subjects WHERE code = 'ENG_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Grammar & Usage', 'Parts of speech, sentence structure, tense, punctuation, subject-verb agreement, reported speech.', 4, 'olevel' FROM subjects WHERE code = 'ENG_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Directed Writing', 'Letters (formal/informal), reports, speeches, notices and other functional writing formats.', 5, 'olevel' FROM subjects WHERE code = 'ENG_O' ON CONFLICT DO NOTHING;

-- Subtopics: Reading Comprehension
INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Literal Comprehension Questions', 1
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'ENG_O' AND t.name = 'Reading Comprehension' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Inferential Questions', 2
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'ENG_O' AND t.name = 'Reading Comprehension' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Vocabulary in Context', 3
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'ENG_O' AND t.name = 'Reading Comprehension' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Author''s Purpose & Tone', 4
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'ENG_O' AND t.name = 'Reading Comprehension' ON CONFLICT DO NOTHING;

-- Subtopics: Essay Writing
INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Narrative Essays', 1
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'ENG_O' AND t.name = 'Essay Writing' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Descriptive Essays', 2
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'ENG_O' AND t.name = 'Essay Writing' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Argumentative & Discursive Essays', 3
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'ENG_O' AND t.name = 'Essay Writing' ON CONFLICT DO NOTHING;

-- ─── COMBINED SCIENCE O-LEVEL ───────────────────────────────

-- Biology strand
INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Cells & Cell Processes', 'Cell structure (plant and animal), cell organelles, diffusion, osmosis, active transport.', 1, 'olevel' FROM subjects WHERE code = 'SCI_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Nutrition in Plants & Animals', 'Photosynthesis, balanced diet, digestive system, enzymes and food tests.', 2, 'olevel' FROM subjects WHERE code = 'SCI_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Respiration', 'Aerobic and anaerobic respiration, the respiratory system, gas exchange and breathing mechanism.', 3, 'olevel' FROM subjects WHERE code = 'SCI_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Reproduction', 'Sexual and asexual reproduction, human reproductive system, flowering plant reproduction, fertilisation.', 4, 'olevel' FROM subjects WHERE code = 'SCI_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Ecology', 'Food chains and webs, nutrient cycles, ecosystems, populations and environmental issues.', 5, 'olevel' FROM subjects WHERE code = 'SCI_O' ON CONFLICT DO NOTHING;

-- Chemistry strand
INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Atomic Structure', 'Protons, neutrons, electrons, electron configuration, isotopes and relative atomic mass.', 6, 'olevel' FROM subjects WHERE code = 'SCI_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'The Periodic Table', 'Periods and groups, trends in properties, metals and non-metals, Group I, Group VII and noble gases.', 7, 'olevel' FROM subjects WHERE code = 'SCI_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Chemical Bonding', 'Ionic bonding, covalent bonding, metallic bonding, dot-and-cross diagrams, giant structures.', 8, 'olevel' FROM subjects WHERE code = 'SCI_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Chemical Reactions', 'Rates of reaction, energy changes, acids and bases, salts, oxidation and reduction.', 9, 'olevel' FROM subjects WHERE code = 'SCI_O' ON CONFLICT DO NOTHING;

-- Physics strand
INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Forces & Motion', 'Speed, velocity, acceleration, Newton''s laws, momentum, friction and gravity.', 10, 'olevel' FROM subjects WHERE code = 'SCI_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Energy', 'Forms of energy, energy transfers, work, power, efficiency, renewable and non-renewable sources.', 11, 'olevel' FROM subjects WHERE code = 'SCI_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Waves', 'Transverse and longitudinal waves, reflection, refraction, diffraction, sound and light.', 12, 'olevel' FROM subjects WHERE code = 'SCI_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Electricity', 'Current, voltage, resistance, Ohm''s law, series and parallel circuits, electrical power, safety.', 13, 'olevel' FROM subjects WHERE code = 'SCI_O' ON CONFLICT DO NOTHING;

-- ─── HISTORY O-LEVEL ────────────────────────────────────────

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Colonial Zimbabwe', 'Occupation of Zimbabwe, BSAC rule, land alienation, the Reserves system, colonial economy and administration.', 1, 'olevel' FROM subjects WHERE code = 'HIST_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Chimurenga Wars', 'First Chimurenga (1896-97), Second Chimurenga (1966-79), guerrilla warfare, liberation movements (ZANU/ZAPU), Lancaster House Agreement.', 2, 'olevel' FROM subjects WHERE code = 'HIST_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Post-Independence Zimbabwe', 'Independence 1980, reconstruction, Unity Accord 1987, political and economic developments.', 3, 'olevel' FROM subjects WHERE code = 'HIST_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'African History', 'Pre-colonial African states, the Scramble for Africa, colonialism across the continent, African nationalism and independence movements.', 4, 'olevel' FROM subjects WHERE code = 'HIST_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'World History', 'World War I, World War II, the Cold War, the United Nations, and globalisation.', 5, 'olevel' FROM subjects WHERE code = 'HIST_O' ON CONFLICT DO NOTHING;

-- Subtopics: Colonial Zimbabwe
INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'The Pioneer Column & BSAC Charter', 1
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'HIST_O' AND t.name = 'Colonial Zimbabwe' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Land Alienation & the Native Reserves', 2
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'HIST_O' AND t.name = 'Colonial Zimbabwe' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Colonial Economy & Forced Labour', 3
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'HIST_O' AND t.name = 'Colonial Zimbabwe' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Responsible Government & UDI', 4
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'HIST_O' AND t.name = 'Colonial Zimbabwe' ON CONFLICT DO NOTHING;

-- Subtopics: Chimurenga Wars
INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'First Chimurenga — Causes & Events', 1
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'HIST_O' AND t.name = 'Chimurenga Wars' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Rise of African Nationalism (1950s–60s)', 2
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'HIST_O' AND t.name = 'Chimurenga Wars' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Second Chimurenga — Guerrilla War', 3
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'HIST_O' AND t.name = 'Chimurenga Wars' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Lancaster House Agreement & Independence', 4
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'HIST_O' AND t.name = 'Chimurenga Wars' ON CONFLICT DO NOTHING;

-- ─── GEOGRAPHY O-LEVEL ──────────────────────────────────────

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Map Skills', 'Topographic maps, grid references, contours, scale, direction and cross-sections.', 1, 'olevel' FROM subjects WHERE code = 'GEO_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Natural Resources', 'Minerals, water, forests and soils of Zimbabwe; sustainable resource use.', 2, 'olevel' FROM subjects WHERE code = 'GEO_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Climate & Weather', 'Rainfall patterns, temperature, seasons, climate change and its impact on Zimbabwe.', 3, 'olevel' FROM subjects WHERE code = 'GEO_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Population', 'Population distribution, growth, migration, urbanisation, census data and demographic transition.', 4, 'olevel' FROM subjects WHERE code = 'GEO_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Economic Development', 'Agriculture, industry, tourism, transport networks and Zimbabwe''s role in SADC.', 5, 'olevel' FROM subjects WHERE code = 'GEO_O' ON CONFLICT DO NOTHING;

-- Subtopics: Map Skills
INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Grid References & Direction', 1
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'GEO_O' AND t.name = 'Map Skills' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Contours & Relief', 2
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'GEO_O' AND t.name = 'Map Skills' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Scale, Distance & Area Calculation', 3
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'GEO_O' AND t.name = 'Map Skills' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Cross-sections & Transects', 4
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'GEO_O' AND t.name = 'Map Skills' ON CONFLICT DO NOTHING;

-- ─── SHONA O-LEVEL ──────────────────────────────────────────

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Kunyora', 'Inzwi, rondedzero, tsamba, nhau, nharireyomurindi uye zvimwe zvinyorwa.', 1, 'olevel' FROM subjects WHERE code = 'SHONA_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Kuverenga', 'Kuverenga uye kunzwisisa zvinyorwa, mibvunzo yekuverenga, zvinoreva mazwi mumhinduro.', 2, 'olevel' FROM subjects WHERE code = 'SHONA_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Ruzivo Rwomutauro', 'Tsinhanhau, maginya emashoko, mazwi akafanana, mazwi ane nzira dzakafanana, mitsara.', 3, 'olevel' FROM subjects WHERE code = 'SHONA_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Nhetembo', 'Kuverenga nhetembo, kunzwisisa mifananidzo, kuronga mazwi, chinangwa chenhetembo.', 4, 'olevel' FROM subjects WHERE code = 'SHONA_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Ngano', 'Misambo, nhoroondo dzengano, hunhu hwevatambi, pfungwa dzengano netsinhanhau.', 5, 'olevel' FROM subjects WHERE code = 'SHONA_O' ON CONFLICT DO NOTHING;

-- ─── NDEBELE O-LEVEL ────────────────────────────────────────

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Ukubhala', 'Ukubhala izincwadi, imibiko, izindaba, imikhuba yokubhala ngendlela efaneleyo.', 1, 'olevel' FROM subjects WHERE code = 'NDEB_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Ukufunda', 'Ukufunda nokuzwisisa imibhalo, imibuzo yokufunda, incazelo yamagama.', 2, 'olevel' FROM subjects WHERE code = 'NDEB_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Ulwimi', 'Ulwazimagama, ubunjalo bamagama, imisho, iziphawulo, izincazelo.', 3, 'olevel' FROM subjects WHERE code = 'NDEB_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Izinkondlo', 'Ukufunda izinkondlo, ukuzwisisa izithombe zamagama, isakhiwo senkondlo.', 4, 'olevel' FROM subjects WHERE code = 'NDEB_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Izinganekwane', 'Inhlokweni zezinganekwane, izimo zabalingisi, imiyalezo, ukubaluleka kwamasiko.', 5, 'olevel' FROM subjects WHERE code = 'NDEB_O' ON CONFLICT DO NOTHING;

-- ─── COMMERCE O-LEVEL ───────────────────────────────────────

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Trade', 'Home trade (retail and wholesale), international trade, channels of distribution and trade barriers.', 1, 'olevel' FROM subjects WHERE code = 'COMM_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Banking', 'Types of banks, banking services, methods of payment, interest, overdrafts and loans.', 2, 'olevel' FROM subjects WHERE code = 'COMM_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Transport', 'Modes of transport, choice of transport, warehousing and containerisation.', 3, 'olevel' FROM subjects WHERE code = 'COMM_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Insurance', 'Principles of insurance, types of insurance, insurance documents and the insurance process.', 4, 'olevel' FROM subjects WHERE code = 'COMM_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Business Documents', 'Quotation, purchase order, invoice, credit note, debit note, statement of account and receipt.', 5, 'olevel' FROM subjects WHERE code = 'COMM_O' ON CONFLICT DO NOTHING;

-- ─── ACCOUNTS O-LEVEL ───────────────────────────────────────

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Double Entry Bookkeeping', 'Principles of double entry, debit and credit rules, source documents and books of original entry.', 1, 'olevel' FROM subjects WHERE code = 'ACC_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Trial Balance', 'Extracting a trial balance, types of errors, correcting errors using a journal.', 2, 'olevel' FROM subjects WHERE code = 'ACC_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Final Accounts', 'Trading account, profit and loss account, balance sheet for sole traders and partnerships.', 3, 'olevel' FROM subjects WHERE code = 'ACC_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Cash Book', 'Single column, double column and triple column cash book, petty cash book and imprest system.', 4, 'olevel' FROM subjects WHERE code = 'ACC_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Ledgers', 'Sales ledger, purchases ledger, general ledger, control accounts and bank reconciliation.', 5, 'olevel' FROM subjects WHERE code = 'ACC_O' ON CONFLICT DO NOTHING;

-- ─── BIOLOGY O-LEVEL ────────────────────────────────────────

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Cell Biology', 'Plant and animal cell structure, organelles and their functions, cell division (mitosis and meiosis).', 1, 'olevel' FROM subjects WHERE code = 'BIO_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Nutrition', 'Photosynthesis, mineral nutrition in plants, human digestive system, enzymes and balanced diet.', 2, 'olevel' FROM subjects WHERE code = 'BIO_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Respiration & Gas Exchange', 'Aerobic respiration, anaerobic respiration, the human respiratory system, breathing mechanism.', 3, 'olevel' FROM subjects WHERE code = 'BIO_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Transport in Organisms', 'The human circulatory system, blood and blood components, transport in plants (xylem and phloem).', 4, 'olevel' FROM subjects WHERE code = 'BIO_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Reproduction', 'Sexual and asexual reproduction, human reproductive system, menstrual cycle, flowering plant reproduction.', 5, 'olevel' FROM subjects WHERE code = 'BIO_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Genetics', 'DNA structure, genes and alleles, monohybrid inheritance, sex-linked traits, mutation.', 6, 'olevel' FROM subjects WHERE code = 'BIO_O' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Ecology', 'Ecosystems, food chains and webs, nutrient cycling, population dynamics, conservation in Zimbabwe.', 7, 'olevel' FROM subjects WHERE code = 'BIO_O' ON CONFLICT DO NOTHING;

-- Subtopics: Cell Biology (BIO_O)
INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Cell Structure & Organelles', 1
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'BIO_O' AND t.name = 'Cell Biology' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Osmosis & Diffusion', 2
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'BIO_O' AND t.name = 'Cell Biology' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Mitosis & Meiosis', 3
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'BIO_O' AND t.name = 'Cell Biology' ON CONFLICT DO NOTHING;

-- Subtopics: Nutrition (BIO_O)
INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Photosynthesis', 1
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'BIO_O' AND t.name = 'Nutrition' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Human Digestive System', 2
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'BIO_O' AND t.name = 'Nutrition' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Enzymes', 3
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'BIO_O' AND t.name = 'Nutrition' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Balanced Diet & Deficiency Diseases', 4
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'BIO_O' AND t.name = 'Nutrition' ON CONFLICT DO NOTHING;

-- ============================================================
-- A-LEVEL TOPICS & SUBTOPICS
-- ============================================================

-- ─── MATHEMATICS A-LEVEL ────────────────────────────────────

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Pure Maths — Algebra', 'Polynomials, partial fractions, binomial theorem, exponentials, logarithms, mathematical induction.', 1, 'alevel' FROM subjects WHERE code = 'MATH_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Pure Maths — Calculus', 'Differentiation (chain, product, quotient rules), integration techniques, differential equations, applications.', 2, 'alevel' FROM subjects WHERE code = 'MATH_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Pure Maths — Trigonometry', 'Radians, compound angles, inverse trig functions, solving trig equations, R sin(x + α) form.', 3, 'alevel' FROM subjects WHERE code = 'MATH_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Pure Maths — Vectors', '2D and 3D vectors, scalar product, vector equations of lines, angles between lines and planes.', 4, 'alevel' FROM subjects WHERE code = 'MATH_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Statistics — Probability', 'Conditional probability, permutations and combinations, discrete and continuous random variables.', 5, 'alevel' FROM subjects WHERE code = 'MATH_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Statistics — Distributions', 'Binomial, Poisson and Normal distributions; approximations between distributions.', 6, 'alevel' FROM subjects WHERE code = 'MATH_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Statistics — Hypothesis Testing', 'Null and alternative hypotheses, significance levels, one-tailed and two-tailed tests, critical regions.', 7, 'alevel' FROM subjects WHERE code = 'MATH_A' ON CONFLICT DO NOTHING;

-- Subtopics: Calculus
INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Differentiation Rules & Techniques', 1
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'MATH_A' AND t.name = 'Pure Maths — Calculus' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Integration Techniques', 2
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'MATH_A' AND t.name = 'Pure Maths — Calculus' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Differential Equations', 3
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'MATH_A' AND t.name = 'Pure Maths — Calculus' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Applications of Calculus', 4
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'MATH_A' AND t.name = 'Pure Maths — Calculus' ON CONFLICT DO NOTHING;

-- ─── PHYSICS A-LEVEL ────────────────────────────────────────

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Mechanics', 'Kinematics, dynamics, circular motion, gravitation, simple harmonic motion, momentum and energy.', 1, 'alevel' FROM subjects WHERE code = 'PHY_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Thermal Physics', 'Temperature, kinetic theory, ideal gases, thermodynamics, heat transfer and specific heat.', 2, 'alevel' FROM subjects WHERE code = 'PHY_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Waves & Oscillations', 'Superposition, stationary waves, diffraction, interference, electromagnetic spectrum, Doppler effect.', 3, 'alevel' FROM subjects WHERE code = 'PHY_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Electricity & Magnetism', 'Electric fields, capacitors, magnetic fields, electromagnetic induction, alternating current and transformers.', 4, 'alevel' FROM subjects WHERE code = 'PHY_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Modern Physics', 'Photoelectric effect, wave-particle duality, atomic models, X-rays and medical imaging.', 5, 'alevel' FROM subjects WHERE code = 'PHY_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Nuclear Physics', 'Radioactive decay, half-life, nuclear reactions, fission, fusion and radiation safety.', 6, 'alevel' FROM subjects WHERE code = 'PHY_A' ON CONFLICT DO NOTHING;

-- ─── CHEMISTRY A-LEVEL ──────────────────────────────────────

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Physical Chemistry', 'Atomic structure, bonding, energetics, kinetics, equilibrium, acids and bases, electrochemistry.', 1, 'alevel' FROM subjects WHERE code = 'CHEM_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Inorganic Chemistry', 'Periodicity, s-block, p-block and d-block elements, transition metals, complex ions.', 2, 'alevel' FROM subjects WHERE code = 'CHEM_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Organic Chemistry', 'Alkanes, alkenes, halogenoalkanes, alcohols, carboxylic acids, amines, polymers and mechanisms.', 3, 'alevel' FROM subjects WHERE code = 'CHEM_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Analytical Chemistry', 'Chromatography, IR spectroscopy, mass spectrometry, NMR, volumetric and gravimetric analysis.', 4, 'alevel' FROM subjects WHERE code = 'CHEM_A' ON CONFLICT DO NOTHING;

-- Subtopics: Physical Chemistry
INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Chemical Equilibrium & Le Chatelier''s Principle', 1
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'CHEM_A' AND t.name = 'Physical Chemistry' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Reaction Kinetics', 2
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'CHEM_A' AND t.name = 'Physical Chemistry' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Thermodynamics & Energetics', 3
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'CHEM_A' AND t.name = 'Physical Chemistry' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Electrochemistry', 4
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'CHEM_A' AND t.name = 'Physical Chemistry' ON CONFLICT DO NOTHING;

-- Subtopics: Organic Chemistry
INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Hydrocarbons (Alkanes & Alkenes)', 1
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'CHEM_A' AND t.name = 'Organic Chemistry' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Halogenoalkanes & Nucleophilic Substitution', 2
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'CHEM_A' AND t.name = 'Organic Chemistry' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Carbonyl Compounds', 3
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'CHEM_A' AND t.name = 'Organic Chemistry' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Amino Acids, Proteins & Polymers', 4
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'CHEM_A' AND t.name = 'Organic Chemistry' ON CONFLICT DO NOTHING;

-- ─── BIOLOGY A-LEVEL ────────────────────────────────────────

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Cell Biology & Biochemistry', 'Cell ultrastructure, biological molecules (carbohydrates, lipids, proteins, nucleic acids), enzymes, cell membranes.', 1, 'alevel' FROM subjects WHERE code = 'BIO_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Genetics & Evolution', 'DNA replication, transcription, translation, gene expression, inheritance patterns, evolution and natural selection.', 2, 'alevel' FROM subjects WHERE code = 'BIO_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Physiology', 'Mammalian physiology: digestion, circulation, gas exchange, excretion, nervous system, hormones and muscle action.', 3, 'alevel' FROM subjects WHERE code = 'BIO_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Ecology & Conservation', 'Ecosystems, energy flow, nutrient cycles, population ecology, biodiversity, conservation biology in Zimbabwe.', 4, 'alevel' FROM subjects WHERE code = 'BIO_A' ON CONFLICT DO NOTHING;

-- Subtopics: Genetics & Evolution
INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'DNA Replication & Protein Synthesis', 1
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'BIO_A' AND t.name = 'Genetics & Evolution' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Mendelian Genetics & Chi-squared Test', 2
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'BIO_A' AND t.name = 'Genetics & Evolution' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Gene Mutation & Chromosomal Abnormalities', 3
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'BIO_A' AND t.name = 'Genetics & Evolution' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Natural Selection & Speciation', 4
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'BIO_A' AND t.name = 'Genetics & Evolution' ON CONFLICT DO NOTHING;

-- ─── ECONOMICS A-LEVEL ──────────────────────────────────────

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Microeconomics', 'Demand and supply, price elasticity, market structures (perfect competition, monopoly, oligopoly), market failure.', 1, 'alevel' FROM subjects WHERE code = 'ECON_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Macroeconomics', 'National income accounting, GDP, economic growth, inflation, unemployment, monetary and fiscal policy.', 2, 'alevel' FROM subjects WHERE code = 'ECON_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'International Trade', 'Comparative advantage, terms of trade, balance of payments, exchange rates, trade policy and WTO.', 3, 'alevel' FROM subjects WHERE code = 'ECON_A' ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, zimsec_level)
SELECT id, 'Development Economics', 'Indicators of development, obstacles to growth, aid vs trade debate, role of IMF/World Bank, Zimbabwe''s economic trajectory.', 4, 'alevel' FROM subjects WHERE code = 'ECON_A' ON CONFLICT DO NOTHING;

-- Subtopics: Microeconomics
INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Demand, Supply & Price Determination', 1
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'ECON_A' AND t.name = 'Microeconomics' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Elasticity (PED, PES, YED, XED)', 2
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'ECON_A' AND t.name = 'Microeconomics' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Market Structures', 3
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'ECON_A' AND t.name = 'Microeconomics' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Market Failure & Government Intervention', 4
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'ECON_A' AND t.name = 'Microeconomics' ON CONFLICT DO NOTHING;

-- Subtopics: Macroeconomics
INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'National Income & GDP Measurement', 1
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'ECON_A' AND t.name = 'Macroeconomics' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Inflation & Its Causes', 2
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'ECON_A' AND t.name = 'Macroeconomics' ON CONFLICT DO NOTHING;

INSERT INTO subtopics (topic_id, name, order_index)
SELECT t.id, 'Monetary & Fiscal Policy', 3
FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.code = 'ECON_A' AND t.name = 'Macroeconomics' ON CONFLICT DO NOTHING;

-- ============================================================
-- QUESTION BANK: MATHEMATICS O-LEVEL (5 MCQs)
-- ============================================================

-- Q1: Number & Algebra — linear equation
INSERT INTO question_bank (subject_id, topic_id, zimsec_level, question_text, question_type, options, marks, year, source)
SELECT
  s.id,
  t.id,
  'olevel',
  'What is the value of x if 2x + 5 = 13?',
  'mcq',
  '[{"label":"A","text":"3","correct":false},{"label":"B","text":"4","correct":true},{"label":"C","text":"5","correct":false},{"label":"D","text":"6","correct":false}]'::jsonb,
  2, 2022, 'zimsec_2022'
FROM subjects s
JOIN topics t ON t.subject_id = s.id
WHERE s.code = 'MATH_O' AND t.name = 'Number & Algebra'
LIMIT 1;

-- Q2: Number & Algebra — indices
INSERT INTO question_bank (subject_id, topic_id, zimsec_level, question_text, question_type, options, marks, year, source)
SELECT
  s.id,
  t.id,
  'olevel',
  'Simplify: 2³ × 2⁵ ÷ 2⁴',
  'mcq',
  '[{"label":"A","text":"2²","correct":false},{"label":"B","text":"2³","correct":false},{"label":"C","text":"2⁴","correct":true},{"label":"D","text":"2⁶","correct":false}]'::jsonb,
  2, 2021, 'zimsec_2021'
FROM subjects s
JOIN topics t ON t.subject_id = s.id
WHERE s.code = 'MATH_O' AND t.name = 'Number & Algebra'
LIMIT 1;

-- Q3: Geometry & Measurement — circle area
INSERT INTO question_bank (subject_id, topic_id, zimsec_level, question_text, question_type, options, marks, year, source)
SELECT
  s.id,
  t.id,
  'olevel',
  'A circle has a radius of 7 cm. What is its area? (Take π = 22/7)',
  'mcq',
  '[{"label":"A","text":"44 cm²","correct":false},{"label":"B","text":"154 cm²","correct":true},{"label":"C","text":"22 cm²","correct":false},{"label":"D","text":"308 cm²","correct":false}]'::jsonb,
  2, 2023, 'zimsec_2023'
FROM subjects s
JOIN topics t ON t.subject_id = s.id
WHERE s.code = 'MATH_O' AND t.name = 'Geometry & Measurement'
LIMIT 1;

-- Q4: Statistics — mean
INSERT INTO question_bank (subject_id, topic_id, zimsec_level, question_text, question_type, options, marks, year, source)
SELECT
  s.id,
  t.id,
  'olevel',
  'The ages of five students are 14, 15, 16, 14, and 16. What is the mean age?',
  'mcq',
  '[{"label":"A","text":"14","correct":false},{"label":"B","text":"14.5","correct":false},{"label":"C","text":"15","correct":true},{"label":"D","text":"16","correct":false}]'::jsonb,
  2, 2022, 'zimsec_2022'
FROM subjects s
JOIN topics t ON t.subject_id = s.id
WHERE s.code = 'MATH_O' AND t.name = 'Statistics & Probability'
LIMIT 1;

-- Q5: Trigonometry — sine ratio
INSERT INTO question_bank (subject_id, topic_id, zimsec_level, question_text, question_type, options, marks, year, source)
SELECT
  s.id,
  t.id,
  'olevel',
  'In a right-angled triangle, the opposite side is 3 cm and the hypotenuse is 5 cm. What is the sine of the angle opposite the 3 cm side?',
  'mcq',
  '[{"label":"A","text":"5/3","correct":false},{"label":"B","text":"4/5","correct":false},{"label":"C","text":"3/4","correct":false},{"label":"D","text":"3/5","correct":true}]'::jsonb,
  2, 2023, 'zimsec_2023'
FROM subjects s
JOIN topics t ON t.subject_id = s.id
WHERE s.code = 'MATH_O' AND t.name = 'Trigonometry'
LIMIT 1;

-- ============================================================
-- QUESTION BANK: BIOLOGY O-LEVEL (3 structured questions)
-- ============================================================

-- SQ1: Cell Biology — osmosis
INSERT INTO question_bank (subject_id, topic_id, zimsec_level, question_text, question_type, answer_text, marks, year, source)
SELECT
  s.id,
  t.id,
  'olevel',
  'A student placed a piece of potato in a concentrated salt solution for 30 minutes.
(a) State what would happen to the potato piece. [1]
(b) Explain, using the term osmosis, why this change occurred. [3]
(c) Describe a control experiment the student could set up to compare results. [2]',
  'structured',
  '(a) The potato piece would decrease in mass / shrink / become flaccid / plasmolysed.
(b) The concentrated salt solution has a lower water potential than the potato cell sap. Water moves by osmosis (the net movement of water molecules through a partially permeable membrane from a region of higher water potential to a region of lower water potential). Water therefore moves out of the potato cells into the surrounding solution, causing the cells to lose turgidity and the potato to shrink.
(c) The student could place an identical piece of potato into distilled water (or water of the same volume). This acts as a control because distilled water has a higher water potential than the cell sap, so water would move into the cells by osmosis, and the potato would increase in mass. Comparing the two results would confirm the effect of the salt concentration.',
  6, 2022, 'zimsec_2022'
FROM subjects s
JOIN topics t ON t.subject_id = s.id
WHERE s.code = 'BIO_O' AND t.name = 'Cell Biology'
LIMIT 1;

-- SQ2: Nutrition — photosynthesis
INSERT INTO question_bank (subject_id, topic_id, zimsec_level, question_text, question_type, answer_text, marks, year, source)
SELECT
  s.id,
  t.id,
  'olevel',
  'The diagram below shows a leaf. Use your knowledge to answer the questions.
(a) Write the word equation for photosynthesis. [2]
(b) State TWO conditions needed for photosynthesis to take place at a maximum rate. [2]
(c) Explain why a variegated leaf (with green and white areas) can only produce starch in the green areas. [2]',
  'structured',
  '(a) Carbon dioxide + water → (light energy, chlorophyll) → glucose + oxygen
(b) Any TWO of: high light intensity; optimum temperature (around 25–35 °C); adequate carbon dioxide concentration; adequate water supply; presence of chlorophyll / minerals (nitrates, magnesium).
(c) Chlorophyll is the green pigment found in chloroplasts that absorbs light energy needed for photosynthesis. The white areas of the leaf lack chlorophyll (chloroplasts), so they cannot absorb light energy to drive the photosynthesis reactions. Without photosynthesis, no glucose is produced in the white areas, and therefore no starch can be synthesised there.',
  6, 2021, 'zimsec_2021'
FROM subjects s
JOIN topics t ON t.subject_id = s.id
WHERE s.code = 'BIO_O' AND t.name = 'Nutrition'
LIMIT 1;

-- SQ3: Genetics — inheritance
INSERT INTO question_bank (subject_id, topic_id, zimsec_level, question_text, question_type, answer_text, marks, year, source)
SELECT
  s.id,
  t.id,
  'olevel',
  'In pea plants, tall (T) is dominant over dwarf (t).
(a) Give the genotype of a homozygous tall plant. [1]
(b) A heterozygous tall plant is crossed with a dwarf plant. Complete the genetic cross to show the expected offspring. [3]
(c) State the expected phenotypic ratio of the offspring. [1]
(d) Explain the term "dominant allele". [2]',
  'structured',
  '(a) TT
(b) Parental genotypes: Tt × tt
    Gametes: T, t (from tall parent); t, t (from dwarf parent)
    Punnett square:
          T    t
    t  |  Tt  | tt |
    t  |  Tt  | tt |
    Offspring genotypes: Tt, Tt, tt, tt (50% Tt : 50% tt)
(c) Tall : Dwarf = 1 : 1
(d) A dominant allele is one that is always expressed in the phenotype of an organism, whether it is present as one copy (heterozygous) or two copies (homozygous dominant). It masks the effect of the recessive allele when both are present in the genotype.',
  7, 2023, 'zimsec_2023'
FROM subjects s
JOIN topics t ON t.subject_id = s.id
WHERE s.code = 'BIO_O' AND t.name = 'Genetics'
LIMIT 1;

-- ============================================================
-- END OF 017_zimsec_content.sql
-- ============================================================
