import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/* ── GET — replies for a discussion ─────────────────────────── */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('discussion_replies')
      .select('id, body, created_at, user_id, profiles(full_name, role)')
      .eq('discussion_id', params.id)
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)

    const replies = (data ?? []).map(r => ({
      ...r,
      profiles: r.profiles as unknown as { full_name: string | null; role: string } | null,
    }))

    return NextResponse.json({ replies })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

/* ── POST — post a reply ─────────────────────────────────────── */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { body } = await req.json() as { body: string }
    if (!body?.trim()) return NextResponse.json({ error: 'body required' }, { status: 400 })

    const { data, error } = await supabase
      .from('discussion_replies')
      .insert({ discussion_id: params.id, user_id: user.id, body: body.trim() })
      .select('id, body, created_at, user_id, profiles(full_name, role)')
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({
      reply: {
        ...data,
        profiles: data.profiles as unknown as { full_name: string | null; role: string } | null,
      }
    }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
