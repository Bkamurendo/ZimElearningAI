import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const CURRICULUM_DATA = [
  // ── FORM 3-4 MATHEMATICS (O-LEVEL) ──────────────────────────
  {
    subjectCode: 'OL-MATH',
    subjectName: 'Mathematics',
    level: 'olevel',
    topics: [
      { name: 'Algebraic Expressions', imp: 'high' },
      { name: 'Change of the subject of formulae', imp: 'high' },
      { name: 'Circle Geometry', imp: 'high' },
      { name: 'Equations', imp: 'high' },
      { name: 'Geometric concept', imp: 'normal' },
      { name: 'Indices', imp: 'high' },
      { name: 'Matrices', imp: 'high' },
      { name: 'Mensuration', imp: 'high' },
      { name: 'Numbers', imp: 'high' },
      { name: 'Polygons', imp: 'normal' },
      { name: 'Ratio, Rates and Proportion', imp: 'high' },
      { name: 'Right angled triangle (Trigonometry)', imp: 'high' },
      { name: 'Sets', imp: 'normal' },
      { name: 'Surds', imp: 'normal' }
    ]
  },
  // ── FORM 1-2 GEOGRAPHY (O-LEVEL) ─────────────────────────────
  {
    subjectCode: 'OL-GEOG',
    subjectName: 'Geography',
    level: 'olevel',
    topics: [
      { name: 'Agriculture and land reform', imp: 'high' },
      { name: 'Ecosystems', imp: 'normal' },
      { name: 'Energy and power development', imp: 'high' },
      { name: 'Environment management', imp: 'high' },
      { name: 'Industry', imp: 'normal' },
      { name: 'Landforms and Landscape Processes', imp: 'high' },
      { name: 'Map work and GIS', imp: 'high' },
      { name: 'Minerals and mining', imp: 'normal' },
      { name: 'Natural Resources', imp: 'normal' },
      { name: 'Settlement and Population', imp: 'high' },
      { name: 'Transport and trade', imp: 'normal' },
      { name: 'Weather and climate', imp: 'high' }
    ]
  },
  // ── FORM 1-2 HERITAGE STUDIES (O-LEVEL) ──────────────────────
  {
    subjectCode: 'OL-HERITAGE',
    subjectName: 'Heritage Studies',
    level: 'olevel',
    topics: [
      { name: 'Constitution', imp: 'high' },
      { name: 'Identity - Family, Local and National', imp: 'high' },
      { name: 'Introduction to Heritage Studies', imp: 'normal' },
      { name: 'National Heritage', imp: 'normal' },
      { name: 'National History - Sovereignty and Governance', imp: 'high' },
      { name: 'Norms and Values', imp: 'high' },
      { name: 'Rights and Responsibilities', imp: 'high' },
      { name: 'Socialisation', imp: 'normal' },
      { name: 'Structures and Functions of Central Government', imp: 'high' },
      { name: 'Systems of Governance', imp: 'high' }
    ]
  },
  // ── FORM 3-4 COMBINED SCIENCE (O-LEVEL) ──────────────────────
  {
    subjectCode: 'OL-COMSCI',
    subjectName: 'Combined Science',
    level: 'olevel',
    topics: [
      { name: 'Biology Section', imp: 'high' },
      { name: 'Chemistry Section', imp: 'high' },
      { name: 'Physics Section', imp: 'high' },
      { name: 'Matter', imp: 'high' },
      { name: 'Cells and Reproduction', imp: 'normal' },
      { name: 'Health and Diseases', imp: 'normal' }
    ]
  },
  // ── FORM 3-4 COMPUTER SCIENCE (O-LEVEL) ──────────────────────
  {
    subjectCode: 'OL-COMP',
    subjectName: 'Computer Science',
    level: 'olevel',
    topics: [
      { name: 'Algorithm Design and Problem Solving', imp: 'high' },
      { name: 'Application of Computer Science', imp: 'normal' },
      { name: 'Communication Networks and Internet', imp: 'high' },
      { name: 'Data Representation', imp: 'high' },
      { name: 'Databases', imp: 'high' },
      { name: 'Hardware and Software', imp: 'normal' },
      { name: 'Programming', imp: 'high' },
      { name: 'Security and Ethics', imp: 'high' },
      { name: 'Systems Analysis and Design', imp: 'high' },
      { name: 'Web Design', imp: 'normal' }
    ]
  },
  // ── GRADE 6-7 MATHEMATICS (PRIMARY) ──────────────────────────
  {
    subjectCode: 'PR-MATH',
    subjectName: 'Mathematics (Grade 7)',
    level: 'primary',
    topics: [
      { name: 'Measures', imp: 'normal' },
      { name: 'Numbers', imp: 'high' },
      { name: 'Operations', imp: 'high' },
      { name: 'Relationships', imp: 'normal' },
      { name: 'Data Handling', imp: 'normal' }
    ]
  },
  // ── FORM 5-6 GEOGRAPHY (A-LEVEL) ─────────────────────────────
  {
    subjectCode: 'AL-GEOG',
    subjectName: 'Geography (Advanced)',
    level: 'alevel',
    topics: [
      { name: 'GIS AND REMOTE SENSING', imp: 'high' },
      { name: 'GEOMORPHOLOGY', imp: 'high' },
      { name: 'HYDROLOGY AND FLUVIAL PROCESSES', imp: 'high' },
      { name: 'POPULATION AND MIGRATION', imp: 'high' },
      { name: 'CLIMATOLOGY', imp: 'high' },
      { name: 'HAZARDS', imp: 'normal' }
    ]
  }
]

async function seed() {
  console.log('🌱  Starting ZIMSEC Curriculum Seeding (MoPSE)...')

  for (const item of CURRICULUM_DATA) {
    // 1. Ensure Subject Exists
    const { data: subject, error: sErr } = await supabase
      .from('subjects')
      .upsert({ 
        code: item.subjectCode, 
        name: item.subjectName, 
        zimsec_level: item.level 
      }, { onConflict: 'code' })
      .select('id')
      .single()

    if (sErr || !subject) {
      console.error(`❌  Failed to upsert subject ${item.subjectCode}:`, sErr?.message)
      continue
    }

    console.log(`✅  Subject: ${item.subjectName} (${item.level})`)

    // 2. Insert Topics
    const topicRows = item.topics.map(t => ({
      subject_id: subject.id,
      topic_name: t.name,
      importance: t.imp
    }))

    const { error: tErr } = await supabase
      .from('subject_topics')
      .upsert(topicRows, { onConflict: 'subject_id, topic_name' })

    if (tErr) {
      console.error(`   ❌  Failed to seed topics:`, tErr.message)
    } else {
      console.log(`   ✓  Seeded ${item.topics.length} topics`)
    }
  }

  console.log('\n🌟  Seeding Complete!')
}

seed().catch(err => {
  console.error('❌  Unexpected error:', err)
  process.exit(1)
})
