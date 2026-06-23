export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function guardAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { admin: null, supabase }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { admin: profile?.role === 'admin' ? user : null, supabase }
}

/* ── POST — send bulk notification to audience ─────────────── */
export async function POST(req: NextRequest) {
  try {
    const { admin, supabase } = await guardAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as {
      title: string
      message: string
      audience: 'all' | 'students' | 'teachers' | 'parents'
      type?: string
    }

    if (!body.title?.trim() || !body.message?.trim() || !body.audience) {
      return NextResponse.json({ error: 'title, message and audience are required' }, { status: 400 })
    }

    // Fetch target user IDs
    let usersQuery = supabase.from('profiles').select('id')
    if (body.audience !== 'all') {
      const roleMap: Record<string, string> = { students: 'student', teachers: 'teacher', parents: 'parent' }
      usersQuery = usersQuery.eq('role', roleMap[body.audience])
    }
    usersQuery = usersQuery.eq('suspended', false)

    const { data: users, error: uErr } = await usersQuery
    if (uErr) throw new Error(uErr.message)
    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, sent: 0 })
    }

    // Bulk insert notifications (chunk to avoid hitting insert limits)
    const rows = users.map((u) => ({
      user_id: u.id,
      type: body.type ?? 'info',
      title: body.title.trim(),
      message: body.message.trim(),
      metadata: { bulk: true, sent_by: admin.id, audience: body.audience },
    }))

    const chunkSize = 500
    let sent = 0
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize)
      const { error } = await supabase.from('notifications').insert(chunk)
      if (error) throw new Error(error.message)
      sent += chunk.length
    }

    await supabase.from('audit_logs').insert({
      admin_id: admin.id, action: 'bulk_notification', resource_type: 'notification',
      details: { title: body.title, audience: body.audience, sent },
    })

    return NextResponse.json({ success: true, sent })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
