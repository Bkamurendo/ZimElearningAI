/**
 * reclassify.mjs — Re-classify all uploaded_documents with improved heuristics
 * Run: node scripts/reclassify.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')
const envLines = readFileSync(envPath, 'utf8').split('\n')
for (const line of envLines) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

// ── Improved level classifier ────────────────────────────────────────────────
function classifyLevel(name = '') {
  const s = name.toLowerCase()
    .replace(/['\u2018\u2019\u201c\u201d]/g, '')  // strip all quote chars
    .replace(/[_\-]+/g, ' ')

  // A-Level patterns
  if (s.match(/\ba\s*level\b/) ||
      s.match(/\balevel\b/) ||
      s.match(/\ba-level\b/) ||
      s.match(/\badvanced level\b/) ||
      s.match(/\b(lower|upper)\s*6\b/) ||
      s.match(/\b6th form\b/) ||
      s.includes('6042') || s.includes('6046') || s.includes('6049') ||
      s.match(/\bal\b.*\b(maths|stats|physics|chemistry|biology|history|geography|accounts)\b/) ||
      s.match(/\b(a levels?)\s+\w/) ||
      s.match(/alevel/) ||
      s.includes('a level ') ||
      s.match(/^a\s+(level|leve)/) ) return 'alevel'

  // O-Level patterns
  if (s.match(/\bo\s*level\b/) ||
      s.match(/\bolevel\b/) ||
      s.match(/\bo-level\b/) ||
      s.match(/\borders?inary level\b/) ||
      s.match(/\bform\s*[1-4]\b/) ||
      s.match(/\b40[0-9]{2}\b/) ||     // ZIMSEC subject codes 4000-4099
      s.match(/\b(o levels?)\s+\w/) ||
      s.includes('o level ') ||
      s.match(/^o\s+(level|leve)/) ) return 'olevel'

  // Primary patterns
  if (s.match(/\bprimary\b/) ||
      s.match(/\bgrade\s*[1-7]\b/) ||
      s.match(/\bgr\s*[1-7]\b/) ||
      s.match(/\bjunior\b/) ||
      s.match(/\bgrade [1-7]\b/) ||
      s.match(/\becd\b/) ||
      s.match(/\bgrade1|grade2|grade3|grade4|grade5|grade6|grade7\b/) ||
      s.match(/\bstd\s*[1-7]\b/) ||
      s.match(/\bjss\b/) ) return 'primary'

  return null
}

// ── Improved subject classifier ──────────────────────────────────────────────
const SUBJECT_PATTERNS = [
  ['mathematics',       /\b(math|maths|mathematics|calculus|algebra|trigonometry|arithmetic|statistics and mechanics|pure math)\b|4004|4008|4028|6042/],
  ['statistics',        /\bstatistics\b|\bstats\b|6046/],
  ['pure mathematics',  /pure\s+math/],
  ['physics',           /\bphysics\b|\bphys\b|4040|physical\s+and\s+inorganic/],
  ['chemistry',         /\bchemistry\b|\bchem\b|4024|4017|organic\s+chem/],
  ['biology',           /\bbiology\b|\bbiol\b|4045|4016|digestive|organism/],
  ['combined science',  /combined\s*sci|comb\s*scie|4030/],
  ['geography',         /\bgeography\b|\bgeo\b|4022|4063|physical\s+geo/],
  ['history',           /\bhistory\b|\bhist\b|4061|mutapa|torwa|lancaster|rhodesia|zimbabwean hist|african hist|european hist/],
  ['english',           /\benglish\b|language\s+arts|1122|literature|hamlet|animal farm|great expectations|romeo/],
  ['shona',             /\bshona\b/],
  ['ndebele',           /\bndebele\b/],
  ['commerce',          /\bcommerce\b|insurance\s+and\s+assur/],
  ['accounting',        /\baccounting\b|\baccounts\b|\bacc\b|book\s*keep|principles\s+of\s+account|4051/],
  ['agriculture',       /\bagriculture\b|\bagric\b|4048|farming|crop\s+sci|fareme/],
  ['computer science',  /\bcomputer\b|\bict\b|\bcomputing\b|4049|information\s+tech/],
  ['heritage studies',  /\bheritage\b|4006|heritage\s+studies|hss/],
  ['family and religious studies', /\bfamily.*religious\b|\bfrs\b|4047|divinity\b|islam|judaism/],
  ['business studies',  /\bbusiness\b|\bbusiness\s+studies\b|\bcommercial\b|mob\b|management\s+of\s+business/],
  ['economics',         /\beconomics\b|\becon\b/],
  ['sociology',         /\bsociology\b/],
  ['religious studies', /\breligion\b|\breligious\b|divinity/],
  ['art',               /\bart\b|\bdrawing\b|\bvpa\b|visual.*perf/],
  ['music',             /\bmusic\b/],
  ['food science',      /\bfood\s*(science|tech)\b|\bhome\s*economics\b/],
]

function classifySubject(name = '') {
  const s = name.toLowerCase()
    .replace(/['\u2018\u2019\u201c\u201d]/g, '')
    .replace(/[_\-]+/g, ' ')

  for (const [subject, pattern] of SUBJECT_PATTERNS) {
    if (pattern.test(s)) return subject
  }
  return null
}

function classifyDocType(name = '') {
  const s = name.toLowerCase().replace(/[_\-]+/g, ' ')
  if (s.match(/\b(marking|mark scheme|ms p[12]|ms paper|answer|solution|greenbook|green book|greenbk|red spot|model answer)\b/) ||
      s.match(/[_ ]ms[_ ]/) || s.match(/[_ ]ms\.pdf/) || s.match(/answers/)) return 'marking_scheme'
  if (s.match(/\b(syllabus|syllabi|curriculum|scheme of learning|revised primary)\b/)) return 'syllabus'
  if (s.match(/\b(specimen|sample paper)\b/)) return 'past_paper'
  if (s.match(/\b(notes?|guide|study pack|study guide|revision|textbook|tutorial|handbook|coursebook)\b/) ||
      s.match(/\ball.*notes\b/) || s.match(/form [1-4]/)) return 'notes'
  if (s.match(/\b(p[123]|paper [123]|qp|past paper|exam paper|nov|june|jun)\b/) ||
      s.match(/\b(2[0-9]{3})\b/) ||    // year in name = likely past paper
      s.match(/maths? [12] o/)) return 'past_paper'
  return 'notes'
}

function detectYear(name = '') {
  const m = name.match(/\b(19[89]\d|20[0-2]\d)\b/g)
  if (m) {
    const years = m.map(Number).filter(y => y >= 1990 && y <= 2030)
    if (years.length) return Math.max(...years)
  }
  return null
}

function detectPaper(name = '') {
  const s = name.toLowerCase()
  const m = s.match(/(?:paper|[_ ]p)[\s_]?([123])\b/) || s.match(/\bp([123])[_.\s]/)
  if (m) return parseInt(m[1], 10)
  return null
}

// ── Load subject map ─────────────────────────────────────────────────────────
async function getSubjectMap() {
  const { data } = await supabase.from('subjects').select('id, name, code, zimsec_level')
  const map = {}
  for (const s of data || []) {
    map[s.name.toLowerCase()] = s.id
    if (s.code) map[s.code.toLowerCase()] = s.id
  }
  return map
}

function findSubjectId(subject, subjectMap) {
  if (!subject) return null
  if (subjectMap[subject]) return subjectMap[subject]
  for (const [key, id] of Object.entries(subjectMap)) {
    if (key.includes(subject) || subject.includes(key)) return id
  }
  return null
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  ZimLearn — Document Re-Classifier')
  console.log('═══════════════════════════════════════════════════════\n')

  const subjectMap = await getSubjectMap()
  console.log(`📚 Loaded ${Object.keys(subjectMap).length} subject entries\n`)

  // Fetch all documents
  const { data: docs, error } = await supabase
    .from('uploaded_documents')
    .select('id, file_name, file_url, document_type, zimsec_level, subject_id, year, paper_number')

  if (error || !docs) { console.error('Failed to fetch docs:', error?.message); process.exit(1) }
  console.log(`📋 ${docs.length} documents to re-classify\n`)

  let updated = 0, unchanged = 0, failed = 0

  // Process in batches of 50
  const BATCH = 50
  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = docs.slice(i, i + BATCH)
    const updates = []

    for (const doc of batch) {
      const name = doc.file_name || ''
      const newLevel    = classifyLevel(name)
      const newSubject  = classifySubject(name)
      const newSubjectId = findSubjectId(newSubject, subjectMap)
      const newDocType  = classifyDocType(name)
      const newYear     = detectYear(name)
      const newPaper    = detectPaper(name)

      // Only update if something changed
      const changed =
        (newLevel    !== null && newLevel    !== doc.zimsec_level) ||
        (newSubjectId !== null && newSubjectId !== doc.subject_id) ||
        (newDocType  !== doc.document_type) ||
        (newYear     !== null && newYear     !== doc.year) ||
        (newPaper    !== null && newPaper    !== doc.paper_number)

      if (changed) {
        const patch = {}
        if (newLevel !== null)     patch.zimsec_level  = newLevel
        if (newSubjectId !== null) patch.subject_id    = newSubjectId
        if (newDocType)            patch.document_type = newDocType
        if (newYear !== null)      patch.year          = newYear
        if (newPaper !== null)     patch.paper_number  = newPaper
        updates.push({ id: doc.id, patch })
      } else {
        unchanged++
      }
    }

    // Apply updates
    for (const { id, patch } of updates) {
      const { error: upErr } = await supabase
        .from('uploaded_documents')
        .update(patch)
        .eq('id', id)
      if (upErr) { failed++; }
      else { updated++ }
    }

    const done = Math.min(i + BATCH, docs.length)
    const pct = Math.round((done / docs.length) * 100)
    process.stdout.write(`\r   ${done}/${docs.length} (${pct}%) — ✅ ${updated} updated | ⏭️ ${unchanged} unchanged | ❌ ${failed} failed`)
  }

  console.log('\n')

  // Final stats
  const { data: after } = await supabase
    .from('uploaded_documents')
    .select('zimsec_level, subject_id, document_type')

  const lvl = {}, subj = { linked: 0, none: 0 }, typ = {}
  for (const r of after || []) {
    lvl[r.zimsec_level || 'unclassified'] = (lvl[r.zimsec_level || 'unclassified'] || 0) + 1
    if (r.subject_id) subj.linked++; else subj.none++
    typ[r.document_type] = (typ[r.document_type] || 0) + 1
  }

  console.log('═══════════════════════════════════════════════════════')
  console.log(`  ✅ Updated:   ${updated}`)
  console.log(`  ⏭️  Unchanged: ${unchanged}`)
  console.log(`  ❌ Failed:    ${failed}`)
  console.log('\n  📊 After re-classification:')
  console.log('\n  By Level:')
  for (const [k,v] of Object.entries(lvl).sort()) console.log(`    ${k.padEnd(15)} ${v}`)
  console.log('\n  By Type:')
  for (const [k,v] of Object.entries(typ).sort()) console.log(`    ${k.padEnd(20)} ${v}`)
  console.log('\n  Subject link:')
  console.log(`    Linked to subject:  ${subj.linked}`)
  console.log(`    No subject:         ${subj.none}`)
  console.log('═══════════════════════════════════════════════════════\n')
}

main().catch(err => { console.error('\n💥', err.message); process.exit(1) })
