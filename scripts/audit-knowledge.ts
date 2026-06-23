import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config()

import { createClient } from '@supabase/supabase-js'

async function auditKnowledge() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = createClient(supabaseUrl!, supabaseKey!)

  console.log('\n--- 🧠 FUNDA KNOWLEDGE ENGINE AUDIT ---')

  // 1. Total Lessons vs Ingested
  const { count: totalLessons } = await supabase.from('lessons').select('*', { count: 'exact', head: true })
  
  // Helper to fetch EVERYTHING without 1000 row limit
  async function getAllSourceIds(type: string) {
    const ids: string[] = []
    let offset = 0
    const PAGE_SIZE = 1000
    while (true) {
        const { data } = await supabase.from('knowledge_vectors').select('source_id').eq('source_type', type).range(offset, offset + PAGE_SIZE - 1)
        if (!data || data.length === 0) break
        ids.push(...data.map(v => v.source_id))
        offset += PAGE_SIZE
    }
    return new Set(ids).size
  }

  const learnedLessonsCount = await getAllSourceIds('lesson')

// 2. Total Docs vs Ingested
  const { count: totalDocs } = await supabase.from('uploaded_documents').select('*', { count: 'exact', head: true }).eq('moderation_status', 'published')
  const learnedDocsCount = await getAllSourceIds('document')

  // Calculate corrupt docs by matching the exact markers 
  const { data: corruptDocs } = await supabase
    .from('uploaded_documents')
    .select('id, extracted_text')
    .eq('moderation_status', 'published')
    .like('extracted_text', '[%')

  const validCorruptMarkers = ['[SCANNED_IMAGE_OCR_REQUIRED]', '[UNAVAILABLE]', '[PDF_PARSE_FAILED]', '[NO_TEXT]', '[PDF_PARSE_FAILED_TIMEOUT]']
  const permanentlySkipped = (corruptDocs || []).filter((d: any) => 
    validCorruptMarkers.some(m => d.extracted_text?.startsWith(m))
  ).length

  // 3. Total Vector Count
  const { count: totalVectors } = await supabase.from('knowledge_vectors').select('*', { count: 'exact', head: true })

  console.log(`\n📚 LESSONS: ${learnedLessonsCount} / ${totalLessons || 0} learned (${totalLessons ? Math.round((learnedLessonsCount / totalLessons) * 100) : 0}%)`)
  console.log(`📄 DOCUMENTS: ${learnedDocsCount} / ${totalDocs || 0} learned (${totalDocs ? Math.round((learnedDocsCount / totalDocs) * 100) : 0}%)`)
  console.log(`⚠️ UNPARSEABLE DOCUMENTS: ${permanentlySkipped} (Requires OCR/External Processing)`)
  console.log(`\n💎 BRAIN CAPACITY: ${(totalVectors || 0).toLocaleString()} Knowledge Fragments (Vectors) generated.`)
  
  if (learnedLessonsCount < (totalLessons || 0) || (learnedDocsCount + permanentlySkipped) < (totalDocs || 0)) {
    console.log('\n⚠️ STATUS: INCOMPLETE. MaFundi is still learning or some files are missing.')
  } else {
    console.log('\n✨ STATUS: FULLY TRAINED. MaFundi has processed all available resources safely!')
  }
}

auditKnowledge()
