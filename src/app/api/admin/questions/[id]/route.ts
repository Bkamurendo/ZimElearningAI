import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function guardAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { admin: null, supabase }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { admin: profile?.role === 'admin' ? user : null, supabase }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { admin, supabase } = await guardAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as Record<string, unknown>
    const allowed = ['topic', 'difficulty', 'question_text', 'options', 'correct_answer', 'explanation', 'subject_id']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
    }

    const { data, error } = await supabase.from('questions').update(updates).eq('id', params.id).select().single()
    if (error) throw new Error(error.message)

    await supabase.from('audit_logs').insert({
      admin_id: admin.id, action: 'update_question', resource_type: 'question',
      resource_id: params.id, details: updates,
    })

    return NextResponse.json({ question: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { admin, supabase } = await guardAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await supabase.from('questions').delete().eq('id', params.id)
    if (error) throw new Error(error.message)

    await supabase.from('audit_logs').insert({
      admin_id: admin.id, action: 'delete_question', resource_type: 'question', resource_id: params.id,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
