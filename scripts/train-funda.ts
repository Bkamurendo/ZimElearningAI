import path from 'path'
import dotenv from 'dotenv'
// Load .env files before any other imports
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config()

import { createClient } from '@supabase/supabase-js'
import { KnowledgeEngine } from '../src/lib/ai/knowledge-engine'

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

  // 1. Fetch all lessons
  console.log('Fetching lessons...')
  const { data: lessons, error: lErr } = await supabase
    .from('lessons')
    .select('id, title, content, courses(subjects(zimsec_level))')

  if (lErr) console.error('Error fetching lessons:', lErr)

  if (lessons) {
    console.log(`Found ${lessons.length} lessons. Checking ingestion status...`)
    for (const lesson of lessons) {
      try {
        // Skip if already ingested
        const { data: existing } = await supabase
          .from('knowledge_vectors')
          .select('id')
          .eq('source_id', lesson.id)
          .limit(1)

        if (existing && existing.length > 0) {
          console.log(`[SKIP] Lesson "${lesson.title}" already learned.`)
          continue
        }

        await KnowledgeEngine.ingestResource(
          lesson.id,
          'lesson',
          lesson.title,
          lesson.content || '',
          { zimsec_level: (lesson.courses as any)?.subjects?.zimsec_level }
        )
      } catch (err: any) {
        console.error(`Failed to ingest lesson: ${lesson.title}`, err.message)
      }
    }
  }

  // 2. Fetch all documents (PAGINATED with Smart Retry)
  console.log('Fetching documents in batches...')
  let hasMore = true
  let offset = 0
  const BATCH_SIZE = 50

  // Errors that mean the document itself is corrupt — skip, don't retry
  const isSkippableError = (msg: string) =>
    msg.includes('Unicode') ||
    msg.includes('invalid byte') ||
    msg.includes('invalid input syntax') ||
    msg.includes('unsupported')

  // Sanitize text to remove invalid Unicode characters before inserting
  const sanitizeText = (text: string) =>
    text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')

  const runIngestion = async () => {
    while (hasMore) {
      let docs: any[] | null = null
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
        continue // retry same offset
      }

      if (!docs || docs.length === 0) {
        hasMore = false
        break
      }

      console.log(`Processing batch of ${docs.length} documents (Total Processed: ${offset + docs.length})...`)

      for (const doc of docs) {
        try {
          // Skip if already ingested
          const { data: existing } = await supabase
            .from('knowledge_vectors')
            .select('id')
            .eq('source_id', doc.id)
            .limit(1)

          if (existing && existing.length > 0) continue

          if (doc.extracted_text) {
            const cleanText = sanitizeText(doc.extracted_text)
            await KnowledgeEngine.ingestResource(
              doc.id,
              'document',
              doc.title,
              cleanText,
              { zimsec_level: doc.zimsec_level }
            )
          } else if (doc.file_path) {
            console.log(`[RECOVERY] No text for ${doc.title}. Extracting from storage...`)
            await KnowledgeEngine.extractAndIngestDocument({
              id: doc.id,
              title: doc.title,
              file_path: doc.file_path,
              zimsec_level: doc.zimsec_level
            })
          }
        } catch (docErr: any) {
          if (isSkippableError(docErr.message)) {
            console.warn(`[SKIP] "${doc.title}" has corrupt data — skipping permanently.`)
          } else {
            console.error(`[FAIL] "${doc.title}": ${docErr.message}`)
          }
          // Either way, continue to next document
        }
      }

      offset += BATCH_SIZE // Always advance, even if some docs failed
    }
  }

  await runIngestion()

  console.log('✅ Funda has finished learning all materials!')
}

trainFunda().catch(err => {
  console.error('Fatal Error during training:', err)
  process.exit(1)
})
