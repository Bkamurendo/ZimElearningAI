/**
 * deep-classify.mjs — Deep classification of all unclassified documents
 * Analyses filenames for topics, content clues, and context to assign
 * subject, level, and document type to every possible document.
 * Run: node scripts/deep-classify.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envLines = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8').split('\n')
for (const line of envLines) {
  const [k, ...r] = line.split('=')
  if (k && r.length) process.env[k.trim()] = r.join('=').trim()
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

// ── Clean filename for matching ──────────────────────────────────────────────
function clean(name) {
  return (name || '').toLowerCase()
    .replace(/['\u2018\u2019\u201c\u201d]/g, '')
    .replace(/[_\-\.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Level classifier (deep) ──────────────────────────────────────────────────
function detectLevel(name) {
  const s = clean(name)

  // Explicit A-Level markers
  if (s.match(/\b(a lvl|alvl|a lev|alevel|a level|advanced level)\b/) ||
      s.match(/\b(lower six|upper six|l6|u6|form 6|f6|sixth form)\b/) ||
      s.match(/\b(6042|6046|6049|6074)\b/) ||              // A-Level ZIMSEC codes
      s.match(/\b(cambridge int(ernational)? as and a level)\b/) ||
      s.match(/\bpure math(s)? (study pack|forms? 3|p[12]|paper)\b/) ||
      s.match(/\bstatistics (and mechanics|p[12]|paper|study)\b/) ||
      s.match(/\ba levels? (biology|physics|chemistry|maths?|history|geo|accounts?|shona|ndebele|business|divinity|frs)\b/) ||
      s.match(/^(june|nov|november) 20\d\d (a|alvl|alevel)\b/) ||
      s.match(/\b(j20\d\d|nv 20\d\d|june 20\d\d|nov 20\d\d).*\b(alvl|a lvl|a lev)\b/) ||
      s.match(/\bshare.*(pure math|statistics|differentiation|integration|probability|trigonometry|matrices|permutation)\b/) ||
      s.match(/\b(differentiation|integration|trigonometry|matrices|permutations? and combinations?)\b.*\bmath\b/) ||
      s.match(/\bmr share\b/) ||
      name.match(/SHARE_FULL/) ||
      name.match(/[_ ][Uu]6[_ ]/) ||
      name.match(/[_ ][Ll]6[_ ]/) ||
      name.match(/Alvl|A_lvl|A_Lev/i) ) return 'alevel'

  // Explicit O-Level markers
  if (s.match(/\b(o lvl|olevel|o level|ordinary level)\b/) ||
      s.match(/\b(form(s)? [1-4]|forms 1 4|forms 1-4)\b/) ||
      s.match(/\b(40[0-9][0-9])\b/) ||                     // O-Level ZIMSEC codes 4000-4099
      s.match(/\bcambridge igcse\b/) ||
      s.match(/\bzimsec 40\d\d\b/) ||
      s.match(/summer qp\b/) ||                             // Cambridge summer = O-Level
      s.match(/\b(o chem|o maths?|o level (maths?|chemistry|bio|geo|hist|eng|phys|acc|agric|shona|ndebele))\b/) ||
      s.match(/\b(agric48765|agric 4\d{4})\b/) ||
      name.match(/^4[0-9]{3}[qQ]/) ||                      // starts with 4xxx specimen codes
      name.match(/^414[0-9]{3}/) ||                         // Cambridge catalog numbers
      name.match(/^567[0-9]{3}/) ||
      name.match(/^569[0-9]{3}/) ||
      name.match(/^5129/) ) return 'olevel'

  // Primary markers
  if (s.match(/\b(grade [1-7]|gr [1-7]|grd [1-7]|std [1-7]|primary|ecd|grade1|grade2|grade3|grade4|grade5|grade6|grade7)\b/) ||
      s.match(/\b(sunrise book|ventures (agric|maths?|science|fareme|ndebele|ict|pe)|plus one)\b/) ||
      s.match(/\b(grade 1 3|grade 4|grade 5|grade 6|grade 7)\b/) ||
      s.match(/\bzimsec grade [1-7]\b/) ||
      s.match(/\bgrade [1-7] (english|maths?|science|ict|shona|ndebele|agric)\b/) ||
      name.match(/Gr\s*[1-7]\b/) ||
      name.match(/Grade\s*[1-7]\b/i) ) return 'primary'

  // Secondary heuristics for level
  // Files from a clear alevel context (by naming convention of known uploaders/series)
  if (s.match(/\b(jun|june|nov|november) 20[12][0-9] p[123]\b/) &&
      s.match(/\b(pure math|statistics|alvl)\b/)) return 'alevel'

  if (s.match(/\bfrs (june|nov|p[12]|paper)\b/) ||
      s.match(/\bfrs (2[0-9]{3})\b/) ||
      s.match(/^frs [pn]/)) return 'olevel'

  // Cambridge numbered papers (567xxx, 569xxx, 414xxx = Cambridge IGCSE maths/CS)
  if (name.match(/^(567|569|414|5129)[0-9]/)) return 'olevel'

  return null
}

// ── Subject classifier (deep) ────────────────────────────────────────────────
function detectSubject(name) {
  const s = clean(name)

  // ── Mathematics ──────────────────────────────────────────────────────────
  if (s.match(/\b(math|maths|mathematics|calculus|algebra|trigonometry|arithmetic)\b/) ||
      s.match(/\b(pure math|statistics and mechanics|number bases?|matrices|probability|differentiation|integration|permutations?|combinations?|sine|cosine|sine and cosine)\b/) ||
      s.match(/\bmechanical math\b/) ||
      s.match(/\b(4004|4008|4028|6042)\b/) ||
      name.match(/SHARE_FULL.*(DIFFERENTIATION|INTEGRATION|TRIGONOMETRY|PROBABILITY|PERMUTATION|MATRICES)/) ||
      s.match(/\bnew general (in )?math/) ||
      s.match(/\bgeneral mathematics\b/) ) return 'mathematics'

  // ── Statistics (A-Level) ──────────────────────────────────────────────────
  if (s.match(/\bstatistics\b/) || s.match(/\bstats\b/) || s.match(/\b6046\b/)) return 'statistics'

  // ── Physics ──────────────────────────────────────────────────────────────
  if (s.match(/\bphysics\b/) || s.match(/\bphys\b/) ||
      s.match(/\b(magnetism|electricity|electromagnet|machines?|energy|mechanics|waves|optics|thermodynamics|nuclear|force|motion|velocity|acceleration)\b/) &&
        !s.match(/\b(chemistry|biology|geography|account)\b/) ||
      s.match(/\bfuel engine\b/) ||
      s.match(/\belectricity and magnetism\b/) ||
      s.match(/\bmaterials and their use in structures\b/) ||
      s.match(/\b(topic [0-9]+ (machines?|magnetism|energy|electricity|force|waves))\b/) ||
      s.match(/\b4040\b/) ) return 'physics'

  // ── Chemistry ────────────────────────────────────────────────────────────
  if (s.match(/\bchemistry\b/) || s.match(/\bchem\b/) ||
      s.match(/\b(organic chem|inorganic chem|physical chem|metals?|osmosis.*chem|acid|base|reaction)\b/) &&
        !s.match(/\b(biology|physics)\b/) ||
      s.match(/\b(4024|4017)\b/) ) return 'chemistry'

  // ── Biology ──────────────────────────────────────────────────────────────
  if (s.match(/\bbiology\b/) || s.match(/\bbiol\b/) ||
      s.match(/\b(digestive|organism|osmosis|anatomy|physiology|cell|genetics|evolution|ecology|photosynthesis)\b/) &&
        !s.match(/\bchemistry\b/) ||
      s.match(/\b(4045|4016)\b/) ||
      s.match(/ross wilson anatomy/) ) return 'biology'

  // ── Combined Science ─────────────────────────────────────────────────────
  if (s.match(/\bcombined.?sci\b/) || s.match(/\bcomb.?scie?\b/) ||
      s.match(/\bscience (notes?|forms? [1-4]|paper)\b/) ||
      s.match(/\b(3sci|combined 3sci)\b/) ||
      s.match(/\bscience and technology grd\b/) ||
      s.match(/\b4030\b/) ) return 'combined science'

  // ── Geography ────────────────────────────────────────────────────────────
  if (s.match(/\b(geography|geog)\b/) ||
      s.match(/\b(physical geography|population studies|settlement|mining|geo paper|geo notes|geo handout)\b/) ||
      s.match(/\b(4022|4063|60371)\b/) ) return 'geography'

  // ── History ──────────────────────────────────────────────────────────────
  if (s.match(/\b(history|hist)\b/) ||
      s.match(/\b(mutapa|torwa|portuguese|lancaster|rhodesia|zimbabwean hist|african hist|european hist|world war|napoleon|french revolution|europe.*africa|colonialism|pre.?colonial)\b/) ||
      s.match(/\b(4061|4020)\b/) ||
      s.match(/\bwhy was slavery\b/) ||
      s.match(/\bthings fall apart\b/) ||
      s.match(/\bessay.*napoleon\b/) ) return 'history'

  // ── English ──────────────────────────────────────────────────────────────
  if (s.match(/\b(english|engl)\b/) ||
      s.match(/\b(grammar|literary|literature|poetic devices?|elements of poetry|prose|composition|prepositions?|essay writing|comprehension|romeo and juliet|hamlet|animal farm|great expectations|shakespeare|literary techniques|literary devices)\b/) ||
      s.match(/\b(sunrise book|going swimming|student companion)\b/) ||
      s.match(/\b(raymond murphy|english grammar in use|oxford dictionary of literary terms)\b/) ||
      s.match(/\bconcise oxford dictionary\b/) ||
      s.match(/\b(1122|4001|5129)\b/) ) return 'english'

  // ── Shona ─────────────────────────────────────────────────────────────────
  if (s.match(/\bshona\b/) ||
      s.match(/\b(misambo|mitupo|musambo|madhiri|dzino|kushata|fares totems?|kuvana|nyatwa|misambo yekutaura|ishe imi)\b/) ||
      s.match(/\bshumba\b/) && !s.match(/\b(history|heritage)\b/) ) return 'shona'

  // ── Ndebele ───────────────────────────────────────────────────────────────
  if (s.match(/\bndebele\b/) ||
      s.match(/\bisindebele\b/) ||
      s.match(/\bkalanga\b/) ) return 'ndebele'

  // ── Accounting ───────────────────────────────────────────────────────────
  if (s.match(/\b(accounting|accounts|accountancy|acc )\b/) ||
      s.match(/\b(book.?keep|book keeping|frank wood|final accounts|incomplete records|accounting errors|accounting concepts)\b/) ||
      s.match(/\b(4051)\b/) ) return 'accounting'

  // ── Commerce ─────────────────────────────────────────────────────────────
  if (s.match(/\bcommerce\b/) || s.match(/\binsurance\b/)) return 'commerce'

  // ── Business Studies ─────────────────────────────────────────────────────
  if (s.match(/\b(business studies?|business enterprise|bes |bs notes|mob\b|management of business)\b/) ||
      s.match(/\b(4021|bes 20)\b/) ||
      s.match(/\bbs.?q.?paper\b/) ) return 'business studies'

  // ── Economics ────────────────────────────────────────────────────────────
  if (s.match(/\beconomics?\b/) || s.match(/\becoz\b/) || s.match(/\becon\b/)) return 'economics'

  // ── Agriculture ──────────────────────────────────────────────────────────
  if (s.match(/\b(agricultur|agric|farming|crop sci|fareme)\b/) ||
      s.match(/\b(4048|agric48)\b/) ) return 'agriculture'

  // ── Computer Science ─────────────────────────────────────────────────────
  if (s.match(/\b(computer|ict|computing|information tech|programm)\b/) ||
      s.match(/\b(number base|devices|cops notes?|cops 19|encyclopedia.*computer)\b/) ||
      s.match(/\b(4049|9190)\b/) ) return 'computer science'

  // ── Heritage Studies ─────────────────────────────────────────────────────
  if (s.match(/\b(heritage|heritage studies|hss)\b/) ||
      s.match(/\b(4006|40062)\b/) ) return 'heritage studies'

  // ── Family & Religious Studies / Divinity ────────────────────────────────
  if (s.match(/\b(family and religious|frs\b|divinity|6074|4047)\b/) ||
      s.match(/\b(islam|judaism|christianity|religion|religious studies|biblical|bible|covenant|testament|ot and nt|old testament|new testament|prophecy|prophet|miracles? of jesus|jesus |birth narrat|god.?concept|roles of muhammad|sharia|fiqh|atir\b|atr\b|african traditional religion)\b/) ||
      s.match(/\b(totem.*taboo|sacred places|women in (islam|religion|atr)|position of women in islam|lower six frs|five pillars)\b/) ||
      s.match(/\b(amos|chronicles? genesis|genesis)\b/) && !s.match(/\bhistory\b/) ||
      s.match(/\b(fate decided|good girl|gangster|love story)\b/) && !s.match(/\b(bio|chem|math)\b/) ) return 'family and religious studies'

  // ── Sociology ────────────────────────────────────────────────────────────
  if (s.match(/\bsociology\b/) || s.match(/\bharalambos\b/)) return 'sociology'

  // ── General/Civics/Other recognizable subjects ───────────────────────────
  if (s.match(/\bcivics\b/)) return 'civics'
  if (s.match(/\bkiswahili\b/)) return 'kiswahili'
  if (s.match(/\bgeneral studies?\b/)) return 'general studies'
  if (s.match(/\bart\b/) || s.match(/\bvpa\b/) || s.match(/\bvisual.*perform\b/)) return 'art'
  if (s.match(/\b(music)\b/)) return 'music'
  if (s.match(/\b(food science|home economics)\b/)) return 'food science'

  return null
}

// ── Document type (deep) ─────────────────────────────────────────────────────
function detectType(name) {
  const s = clean(name)
  if (s.match(/\b(mark(ing)? (scheme|guide)|ms |ms$| ms |answer(s)?|solution(s)?|green.?book|red spot|blue book|model answer|suggested marking)\b/) ||
      s.match(/\b(ms p[123]|ms paper|nv.*ms|jun.*ms|question.*answer|q.*answer)\b/) ||
      name.match(/[_ ]MS[_ .]/) || name.match(/_MS\.pdf/) ||
      s.match(/\b(acc.*greenbk|acc.*green book|maths.*green book|geo.*green book|chem.*green book|agric.*green book|biology.*green book)\b/)) return 'marking_scheme'

  if (s.match(/\b(syllabus|syllabi|curriculum|scheme of learning|scheme of work)\b/)) return 'syllabus'

  if (s.match(/\b(specimen|sample paper)\b/)) return 'past_paper'

  if (s.match(/\b(timetable|time.?table|exam fees|price.?list|strategic.?plan|press.?statement|results.?release|results.?announced|circular|act\.pdf|amendment|guidelines.?for.?results|invigilator|examiner.?report|verification.?form|brochure|high mount college|trevor cv|mambo)\b/)) return 'other'

  if (s.match(/\b(notes?|study (pack|guide)|revision|textbook|handbook|coursebook|tutorial|all notes|forms? [1-4]|study club|morning)\b/) ||
      s.match(/\b(sunrise book|going swimming|student companion|encyclopedia)\b/)) return 'notes'

  if (s.match(/\b(past.?paper|exam.?paper|paper [123]|p[123] nov|p[123] june|p[123] n20|qp|question paper|nov 20\d\d|june 20\d\d)\b/) ||
      s.match(/\b(n20\d\d|j20\d\d)\b/) ||
      s.match(/\b(20\d\d.*p[123]|p[123].*20\d\d)\b/)) return 'past_paper'

  return 'notes'
}

// ── Load subject map ─────────────────────────────────────────────────────────
async function getSubjectMap() {
  const { data } = await sb.from('subjects').select('id, name, code')
  const map = {}
  for (const s of data || []) {
    map[s.name.toLowerCase()] = s.id
    if (s.code) map[s.code.toLowerCase()] = s.id
  }
  return map
}

function resolveSubjectId(subject, map) {
  if (!subject) return null
  if (map[subject]) return map[subject]
  for (const [k, id] of Object.entries(map)) {
    if (k.includes(subject) || subject.includes(k)) return id
  }
  return null
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  ZimLearn — Deep Document Classifier')
  console.log('═══════════════════════════════════════════════════════\n')

  const subjectMap = await getSubjectMap()
  console.log(`📚 ${Object.keys(subjectMap).length} subjects loaded\n`)

  // Fetch ALL documents (not just unclassified — re-check everything)
  const { data: docs } = await sb
    .from('uploaded_documents')
    .select('id, file_name, zimsec_level, subject_id, document_type, year')

  console.log(`📋 ${docs.length} total documents\n`)

  let updated = 0, unchanged = 0

  const BATCH = 50
  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = docs.slice(i, i + BATCH)
    const patchOps = []

    for (const doc of batch) {
      const name = doc.file_name || ''
      const newLevel   = detectLevel(name)
      const newSubject = detectSubject(name)
      const newSubjId  = resolveSubjectId(newSubject, subjectMap)
      const newType    = detectType(name)
      const newYear    = (() => {
        const m = name.match(/\b(19[89]\d|20[0-2]\d)\b/g)
        if (!m) return null
        const yrs = m.map(Number).filter(y => y >= 1990 && y <= 2030)
        return yrs.length ? Math.max(...yrs) : null
      })()

      const patch = {}
      if (newLevel   && newLevel   !== doc.zimsec_level)  patch.zimsec_level  = newLevel
      if (newSubjId  && newSubjId  !== doc.subject_id)    patch.subject_id    = newSubjId
      if (newType    && newType    !== doc.document_type) patch.document_type = newType
      if (newYear    && newYear    !== doc.year)          patch.year          = newYear

      if (Object.keys(patch).length > 0) {
        patchOps.push({ id: doc.id, patch })
      } else {
        unchanged++
      }
    }

    // Apply all patches in this batch
    await Promise.all(patchOps.map(async ({ id, patch }) => {
      const { error } = await sb.from('uploaded_documents').update(patch).eq('id', id)
      if (!error) updated++
      else unchanged++
    }))

    const done = Math.min(i + BATCH, docs.length)
    process.stdout.write(`\r   ${done}/${docs.length} (${Math.round(done/docs.length*100)}%) — ✅ ${updated} updated | ⏭️ ${unchanged} unchanged`)
  }

  console.log('\n\n')

  // Final stats
  const { data: after } = await sb
    .from('uploaded_documents')
    .select('zimsec_level, subject_id, document_type')

  const byLevel = {}, bySubj = { linked: 0, none: 0 }, byType = {}
  for (const r of after || []) {
    byLevel[r.zimsec_level || 'unclassified'] = (byLevel[r.zimsec_level || 'unclassified'] || 0) + 1
    if (r.subject_id) bySubj.linked++; else bySubj.none++
    byType[r.document_type] = (byType[r.document_type] || 0) + 1
  }

  console.log('═══════════════════════════════════════════════════════')
  console.log(`  ✅ Updated:   ${updated}`)
  console.log(`  ⏭️  Unchanged: ${unchanged}`)
  console.log('\n  📊 Final stats:')
  console.log('\n  By Level:')
  for (const [k,v] of Object.entries(byLevel).sort((a,b)=>b[1]-a[1])) {
    const bar = '█'.repeat(Math.round(v/10))
    console.log(`    ${k.padEnd(16)} ${String(v).padStart(4)}  ${bar}`)
  }
  console.log('\n  By Type:')
  for (const [k,v] of Object.entries(byType).sort((a,b)=>b[1]-a[1])) {
    console.log(`    ${k.padEnd(20)} ${v}`)
  }
  console.log('\n  Subject link:')
  console.log(`    Linked to subject:  ${bySubj.linked}`)
  console.log(`    No subject:         ${bySubj.none}`)
  console.log('═══════════════════════════════════════════════════════\n')
}

main().catch(err => { console.error('\n💥', err.message); process.exit(1) })
