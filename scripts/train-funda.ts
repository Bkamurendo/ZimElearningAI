import path from 'path'
import dotenv from 'dotenv'
// Load .env files before any other imports
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config()

import { createClient } from '@supabase/supabase-js'
import { KnowledgeEngine } from '../src/lib/ai/knowledge-engine'

// Skip-markers written into extracted_text so we never re-attempt these
const SKIP_MARKERS = [
  '[SCANNED_IMAGE_OCR_REQUIRED]',
  '[UNAVAILABLE]',
  '[PDF_PARSE_FAILED]',
  '[NO_TEXT]',
]

async function trainFunda() {
  console.log('🚀 Starting Funda Knowledge Ingestion...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  console.log('Connected to Supabase. Mapping resources...')

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. LESSONS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📚 PHASE 1: Lessons')
  const { data: lessons, error: lErr } = await supabase
    .from('lessons')
    .select('id, title, content, courses(subjects(zimsec_level))')

  if (lErr) console.error('Error fetching lessons:', lErr)

  let lessonsIngested = 0
  let lessonsSkipped = 0

  if (lessons) {
    console.log(`Found ${lessons.length} lessons. Checking ingestion status...`)
    for (const lesson of lessons) {
      try {
        const { data: existing } = await supabase
          .from('knowledge_vectors')
          .select('id')
          .eq('source_id', lesson.id)
          .limit(1)

        if (existing && existing.length > 0) {
          lessonsSkipped++
          continue
        }

        if (!lesson.content?.trim()) {
          console.log(`[SKIP] Lesson "${lesson.title}" — no content.`)
          lessonsSkipped++
          continue
        }

        await KnowledgeEngine.ingestResource(
          lesson.id,
          'lesson',
          lesson.title,
          lesson.content,
          { zimsec_level: (lesson.courses as any)?.subjects?.zimsec_level }
        )
        lessonsIngested++
        console.log(`[✓] Lesson ingested: "${lesson.title}"`)
      } catch (err: any) {
        console.error(`[FAIL] Lesson "${lesson.title}": ${err.message}`)
      }
    }
    console.log(`\n📚 Lessons: ${lessonsIngested} newly ingested, ${lessonsSkipped} already done.\n`)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. DOCUMENTS (paginated, with permanent skip-marker system)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('📄 PHASE 2: Documents')
  let hasMore = true
  let offset = 0
  const BATCH_SIZE = 50
  let docsIngested = 0
  let docsSkipped = 0
  let docsMarked = 0
  let batchNumber = 0

  const sanitizeText = (text: string) =>
    text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')

  const isSkippableError = (msg: string) =>
    msg.includes('Unicode') ||
    msg.includes('invalid byte') ||
    msg.includes('invalid input syntax') ||
    msg.includes('unsupported')

  while (hasMore) {
    let docs: any[] | null = null
    batchNumber++

    try {
      const { data, error: dErr } = await supabase
        .from('uploaded_documents')
        .select('id, title, extracted_text, zimsec_level, file_path')
        .eq('moderation_status', 'published')
        .range(offset, offset + BATCH_SIZE - 1)

      if (dErr) throw new Error(`DB Fetch Error: ${dErr.message}`)
      docs = data
    } catch (err: any) {
      console.error(`\n❌ Batch fetch error at offset ${offset}: ${err.message}`)
      console.log('🔄 Retrying batch in 60 seconds...')
      await new Promise(resolve => setTimeout(resolve, 60000))
      continue
    }

    if (!docs || docs.length === 0) {
      hasMore = false
      break
    }

    console.log(`\n[Batch ${batchNumber}] Processing ${docs.length} docs (offset ${offset})... | ✓ ${docsIngested} ingested | ⏩ ${docsSkipped} skipped | 🏷️ ${docsMarked} marked`)

    for (const doc of docs) {
      try {
        // 1. Skip if already in knowledge vectors
        const { data: existing } = await supabase
          .from('knowledge_vectors')
          .select('id')
          .eq('source_id', doc.id)
          .limit(1)

        if (existing && existing.length > 0) {
          docsSkipped++
          continue
        }

        // 2. Skip if previously marked as unrecoverable
        if (doc.extracted_text && SKIP_MARKERS.some(m => doc.extracted_text.startsWith(m))) {
          docsSkipped++
          continue
        }

        // 3. Has extracted text — ingest directly
        if (doc.extracted_text && doc.extracted_text.trim().length > 50) {
          const cleanText = sanitizeText(doc.extracted_text)
          await KnowledgeEngine.ingestResource(
            doc.id,
            'document',
            doc.title,
            cleanText,
            { zimsec_level: doc.zimsec_level }
          )
          docsIngested++
          console.log(`[✓] Doc: "${doc.title}"`)
          continue
        }

        // 4. No text — try to extract from storage
        if (doc.file_path) {
          console.log(`[RECOVERY] "${doc.title}" — extracting from storage...`)
          
          // Download
          const { data: fileData, error: dlErr } = await supabase
            .storage
            .from('platform-documents')
            .download(doc.file_path)

          if (dlErr || !fileData) {
            // Permanently mark as unavailable so we skip on next run
            await supabase
              .from('uploaded_documents')
              .update({ extracted_text: '[UNAVAILABLE] File not found in storage.' })
              .eq('id', doc.id)
            docsMarked++
            continue
          }

          // Parse PDF
          let text = ''
          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const pdfParse = require('pdf-parse/lib/pdf-parse.js')
            const buffer = Buffer.from(await fileData.arrayBuffer())
            const parsed = await pdfParse(buffer)
            text = parsed.text?.trim() || ''

            if (!text && parsed.numpages > 0) {
              // Scanned image PDF
              await supabase
                .from('uploaded_documents')
                .update({ extracted_text: '[SCANNED_IMAGE_OCR_REQUIRED]' })
                .eq('id', doc.id)
              docsMarked++
              continue
            }
          } catch {
            await supabase
              .from('uploaded_documents')
              .update({ extracted_text: '[PDF_PARSE_FAILED]' })
              .eq('id', doc.id)
            docsMarked++
            continue
          }

          if (!text || text.trim().length < 50) {
            await supabase
              .from('uploaded_documents')
              .update({ extracted_text: '[NO_TEXT]' })
              .eq('id', doc.id)
            docsMarked++
            continue
          }

          // Save and ingest
          const cleanText = sanitizeText(text)
          await supabase
            .from('uploaded_documents')
            .update({ extracted_text: cleanText })
            .eq('id', doc.id)

          await KnowledgeEngine.ingestResource(
            doc.id,
            'document',
            doc.title,
            cleanText,
            { zimsec_level: doc.zimsec_level }
          )
          docsIngested++
          console.log(`[✓ RECOVERED] Doc: "${doc.title}"`)
        } else {
          // No file path and no text — permanently skip
          await supabase
            .from('uploaded_documents')
            .update({ extracted_text: '[UNAVAILABLE] No file path.' })
            .eq('id', doc.id)
          docsMarked++
        }

      } catch (docErr: any) {
        if (isSkippableError(docErr.message)) {
          console.warn(`[SKIP] "${doc.title}" — corrupt data.`)
        } else {
          console.error(`[FAIL] "${doc.title}": ${docErr.message}`)
        }
      }
    }

    offset += BATCH_SIZE
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Final summary
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log('✅ FUNDA TRAINING COMPLETE')
  console.log('═'.repeat(60))
  console.log(`📚 Lessons  : ${lessonsIngested} ingested, ${lessonsSkipped} already done`)
  console.log(`📄 Documents: ${docsIngested} ingested, ${docsSkipped} already done, ${docsMarked} permanently marked`)
  console.log('═'.repeat(60))
  console.log('Run `npm run audit-funda` to see the full brain capacity report.')
}

trainFunda().catch(err => {
  console.error('Fatal Error during training:', err)
  process.exit(1)
})
