import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { embedBatch } from '@/lib/openai'
import { chunkText } from '@/lib/chunking'

export const maxDuration = 300

// GET — return embedding status across all published documents
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: docs } = await supabase
    .from('uploaded_documents')
    .select('id, title, extracted_text, moderation_status')
    .eq('moderation_status', 'published')
    .not('extracted_text', 'is', null)

  if (!docs) return NextResponse.json({ total: 0, embedded: 0, pending: 0, docs: [] })

  const { data: chunked } = await supabase
    .from('document_chunks')
    .select('document_id')

  const embeddedIds = new Set((chunked ?? []).map((c: { document_id: string }) => c.document_id))

  const result = docs.map(d => ({
    id: d.id,
    title: d.title,
    hasText: !!d.extracted_text,
    embedded: embeddedIds.has(d.id),
  }))

  return NextResponse.json({
    total: result.length,
    embedded: result.filter(d => d.embedded).length,
    pending: result.filter(d => !d.embedded).length,
    docs: result,
  })
}

// POST — generate embeddings for all or specific documents
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
  }

  const { documentIds, reprocess = false } = await req.json().catch(() => ({}))

  // Fetch documents to embed
  let query = supabase
    .from('uploaded_documents')
    .select('id, title, extracted_text, ai_summary, topics')
    .eq('moderation_status', 'published')
    .not('extracted_text', 'is', null)

  if (Array.isArray(documentIds) && documentIds.length > 0) {
    query = query.in('id', documentIds)
  }

  const { data: docs, error } = await query.limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!docs || docs.length === 0) return NextResponse.json({ processed: 0, message: 'No documents to embed' })

  // Filter out already-embedded docs unless reprocessing
  let toProcess = docs
  if (!reprocess) {
    const { data: existing } = await supabase
      .from('document_chunks')
      .select('document_id')
      .in('document_id', docs.map(d => d.id))

    const alreadyDone = new Set((existing ?? []).map((c: { document_id: string }) => c.document_id))
    toProcess = docs.filter(d => !alreadyDone.has(d.id))
  }

  if (toProcess.length === 0) {
    return NextResponse.json({ processed: 0, message: 'All documents already embedded' })
  }

  const results: { id: string; title: string; chunks: number; status: string }[] = []

  for (const doc of toProcess) {
    try {
      // Build rich text: summary + topics + full extracted text
      const fullText = [
        doc.ai_summary ? `Summary: ${doc.ai_summary}` : '',
        doc.topics?.length ? `Topics: ${doc.topics.join(', ')}` : '',
        doc.extracted_text ?? '',
      ].filter(Boolean).join('\n\n')

      const chunks = chunkText(fullText)
      if (chunks.length === 0) {
        results.push({ id: doc.id, title: doc.title, chunks: 0, status: 'skipped (no content)' })
        continue
      }

      // Delete existing chunks if reprocessing
      if (reprocess) {
        await supabase.from('document_chunks').delete().eq('document_id', doc.id)
      }

      // Generate embeddings in batches of 20
      const BATCH = 20
      let totalInserted = 0

      for (let i = 0; i < chunks.length; i += BATCH) {
        const batchChunks = chunks.slice(i, i + BATCH)
        const embeddings = await embedBatch(batchChunks)

        const rows = batchChunks.map((content, j) => ({
          document_id: doc.id,
          chunk_index: i + j,
          content,
          embedding: JSON.stringify(embeddings[j]),
        }))

        const { error: insertError } = await supabase.from('document_chunks').insert(rows)
        if (insertError) throw new Error(insertError.message)
        totalInserted += rows.length
      }

      results.push({ id: doc.id, title: doc.title, chunks: totalInserted, status: 'ok' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      results.push({ id: doc.id, title: doc.title, chunks: 0, status: `error: ${msg}` })
    }
  }

  const succeeded = results.filter(r => r.status === 'ok').length
  const failed = results.filter(r => r.status.startsWith('error')).length

  return NextResponse.json({
    processed: succeeded,
    failed,
    total: toProcess.length,
    results,
  })
}
