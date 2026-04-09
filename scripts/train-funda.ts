const { createClient } = require('@supabase/supabase-js')
const axios = require('axios')
require('dotenv').config()

async function trainFunda() {
  console.log('🚀 Starting Funda Knowledge Ingestion...')
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const adminEmail = 'admin@zim-elearningai.co.zw' // Default admin

  console.log(`Connecting to ${appUrl}...`)
  
  // We'll use the API endpoint we just created
  // Note: For a local script, we might want to bypass auth if we use the service role
  // But safest is to just tell the user to hit the button in the UI (if I build one)
  // or use the service role directly here.

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const CHUNK_SIZE = 1500
  const CHUNK_OVERLAP = 200
  const { KnowledgeEngine } = require('../src/lib/ai/knowledge-engine')

  // 1. Fetch all lessons
  console.log('Fetching lessons...')
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, content, courses(subjects(zimsec_level))')

  if (lessons) {
    console.log(`Found ${lessons.length} lessons. Vectorizing...`)
    for (const lesson of lessons) {
      await KnowledgeEngine.ingestResource(
        lesson.id,
        'lesson',
        lesson.title,
        lesson.content,
        { zimsec_level: lesson.courses?.subjects?.zimsec_level }
      )
    }
  }

  // 2. Fetch all documents
  console.log('Fetching documents...')
  const { data: docs } = await supabase
    .from('uploaded_documents')
    .select('id, title, extracted_text, zimsec_level')
    .eq('moderation_status', 'published')

  if (docs) {
    console.log(`Found ${docs.length} documents. Vectorizing...`)
    for (const doc of docs) {
      if (!doc.extracted_text) continue
      await KnowledgeEngine.ingestResource(
        doc.id,
        'document',
        doc.title,
        doc.extracted_text,
        { zimsec_level: doc.zimsec_level }
      )
    }
  }

  console.log('✅ Funda has finished learning all materials!')
}

trainFunda().catch(console.error)
