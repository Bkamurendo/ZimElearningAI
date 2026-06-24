export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { KnowledgeEngine } from '@/lib/ai/knowledge-engine'

/**
 * POST /api/admin/knowledge/ingest
 *
 * Ingests platform resources into the knowledge_vectors table for MaFundi/Solver RAG.
 *
 * Body params:
 *   type     — 'all' | 'lessons' | 'documents' | 'migrate'  (default: 'all')
 *   limit    — number of records to process per run         (default: 10)
 *   offset   — pagination offset                            (default: 0)
 *   force    — if true, re-ingest even if already in knowledge_vectors (default: false)
 *
 * type='migrate' reads from document_chunks (the older embedding store) and re-embeds
 * that content into knowledge_vectors as the canonical store.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { type = 'all', limit = 10, offset = 0, force = false } = await req.json()

    const results = {
      lessonsProcessed: 0,
      docsProcessed: 0,
      docsExtracted: 0,
      migrated: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // ── Find which source IDs are already in knowledge_vectors ────────────────
    const { data: existingVectors } = await supabase
      .from('knowledge_vectors')
      .select('source_id')
    const alreadyIngested = new Set((existingVectors ?? []).map((v: { source_id: string }) => v.source_id))

    // ── Process Lessons ───────────────────────────────────────────────────────
    if (type === 'all' || type === 'lessons') {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, content, courses(subjects(zimsec_level))')
        .limit(limit)
        .range(offset, offset + limit - 1)

      if (lessons) {
        for (const lesson of lessons) {
          if (!force && alreadyIngested.has(lesson.id)) {
            results.skipped++
            continue
          }
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
            results.errors.push(`Lesson "${lesson.title}": ${err.message}`)
          }
        }
      }
    }

    // ── Process Documents ─────────────────────────────────────────────────────
    if (type === 'all' || type === 'documents') {
      const { data: docs } = await supabase
        .from('uploaded_documents')
        .select('id, title, extracted_text, file_path, zimsec_level, moderation_status')
        .eq('moderation_status', 'published')
        .limit(limit)
        .range(offset, offset + limit - 1)

      if (docs) {
        for (const doc of docs) {
          if (!force && alreadyIngested.has(doc.id)) {
            results.skipped++
            continue
          }

          // Skip documents that are confirmed unreadable scanned >100 pages
          if (doc.extracted_text === '[SCANNED_IMAGE_OCR_REQUIRED]') {
            results.skipped++
            continue
          }

          try {
            if (doc.extracted_text && doc.extracted_text.length > 50) {
              // Has text — ingest directly
              await KnowledgeEngine.ingestResource(
                doc.id,
                'document',
                doc.title,
                doc.extracted_text,
                { zimsec_level: doc.zimsec_level }
              )
              results.docsProcessed++
            } else if (doc.file_path) {
              // No text yet — download, OCR if needed, then ingest
              await KnowledgeEngine.extractAndIngestDocument({
                id: doc.id,
                title: doc.title,
                file_path: doc.file_path,
                zimsec_level: doc.zimsec_level,
              })
              results.docsExtracted++
            }
          } catch (err: any) {
            results.errors.push(`Document "${doc.title}": ${err.message}`)
          }
        }
      }
    }

    // ── Migrate document_chunks → knowledge_vectors ───────────────────────────
    // Reads content from the older document_chunks store and re-embeds it into
    // knowledge_vectors so MaFundi/Solver can search it semantically.
    if (type === 'migrate') {
      // Find docs with chunks in document_chunks but not yet in knowledge_vectors
      const { data: chunkedDocs } = await supabase
        .from('document_chunks')
        .select('document_id')

      const chunkedIds = [...new Set((chunkedDocs ?? []).map((c: { document_id: string }) => c.document_id))]
      const toMigrate = chunkedIds.filter(id => force || !alreadyIngested.has(id))

      if (toMigrate.length > 0) {
        const { data: docs } = await supabase
          .from('uploaded_documents')
          .select('id, title, extracted_text, ai_summary, topics, zimsec_level')
          .in('id', toMigrate.slice(0, limit))

        if (docs) {
          for (const doc of docs) {
            const content = [
              doc.ai_summary ? `Summary: ${doc.ai_summary}` : '',
              doc.topics?.length ? `Topics: ${doc.topics.join(', ')}` : '',
              doc.extracted_text ?? '',
            ].filter(Boolean).join('\n\n')

            if (!content.trim()) {
              results.skipped++
              continue
            }

            try {
              await KnowledgeEngine.ingestResource(
                doc.id,
                'document',
                doc.title,
                content,
                { zimsec_level: doc.zimsec_level }
              )
              results.migrated++
            } catch (err: any) {
              results.errors.push(`Migrate "${doc.title}": ${err.message}`)
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary: results,
      message: `Lessons: ${results.lessonsProcessed}, Docs ingested: ${results.docsProcessed}, Docs extracted+ingested: ${results.docsExtracted}, Migrated: ${results.migrated}, Skipped (already done): ${results.skipped}, Errors: ${results.errors.length}`,
    })

  } catch (error: any) {
    console.error('[KNOWLEDGE INGEST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
