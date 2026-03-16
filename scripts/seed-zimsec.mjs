/**
 * seed-zimsec.mjs — ZimLearn ZIMSEC Content Seeder (no-Claude / no-storage mode)
 *
 * Fetches real ZIMSEC PDF URLs from the ZIMSEC WordPress REST API and
 * seeds them into uploaded_documents with direct source-URL links.
 * No Supabase Storage bucket or Anthropic credits required.
 *
 * Run: node scripts/seed-zimsec.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
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
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing env vars. Check .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Helpers ────────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function classifyDocType(title = '', url = '') {
  const s = (title + ' ' + url).toLowerCase()
  if (s.includes('syllabus') || s.includes('syllabi')) return 'syllabus'
  if (s.includes('marking') || s.includes('mark scheme')) return 'marking_scheme'
  if (s.includes('specimen') || s.includes('sample paper')) return 'past_paper'
  if (s.includes('timetable') || s.includes('strategic') || s.includes('annual report') ||
      s.includes('press statement') || s.includes('results release') ||
      s.includes('examiner') || s.includes('examiners') || s.includes('invigilator') ||
      s.includes('amendment') || s.includes('act.pdf') || s.includes('circular') ||
      s.includes('contract') || s.includes('guidelines') || s.includes('manual') ||
      s.includes('price list') || s.includes('review') || s.includes('results-announced') ||
      s.includes('certifying')) return 'other'
  if (s.includes('notes') || s.includes('revision')) return 'notes'
  if (s.includes('textbook')) return 'textbook'
  if (s.includes('paper') || s.includes('o-level') ||
      s.includes('a-level') || s.includes('ordinary') || s.includes('advanced')) return 'past_paper'
  return 'other'
}

function classifyLevel(title = '', url = '') {
  const s = (title + ' ' + url).toLowerCase()
  if (s.includes('a-level') || s.includes('a level') || s.includes('advanced') || s.includes('alevel')) return 'alevel'
  if (s.includes('o-level') || s.includes('o level') || s.includes('ordinary') || s.includes('olevel')) return 'olevel'
  if (s.includes('primary') || s.includes('grade 7') || s.includes('grd7') || s.includes('grade7')) return 'primary'
  return null
}

function detectYear(title = '', url = '') {
  const matches = (title + ' ' + url).match(/\b(20\d{2})\b/g)
  if (matches && matches.length > 0) return parseInt(matches[0], 10)
  return null
}

function makeTitle(filename, url) {
  // Convert filename to readable title
  return filename
    .replace(/\.pdf$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
}

function makeSummary(title, docType, zimsecLevel, year, url) {
  const level = zimsecLevel ? { alevel: 'A-Level', olevel: 'O-Level', primary: 'Primary' }[zimsecLevel] : ''
  const typeLabel = {
    past_paper: 'past examination paper', marking_scheme: 'marking scheme',
    syllabus: 'ZIMSEC syllabus document', notes: 'study notes',
    textbook: 'textbook', other: 'official ZIMSEC document',
  }[docType] || 'ZIMSEC document'

  return `This is an official ZIMSEC ${typeLabel}${level ? ` for ${level}` : ''}${year ? ` (${year})` : ''}. ` +
    `Title: ${title}. ` +
    `Source: ZIMSEC official website (${url}). ` +
    `This document has been made available through ZimLearn for educational purposes and links directly to the ZIMSEC website. ` +
    `Students and teachers can access this material to support their ZIMSEC examination preparation.`
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function ensureAuthUser() {
  console.log('\n👤 Signing in as seed user...')
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'seed-admin@zimlearn.internal',
    password: 'ZimLearn_Seed_2024!',
  })
  if (error || !data?.user) throw new Error(`Sign-in failed: ${error?.message}`)
  console.log(`   ✅ Signed in: ${data.user.id}`)
  return data.user.id
}

// ── Fetch PDF URLs from ZIMSEC WordPress REST API ─────────────────────────────
async function fetchPdfUrls() {
  const BASE = 'https://www5.zimsec.co.zw/wp-json/wp/v2/media?mime_type=application/pdf&per_page=100'
  const allUrls = []
  let page = 1

  while (true) {
    console.log(`  Fetching ZIMSEC media page ${page}...`)
    try {
      const res = await fetch(`${BASE}&page=${page}`, {
        headers: { 'User-Agent': 'ZimLearnBot/1.0' },
      })
      if (!res.ok) { console.log(`  → HTTP ${res.status}`); break }
      const items = await res.json()
      if (!Array.isArray(items) || items.length === 0) { console.log('  → No more items'); break }
      for (const item of items) {
        if (item.source_url && !allUrls.includes(item.source_url)) {
          allUrls.push({ url: item.source_url, title: item.title?.rendered || '' })
        }
      }
      console.log(`  → ${items.length} items (total: ${allUrls.length})`)
      if (items.length < 100) break
      page++
      await sleep(500)
    } catch (err) {
      console.error(`  → Error: ${err.message}`)
      break
    }
  }
  return allUrls
}

// ── Check file size via HEAD request ──────────────────────────────────────────
async function getFileSize(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'ZimLearnBot/1.0' },
      redirect: 'follow',
    })
    const len = res.headers.get('content-length')
    return len ? parseInt(len, 10) : null
  } catch { return null }
}

// ── Seed a single document ────────────────────────────────────────────────────
async function seedDocument(pdfUrl, hintTitle, userId) {
  const filename = pdfUrl.split('/').pop()?.split('?')[0] ?? 'document.pdf'
  const label = hintTitle || filename
  const docType = classifyDocType(label, pdfUrl)
  const zimsecLevel = classifyLevel(label, pdfUrl)
  const year = detectYear(label, pdfUrl)
  const title = makeTitle(filename, pdfUrl)
  const summary = makeSummary(title, docType, zimsecLevel, year, pdfUrl)

  // Skip clearly non-educational docs
  if (['examiner-contract', 'certifying-statement', 'amendment-form', 'invigilators'].some(s => pdfUrl.toLowerCase().includes(s))) {
    console.log(`   ⏭️  Skipping admin doc: ${filename}`)
    return 'skipped'
  }

  const fileSize = await getFileSize(pdfUrl)
  console.log(`   📄 ${filename}`)
  console.log(`      Type: ${docType} | Level: ${zimsecLevel ?? '-'} | Year: ${year ?? '-'} | Size: ${fileSize ? Math.round(fileSize / 1024) + 'KB' : '?'}`)

  // Insert to DB — using source URL as file_path (no local storage)
  const { data: doc, error: dbErr } = await supabase
    .from('uploaded_documents')
    .insert({
      title,
      description: `Official ZIMSEC document. Source: ${pdfUrl}`,
      document_type: docType,
      subject_id: null,
      zimsec_level: zimsecLevel,
      year,
      paper_number: null,
      file_path: pdfUrl,          // Direct URL to ZIMSEC site
      file_name: filename,
      file_size: fileSize,
      file_url: pdfUrl,           // Accessible download link
      extracted_text: null,
      ai_summary: summary,
      topics: [],
      moderation_status: 'published',
      moderation_notes: 'Auto-seeded from ZIMSEC official website (www5.zimsec.co.zw). Source verified.',
      visibility: 'public',
      uploaded_by: userId,
      uploader_role: 'admin',
      processed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (dbErr || !doc) {
    console.error(`      ❌ DB error: ${dbErr?.message}`)
    return null
  }

  console.log(`      ✅ Saved → id: ${doc.id}`)
  return doc.id
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  ZimLearn — ZIMSEC Content Seeder (Direct Links)')
  console.log('═══════════════════════════════════════════════════')

  const userId = await ensureAuthUser()

  console.log('\n🌐 Fetching PDF list from ZIMSEC WordPress API...')
  const items = await fetchPdfUrls()
  console.log(`\n📋 Found ${items.length} PDFs from ZIMSEC\n`)

  let saved = 0, failed = 0, skipped = 0

  for (let i = 0; i < items.length; i++) {
    const { url, title } = items[i]
    console.log(`\n─── [${i + 1}/${items.length}] ────────────────────────`)
    const result = await seedDocument(url, title, userId)
    if (result === 'skipped') skipped++
    else if (result) saved++
    else failed++
    await sleep(300)
  }

  console.log('\n═══════════════════════════════════════════════════')
  console.log(`  ✅ Saved:   ${saved} documents`)
  console.log(`  ⏭️  Skipped: ${skipped} (admin/internal docs)`)
  console.log(`  ❌ Failed:  ${failed}`)
  console.log('═══════════════════════════════════════════════════')
  console.log('\n✨ Documents are now live at /admin/documents')
  console.log('   They appear as "Published" and visible to all students.\n')
}

main().catch(err => { console.error('\n💥', err); process.exit(1) })
