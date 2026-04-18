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
  
  // Try counting regardless of case
  const { data: kvLessons } = await supabase.from('knowledge_vectors').select('source_id, source_type')
  
  const learnedLessons = kvLessons?.filter(v => v.source_type?.toLowerCase() === 'lesson') || []
  const learnedLessonsCount = new Set(learnedLessons.map(v => v.source_id)).size

  // 2. Total Docs vs Ingested
  const { count: totalDocs } = await supabase.from('uploaded_documents').select('*', { count: 'exact', head: true, filter: 'moderation_status=published' })
  const learnedDocs = kvLessons?.filter(v => v.source_type?.toLowerCase() === 'document') || []
  const learnedDocsCount = new Set(learnedDocs.map(v => v.source_id)).size

  // 3. Total Vector Count
  const { count: totalVectors } = await supabase.from('knowledge_vectors').select('*', { count: 'exact', head: true })

  console.log(`\n📚 LESSONS: ${learnedLessonsCount} / ${totalLessons || 0} learned (${totalLessons ? Math.round((learnedLessonsCount / totalLessons) * 100) : 0}%)`)
  console.log(`📄 DOCUMENTS: ${learnedDocsCount} / ${totalDocs || 0} learned (${totalDocs ? Math.round((learnedDocsCount / totalDocs) * 100) : 0}%)`)
  console.log(`\n💎 BRAIN CAPACITY: ${(totalVectors || 0).toLocaleString()} Knowledge Fragments (Vectors) generated.`)
  
  if (totalVectors && totalVectors > 0) {
    console.log(`\n🔍 DEBUG: Table is NOT empty. Found ${kvLessons?.length} rows in memory.`)
  } else {
    console.log(`\n🔍 DEBUG: Table is actually empty [Count: ${totalVectors}]. Investigating ingestion...`)
  }
  
  if (learnedLessonsCount < totalLessons! || learnedDocsCount < totalDocs!) {
    console.log('\n⚠️ STATUS: INCOMPLETE. MaFundi is still learning or requires more training.')
  } else {
    console.log('\n✨ STATUS: FULLY TRAINED. MaFundi has absorbed all platform knowledge!')
  }
}

auditKnowledge()
