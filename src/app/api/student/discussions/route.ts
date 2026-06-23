export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/* ── GET — list discussions for a subject ────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const subjectId = searchParams.get('subject_id')
    const offset = parseInt(searchParams.get('offset') ?? '0')
    const limit = parseInt(searchParams.get('limit') ?? '20')

    if (!subjectId) return NextResponse.json({ error: 'subject_id required' }, { status: 400 })

    const { data, error } = await supabase
      .from('discussions')
      .select('id, title, body, pinned, created_at, user_id, profiles(full_name, role)')
      .eq('subject_id', subjectId)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(error.message)

    // Get reply counts
    const ids = (data ?? []).map(d => d.id)
    const { data: replyCounts } = ids.length > 0
      ? await supabase
          .from('discussion_replies')
          .select('discussion_id')
          .in('discussion_id', ids)
      : { data: [] as { discussion_id: string }[] }

    const countMap: Record<string, number> = {}
    for (const r of (replyCounts ?? [])) {
      countMap[r.discussion_id] = (countMap[r.discussion_id] ?? 0) + 1
    }

    const discussions = (data ?? []).map(d => ({
      ...d,
      profiles: d.profiles as unknown as { full_name: string | null; role: string } | null,
      reply_count: countMap[d.id] ?? 0,
    }))

    return NextResponse.json({ discussions })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

/* ── POST — create discussion ────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { subject_id: string; title: string; body: string }
    if (!body.subject_id || !body.title?.trim() || !body.body?.trim()) {
      return NextResponse.json({ error: 'subject_id, title and body are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('discussions')
      .insert({ subject_id: body.subject_id, user_id: user.id, title: body.title.trim(), body: body.body.trim() })
      .select('id, title, body, pinned, created_at, user_id, profiles(full_name, role)')
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({
      discussion: {
        ...data,
        profiles: data.profiles as unknown as { full_name: string | null; role: string } | null,
        reply_count: 0,
      }
    }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
