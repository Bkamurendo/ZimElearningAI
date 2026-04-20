import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function checkMissing() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = createClient(supabaseUrl!, supabaseKey!)

  // Get all doc IDs
  const { data: allDocs } = await supabase.from('uploaded_documents').select('id, title, extracted_text').eq('moderation_status', 'published')
  
  // Get all vectorized doc IDs
  const { data: vectorized } = await supabase.from('knowledge_vectors').select('source_id')
  const vectorSet = new Set(vectorized?.map(v => v.source_id))

  const validCorruptMarkers = ['[SCANNED_IMAGE_OCR_REQUIRED]', '[UNAVAILABLE]', '[PDF_PARSE_FAILED]', '[NO_TEXT]', '[PDF_PARSE_FAILED_TIMEOUT]']

  console.log('--- MISSING DOCUMENTS ---')
  let count = 0
  for (const doc of allDocs || []) {
    if (!vectorSet.has(doc.id)) {
      // Not vectorized.
      const isMarked = validCorruptMarkers.some(m => doc.extracted_text?.includes(m))
      if (!isMarked) {
        count++
        console.log(`[MISSING] ${doc.title}`)
        console.log(`   Text preview: ${doc.extracted_text?.substring(0, 30)?.replace(/\n/g, ' ')}...`)
        console.log(`   Text length: ${doc.extracted_text?.length}`)
      }
    }
  }

  console.log(`TOTAL MISSING: ${count}`)

}

checkMissing()
