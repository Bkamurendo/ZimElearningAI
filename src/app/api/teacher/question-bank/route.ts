export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: teacher } = await supabase
      .from('teacher_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null; error: unknown }

    if (!teacher) return NextResponse.json({ questions: [] })

    const { data, error } = await supabase
      .from('question_bank')
      .select('*')
      .eq('teacher_id', teacher.id)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return NextResponse.json({ questions: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: teacher } = await supabase
      .from('teacher_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null; error: unknown }

    if (!teacher) return NextResponse.json({ error: 'No teacher profile' }, { status: 403 })

    const body = await req.json()
    const { question, question_type, topic, subject_id, marks, difficulty, answer, options, zimsec_level } = body

    if (!question?.trim()) return NextResponse.json({ error: 'question required' }, { status: 400 })

    const { data, error } = await supabase
      .from('question_bank')
      .insert({
        teacher_id: teacher.id,
        question: question.trim(),
        question_type: question_type ?? 'short_answer',
        topic: topic ?? null,
        subject_id: subject_id ?? null,
        marks: marks ?? 1,
        difficulty: difficulty ?? 'medium',
        answer: answer ?? null,
        options: options ?? null,
        zimsec_level: zimsec_level ?? null,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ question: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await supabase.from('question_bank').delete().eq('id', id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
