/**
 * seed-local.mjs — ZimLearn Local ZIMSEC File Uploader
 *
 * Scans the ZIMSEC RESOURCES folder, classifies each PDF by subject/level/type,
 * uploads to Supabase Storage, and inserts records into uploaded_documents.
 *
 * Run: node scripts/seed-local.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, statSync } from 'fs'
import { resolve, dirname, extname, basename } from 'path'
import { fileURLToPath } from 'url'

// ── Load .env.local ────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')
const envLines = readFileSync(envPath, 'utf8').split('\n')
for (const line of envLines) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY. Check .env.local')
  process.exit(1)
}

const RESOURCES_DIR = `C:/Users/Chegutu Mupfure/OneDrive/Desktop/ZIMSEC RESOURCES`
const BUCKET = 'platform-documents'
const BATCH_SIZE = 5      // parallel uploads
const MAX_FILE_MB = 50    // skip files larger than this

// ── Supabase client (service role — bypasses ALL RLS) ─────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

// ── Helpers ────────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

const SUBJECT_KEYWORDS = {
  mathematics:       ['math', 'maths', 'mathematics', 'pure math', 'pure maths', 'calculus', '4004', '4008', '4028', '6042', 'statistics'],
  physics:           ['physics', 'phys', '4040', 'zimse_physics', 'physic'],
  chemistry:         ['chemistry', 'chem', '4024', '4017', 'organic_chem', 'organic chem'],
  biology:           ['biology', 'biol', '4045', '4016'],
  'combined science':['combined science', 'combined_science', '4007', '4030'],
  geography:         ['geography', 'geo', '4022', '4063', '40222', 'geog'],
  history:           ['history', '4061', '4063', 'hist', 'mutapa', 'torwa', 'lancaster'],
  english:           ['english', 'engl', '4001', '1122'],
  shona:             ['shona', '4007', 'shona', '_shona'],
  ndebele:           ['ndebele', '4014', 'ndebele'],
  commerce:          ['commerce', '4030', 'commercial', 'insuran'],
  accounting:        ['account', 'acc ', 'accounting', '4051', 'book keep', 'bookkeep'],
  agriculture:       ['agricultur', 'agric', '4048', 'agric48'],
  'computer science':['computer', 'comp sci', '4049', 'ict', 'information tech'],
  'heritage studies':['heritage', '4006', '40062'],
  'family and religious studies': ['family', 'religious', 'frs', '4047'],
  divinity:          ['divinit', 'islam', 'judaism', 'pillars', 'prophet'],
  'business studies':['business', 'enterprise', '4021', 'a-levels business', 'a levels business'],
  'pure mathematics':['pure math', 'pure maths', '6042'],
  statistics:        ['statistics', 'stats', '6046', 'a\'level_statistics', 'al stat'],
}

function classifySubject(name) {
  const s = name.toLowerCase()
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some(k => s.includes(k))) return subject
  }
  return null
}

function classifyLevel(name) {
  const s = name.toLowerCase()
  if (s.includes('a\'level') || s.includes('a level') || s.includes('alevel') ||
      s.includes('a-level') || s.match(/\b(lower|upper)\s*6\b/) ||
      s.includes('6042') || s.includes('6046') || s.match(/\b(al|a_l)\b/) ||
      s.match(/a-levels\s+\w/) || s.includes('a levels ') ) return 'alevel'
  if (s.includes('o\'level') || s.includes('o level') || s.includes('olevel') ||
      s.includes('o-level') || s.match(/\b(form [1-4]|f[1-4])\b/) ||
      s.match(/\b40\d\d\b/)) return 'olevel'
  if (s.includes('primary') || s.match(/\b(grade [1-7]|grd[1-7]|ecd)\b/) ||
      s.includes('primary')) return 'primary'
  return null
}

function classifyDocType(name) {
  const s = name.toLowerCase()
  if (s.includes('marking') || s.includes('mark scheme') || s.match(/\bms\b/) ||
      s.includes('ms_p') || s.includes('_ms_') || s.match(/ms[\s_]p[12]/) ||
      s.includes('solution') || s.includes('answer') || s.includes('greenbook') ||
      s.includes('green_book') || s.includes('green book') || s.match(/greenbk/)) return 'marking_scheme'
  if (s.includes('syllabus') || s.includes('syllabi') || s.includes('curriculum') ||
      s.includes('scheme of learn') || s.includes('revised-primary')) return 'syllabus'
  if (s.includes('specimen') || s.includes('specimen paper')) return 'past_paper'
  if (s.includes('notes') || s.includes('guide') || s.includes('study pack') ||
      s.includes('study_pack') || s.includes('revision') || s.includes('tutorial') ||
      s.includes('all_notes') || s.includes('all notes') || s.includes('textbook') ||
      s.includes('practical') || s.match(/\bnotes\b/)) return 'notes'
  if (s.match(/\b(p1|p2|p3|paper[_\s]?[123]|qp|past[_\s]?paper|exam\s*paper)\b/) ||
      s.match(/\b(nov|june|jun|n\d{4}|j\d{4})\b/) ||
      s.match(/\b(20\d{2})\b/) ||
      s.match(/maths?_[12]_o_/) || s.includes('specimen')) return 'past_paper'
  return 'notes'
}

function detectYear(name) {
  const matches = name.match(/\b(19\d{2}|20\d{2})\b/g)
  if (matches) {
    const years = matches.map(Number).filter(y => y >= 1990 && y <= 2030)
    if (years.length) return Math.max(...years)
  }
  return null
}

function detectPaper(name) {
  const s = name.toLowerCase()
  const m = s.match(/(?:paper|_p|qp)[\s_]?([123])\b/) || s.match(/\b(p[123])\b/)
  if (m) return parseInt(m[1].replace('p', ''), 10)
  if (s.includes('paper1') || s.includes('paper 1') || s.match(/_p1[_\s.]/) || s.match(/p1[_.]pdf/)) return 1
  if (s.includes('paper2') || s.includes('paper 2') || s.match(/_p2[_\s.]/) || s.match(/p2[_.]pdf/)) return 2
  if (s.includes('paper3') || s.includes('paper 3') || s.match(/_p3[_\s.]/) || s.match(/p3[_.]pdf/)) return 3
  return null
}

function makeTitle(filename) {
  return filename
    .replace(/\.[^.]+$/, '')           // remove extension
    .replace(/[_\-]+/g, ' ')           // underscores/hyphens → space
    .replace(/\s+/g, ' ')
    .replace(/'/g, "'")
    .trim()
    .slice(0, 200)
}

function isJunk(filename) {
  const s = filename.toLowerCase()
  // Skip unnamed / junk files
  if (s.match(/^null[\s\-_(\d]*\.pdf$/)) return true
  if (s.match(/^downloaded_file/)) return true
  if (s.match(/^ck2/)) return true
  if (s.match(/^cumt2ment/)) return true
  if (s.match(/^eogyattachment/)) return true
  if (s.match(/^nglish/)) return true
  if (s.match(/^accccattachment/)) return true
  if (s.match(/^tttt/)) return true
  if (s.match(/^abcd-locked/)) return true
  if (s.match(/^mrmaker/)) return true
  if (s.match(/^a34e8bce/)) return true  // UUID file
  if (s.match(/^downloadfile/)) return true
  if (s === 'attachment.pdf') return true
  if (s.match(/^(ghjk|ck2|new doc|null)/)) return true
  if (s.includes('employee handbook')) return true
  if (s.includes('five pillars of islam') && !s.includes('notes')) return true  // keep if notes
  return false
}

// ── Get subject map from DB ────────────────────────────────────────────────────
async function getSubjectMap() {
  const { data, error } = await supabase.from('subjects').select('id, name, code, zimsec_level')
  if (error || !data) { console.warn('⚠️  Could not fetch subjects:', error?.message); return {} }
  const map = {}
  for (const s of data) {
    const key = s.name.toLowerCase()
    map[key] = s.id
    // Also map by code prefix
    if (s.code) map[s.code.toLowerCase()] = s.id
  }
  return map
}

function findSubjectId(classifiedSubject, subjectMap) {
  if (!classifiedSubject) return null
  // Direct match
  if (subjectMap[classifiedSubject]) return subjectMap[classifiedSubject]
  // Partial match
  for (const [key, id] of Object.entries(subjectMap)) {
    if (key.includes(classifiedSubject) || classifiedSubject.includes(key)) return id
  }
  return null
}

// ── Get seed admin user ID (service role — no sign-in needed) ─────────────────
async function getSeedUserId() {
  // With service role key we can query auth.users directly
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', 'bd2a9a57-5c66-4d65-be51-40b2118f7d7c')
    .maybeSingle()

  if (data?.id) {
    console.log(`✅ Using seed admin user: ${data.id}`)
    return data.id
  }

  // Fallback: return the known seed user ID
  const SEED_USER_ID = 'bd2a9a57-5c66-4d65-be51-40b2118f7d7c'
  console.log(`✅ Using seed admin ID: ${SEED_USER_ID}`)
  return SEED_USER_ID
}

// ── Ensure bucket exists ───────────────────────────────────────────────────────
async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET)
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) throw new Error(`Cannot create bucket: ${error.message}`)
    console.log(`✅ Created storage bucket: ${BUCKET}`)
  } else {
    console.log(`✅ Storage bucket exists: ${BUCKET}`)
  }
}

// ── Check if already seeded ───────────────────────────────────────────────────
async function getAlreadySeeded() {
  const { data } = await supabase
    .from('uploaded_documents')
    .select('file_name')
    .not('file_name', 'is', null)
  const set = new Set()
  for (const r of (data || [])) if (r.file_name) set.add(r.file_name)
  return set
}

// ── Upload single file ────────────────────────────────────────────────────────
async function uploadFile(filePath, userId, subjectMap, stats) {
  const filename = basename(filePath)
  const ext = extname(filename).toLowerCase()

  // Skip non-PDFs
  if (ext !== '.pdf') { stats.skipped++; return }

  // Skip junk
  if (isJunk(filename)) {
    console.log(`   ⏭️  Junk: ${filename}`)
    stats.skipped++
    return
  }

  // Check file size
  const fileStat = statSync(filePath)
  const sizeMB = fileStat.size / (1024 * 1024)
  if (sizeMB > MAX_FILE_MB) {
    console.log(`   ⏭️  Too large (${sizeMB.toFixed(1)}MB): ${filename}`)
    stats.skipped++
    return
  }

  const subject = classifySubject(filename)
  const level = classifyLevel(filename)
  const docType = classifyDocType(filename)
  const year = detectYear(filename)
  const paper = detectPaper(filename)
  const title = makeTitle(filename)
  const subjectId = findSubjectId(subject, subjectMap)

  // Sanitize storage path
  const safeFilename = filename
    .replace(/[^a-zA-Z0-9._\-]/g, '_')
    .replace(/__+/g, '_')
  const storagePath = `zimsec-local/${safeFilename}`

  console.log(`   📤 ${filename.slice(0, 60)}`)
  console.log(`      ${docType} | ${level ?? '?'} | ${subject ?? 'unknown'} | ${year ?? '?'} | ${fileStat.size > 0 ? Math.round(fileStat.size / 1024) + 'KB' : '0KB'}`)

  try {
    // Upload to Supabase Storage
    const fileBuffer = readFileSync(filePath)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error(`      ❌ Upload error: ${uploadError.message}`)
      stats.failed++
      return
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
    const publicUrl = urlData?.publicUrl ?? storagePath

    // Insert DB record
    const { error: dbErr } = await supabase
      .from('uploaded_documents')
      .insert({
        title,
        description: `ZIMSEC ${docType.replace('_', ' ')} — ${subject ?? 'General'}${year ? ` (${year})` : ''}`,
        document_type: docType,
        subject_id: subjectId,
        zimsec_level: level,
        year,
        paper_number: paper,
        file_path: storagePath,
        file_name: filename,
        file_size: fileStat.size,
        file_url: publicUrl,
        extracted_text: null,
        ai_summary: `This is a ZIMSEC ${docType.replace('_', ' ')} for ${subject ?? 'general'} studies${level ? ` (${level === 'alevel' ? 'A-Level' : level === 'olevel' ? 'O-Level' : 'Primary'})` : ''}${year ? `, ${year}` : ''}. Uploaded from the ZimLearn local resource library.`,
        topics: subject ? [subject] : [],
        moderation_status: 'published',
        moderation_notes: 'Uploaded from local ZIMSEC resource library by admin.',
        visibility: 'public',
        uploaded_by: userId,
        uploader_role: 'admin',
        processed_at: new Date().toISOString(),
      })

    if (dbErr) {
      console.error(`      ❌ DB error: ${dbErr.message}`)
      stats.failed++
      return
    }

    console.log(`      ✅ Saved`)
    stats.saved++

  } catch (err) {
    console.error(`      ❌ Error: ${err.message}`)
    stats.failed++
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  ZimLearn — Local ZIMSEC Resource Uploader')
  console.log(`  Source: ${RESOURCES_DIR}`)
  console.log('═══════════════════════════════════════════════════════\n')

  // 1. Get seed user ID (service role key bypasses auth requirements)
  const userId = await getSeedUserId()

  // 2. Ensure storage bucket
  await ensureBucket()

  // 3. Load subjects
  console.log('\n📚 Loading subjects from database...')
  const subjectMap = await getSubjectMap()
  console.log(`   Found ${Object.keys(subjectMap).length} subject entries`)

  // 4. Get already-seeded files
  console.log('\n🔍 Checking already-seeded files...')
  const alreadySeeded = await getAlreadySeeded()
  console.log(`   ${alreadySeeded.size} files already in database`)

  // 5. Scan directory
  console.log(`\n📂 Scanning ${RESOURCES_DIR}...`)
  let allFiles
  try {
    allFiles = readdirSync(RESOURCES_DIR)
      .filter(f => extname(f).toLowerCase() === '.pdf')
      .map(f => resolve(RESOURCES_DIR, f))
  } catch (err) {
    console.error('Cannot read directory:', err.message)
    process.exit(1)
  }

  // Filter already seeded
  const toUpload = allFiles.filter(f => !alreadySeeded.has(basename(f)))
  console.log(`   ${allFiles.length} PDFs found, ${toUpload.length} new to upload`)

  if (toUpload.length === 0) {
    console.log('\n✨ All files already seeded!')
    return
  }

  // 6. Upload in batches
  const stats = { saved: 0, failed: 0, skipped: 0 }
  let i = 0

  for (let b = 0; b < toUpload.length; b += BATCH_SIZE) {
    const batch = toUpload.slice(b, b + BATCH_SIZE)
    i = b

    console.log(`\n─── Batch ${Math.floor(b / BATCH_SIZE) + 1} [${b + 1}–${Math.min(b + BATCH_SIZE, toUpload.length)} of ${toUpload.length}] ───`)

    // Upload batch in parallel
    await Promise.all(
      batch.map(filePath => uploadFile(filePath, userId, subjectMap, stats))
    )

    // Progress
    const done = b + batch.length
    const pct = Math.round((done / toUpload.length) * 100)
    console.log(`\n   Progress: ${done}/${toUpload.length} (${pct}%) | ✅ ${stats.saved} saved | ⏭️ ${stats.skipped} skipped | ❌ ${stats.failed} failed`)

    // Small pause between batches to avoid rate limits
    if (b + BATCH_SIZE < toUpload.length) await sleep(200)
  }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log(`  ✅ Saved:   ${stats.saved} documents`)
  console.log(`  ⏭️  Skipped: ${stats.skipped} (junk/oversized/non-PDF)`)
  console.log(`  ❌ Failed:  ${stats.failed}`)
  console.log('═══════════════════════════════════════════════════════')
  console.log('\n✨ Documents are now live at /admin/documents\n')
}

main().catch(err => { console.error('\n💥', err.message); process.exit(1) })
