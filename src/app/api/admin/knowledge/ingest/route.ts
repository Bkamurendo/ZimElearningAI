import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { KnowledgeEngine } from '@/lib/ai/knowledge-engine'

/**
 * POST /api/admin/knowledge/ingest
 * 
 * Triggers the Knowledge Engine to 'learn' all platform resources.
 * This iterates through all published lessons and documents, vectorizes them,
 * and saves them to the Funda Knowledge Engine.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // 1. Admin Guard
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { type = 'all', limit = 10, offset = 0 } = await req.json()

    const results = {
      lessonsProcessed: 0,
      docsProcessed: 0,
      errors: [] as string[]
    }

    // --- Process Lessons ---
    if (type === 'all' || type === 'lessons') {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, content, courses(subjects(zimsec_level))')
        .limit(limit)
        .range(offset, offset + limit - 1)

      if (lessons) {
        for (const lesson of lessons) {
          try {
            await KnowledgeEngine.ingestResource(
              lesson.id,
              'lesson',
              lesson.title,
              lesson.content,
              { zimsec_level: (lesson.courses as any)?.subjects?.zimsec_level }
            )
            results.lessonsProcessed++
          } catch (err: any) {
            results.errors.push(`Lesson ${lesson.title}: ${err.message}`)
          }
        }
      }
    }

    // --- Process Documents ---
    if (type === 'all' || type === 'documents') {
      const { data: docs } = await supabase
        .from('uploaded_documents')
        .select('id, title, extracted_text, zimsec_level')
        .eq('moderation_status', 'published')
        .limit(limit)
        .range(offset, offset + limit - 1)

      if (docs) {
        for (const doc of docs) {
          if (!doc.extracted_text) continue
          try {
            await KnowledgeEngine.ingestResource(
              doc.id,
              'document',
              doc.title,
              doc.extracted_text,
              { zimsec_level: doc.zimsec_level }
            )
            results.docsProcessed++
          } catch (err: any) {
            results.errors.push(`Document ${doc.title}: ${err.message}`)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary: results,
      message: `Processed ${results.lessonsProcessed} lessons and ${results.docsProcessed} documents.`
    })

  } catch (error: any) {
    console.error('[KNOWLEDGE INGEST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
