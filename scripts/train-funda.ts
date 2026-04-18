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

  // 2. Fetch all documents
  console.log('Fetching documents...')
  const { data: docs, error: dErr } = await supabase
    .from('uploaded_documents')
    .select('id, title, extracted_text, zimsec_level, file_path')
    .eq('moderation_status', 'published')

  if (dErr) console.error('Error fetching documents:', dErr)

  if (docs) {
    console.log(`Found ${docs.length} documents. Checking ingestion status...`)
    for (const doc of docs) {
      try {
        // Skip if already ingested
        const { data: existing } = await supabase
          .from('knowledge_vectors')
          .select('id')
          .eq('source_id', doc.id)
          .limit(1)

        if (existing && existing.length > 0) {
          console.log(`[SKIP] Document "${doc.title}" already learned.`)
          continue
        }

        if (doc.extracted_text) {
          await KnowledgeEngine.ingestResource(
            doc.id,
            'document',
            doc.title,
            doc.extracted_text,
            { zimsec_level: doc.zimsec_level }
          )
        } else if (doc.file_path) {
          // ACTIVE EXTRACTION: If text is missing, go get it from the file!
          console.log(`[RECOVERY] No text for ${doc.title}. Extracting from storage...`)
          await KnowledgeEngine.extractAndIngestDocument({
            id: doc.id,
            title: doc.title,
            file_path: doc.file_path,
            zimsec_level: doc.zimsec_level
          })
        }
      } catch (err: any) {
        console.error(`Failed to ingest document: ${doc.title}`, err.message)
      }
    }
  }

  console.log('✅ Funda has finished learning all materials!')
}

trainFunda().catch(err => {
  console.error('Fatal Error during training:', err)
  process.exit(1)
})
