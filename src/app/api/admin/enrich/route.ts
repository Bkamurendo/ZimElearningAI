export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/enrich
// Body: { ids: string[] }  — document IDs to (re-)process
// Triggers AI processing for each document by calling the existing process route
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { ids } = await req.json() as { ids: string[] }
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 })
  }

  // Cap at 20 per batch to avoid overload
  const batch = ids.slice(0, 20)

  // Mark all as processing immediately
  await supabase
    .from('uploaded_documents')
    .update({ moderation_status: 'processing' })
    .in('id', batch)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const cookie = req.headers.get('cookie') ?? ''

  // Fire-and-forget each process call in parallel
  const triggered: string[] = []
  const failed: string[] = []

  await Promise.allSettled(
    batch.map(async (id) => {
      try {
        const res = await fetch(`${baseUrl}/api/documents/process/${id}`, {
          method: 'POST',
          headers: { Cookie: cookie },
        })
        if (res.ok) triggered.push(id)
        else failed.push(id)
      } catch {
        failed.push(id)
      }
    })
  )

  return NextResponse.json({
    triggered: triggered.length,
    failed: failed.length,
    failedIds: failed,
  })
}

// GET /api/admin/enrich
// Returns documents that need enrichment (pending or no ai_summary)
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'pending' // pending | no_summary | all_unprocessed

  type DocRow = {
    id: string; title: string; document_type: string; moderation_status: string
    uploader_role: string; created_at: string; ai_summary: string | null; file_name: string
    subject: { name: string; code: string } | null
  }

  let query = supabase
    .from('uploaded_documents')
    .select('id, title, document_type, moderation_status, uploader_role, created_at, ai_summary, file_name, subject:subjects(name, code)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (filter === 'pending') {
    query = query.eq('moderation_status', 'pending')
  } else if (filter === 'no_summary') {
    query = query.is('ai_summary', null)
  } else {
    // all_unprocessed: pending OR no summary
    query = query.in('moderation_status', ['pending', 'processing'])
  }

  const { data, error } = await query as { data: DocRow[] | null; error: unknown }
  if (error) return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  return NextResponse.json({ documents: data ?? [] })
}
