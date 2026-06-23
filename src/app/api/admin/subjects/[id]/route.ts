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

/* ── PATCH — update subject ────────────────────────────────── */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { admin, supabase } = await guardAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as { name?: string; code?: string; description?: string }
    const updates: Record<string, unknown> = {}
    if (body.name?.trim()) updates.name = body.name.trim()
    if (body.code?.trim()) updates.code = body.code.trim().toUpperCase()
    if (typeof body.description === 'string') updates.description = body.description.trim() || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase.from('subjects').update(updates).eq('id', params.id).select().single()
    if (error) throw new Error(error.message)

    await supabase.from('audit_logs').insert({
      admin_id: admin.id, action: 'update_subject', resource_type: 'subject',
      resource_id: params.id, details: updates,
    })

    return NextResponse.json({ subject: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

/* ── DELETE — delete subject ───────────────────────────────── */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { admin, supabase } = await guardAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Prevent deletion if students are enrolled
    const { count } = await supabase.from('student_subjects').select('id', { count: 'exact', head: true }).eq('subject_id', params.id)
    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: `Cannot delete — ${count} student(s) enrolled in this subject` }, { status: 409 })
    }

    const { error } = await supabase.from('subjects').delete().eq('id', params.id)
    if (error) throw new Error(error.message)

    await supabase.from('audit_logs').insert({
      admin_id: admin.id, action: 'delete_subject', resource_type: 'subject', resource_id: params.id,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
