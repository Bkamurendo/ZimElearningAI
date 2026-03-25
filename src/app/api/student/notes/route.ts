import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getStudentId(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { studentId: null, userId: null }
  const { data } = await supabase.from('student_profiles').select('id').eq('user_id', user.id).single()
  return { studentId: data?.id ?? null, userId: user.id }
}

/* ── GET — fetch notes ──────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { studentId } = await getStudentId(supabase)
    if (!studentId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const lessonId = searchParams.get('lesson_id')
    const subjectId = searchParams.get('subject_id')

    let query = supabase
      .from('student_notes')
      .select('*, subjects(name), lessons(title)')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false })

    if (lessonId) query = query.eq('lesson_id', lessonId)
    else if (subjectId) query = query.eq('subject_id', subjectId)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return NextResponse.json({ notes: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

/* ── POST — create note ─────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { studentId } = await getStudentId(supabase)
    if (!studentId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { title?: string; content?: string; lesson_id?: string; subject_id?: string }

    const { data, error } = await supabase
      .from('student_notes')
      .insert({
        student_id: studentId,
        title: body.title?.trim() || 'Untitled Note',
        content: body.content ?? '',
        lesson_id: body.lesson_id ?? null,
        subject_id: body.subject_id ?? null,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ note: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

/* ── PATCH — update note ────────────────────────────────────── */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient()
    const { studentId } = await getStudentId(supabase)
    if (!studentId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { id: string; title?: string; content?: string }
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.title !== undefined) updates.title = body.title.trim() || 'Untitled Note'
    if (body.content !== undefined) updates.content = body.content

    const { data, error } = await supabase
      .from('student_notes')
      .update(updates)
      .eq('id', body.id)
      .eq('student_id', studentId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ note: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

/* ── DELETE — delete note ───────────────────────────────────── */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient()
    const { studentId } = await getStudentId(supabase)
    if (!studentId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabase
      .from('student_notes')
      .delete()
      .eq('id', id)
      .eq('student_id', studentId)

    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
