export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getStudentId(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('student_profiles').select('id').eq('user_id', user.id).single()
  return data?.id ?? null
}

/* ── GET — fetch flashcards ─────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const studentId = await getStudentId(supabase)
    if (!studentId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const subjectId = new URL(req.url).searchParams.get('subject_id')

    let query = supabase
      .from('flashcards')
      .select('*, subjects(name), lessons(title)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (subjectId) query = query.eq('subject_id', subjectId)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return NextResponse.json({ flashcards: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

/* ── POST — bulk create flashcards ─────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const studentId = await getStudentId(supabase)
    if (!studentId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      subject_id?: string
      lesson_id?: string
      cards: { front: string; back: string }[]
    }

    if (!body.cards?.length) return NextResponse.json({ error: 'cards array required' }, { status: 400 })

    const rows = body.cards.map(c => ({
      student_id: studentId,
      subject_id: body.subject_id ?? null,
      lesson_id: body.lesson_id ?? null,
      front: c.front.trim(),
      back: c.back.trim(),
    }))

    const { data, error } = await supabase.from('flashcards').insert(rows).select()
    if (error) throw new Error(error.message)
    return NextResponse.json({ flashcards: data ?? [] }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

/* ── DELETE — delete flashcard ──────────────────────────────── */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient()
    const studentId = await getStudentId(supabase)
    if (!studentId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id)
      .eq('student_id', studentId)

    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
