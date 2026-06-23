export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null; error: unknown }

    if (!studentProfile) return NextResponse.json({ exams: [] })

    const { data } = await supabase
      .from('exam_timetable')
      .select('id, exam_date, paper_number, start_time, duration_minutes, notes, subject:subjects(id, name, code)')
      .eq('student_id', studentProfile.id)
      .gte('exam_date', new Date().toISOString().split('T')[0])
      .order('exam_date', { ascending: true })

    return NextResponse.json({ exams: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null; error: unknown }

    if (!studentProfile) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })

    const body = await req.json()
    const { subject_id, exam_date, paper_number, start_time, duration_minutes, notes } = body

    if (!subject_id || !exam_date) {
      return NextResponse.json({ error: 'subject_id and exam_date are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('exam_timetable')
      .insert({
        student_id: studentProfile.id,
        subject_id,
        exam_date,
        paper_number: paper_number ?? '1',
        start_time: start_time ?? null,
        duration_minutes: duration_minutes ?? 150,
        notes: notes ?? null,
      })
      .select('id, exam_date, paper_number, start_time, duration_minutes, notes, subject:subjects(id, name, code)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ exam: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabase.from('exam_timetable').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
