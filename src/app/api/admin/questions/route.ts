import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function guardAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { admin: null, supabase }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { admin: profile?.role === 'admin' ? user : null, supabase }
}

/* ── GET — list questions with optional filters ─────────────── */
export async function GET(req: NextRequest) {
  try {
    const { admin, supabase } = await guardAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const subject_id = searchParams.get('subject_id')
    const difficulty = searchParams.get('difficulty')
    const topic = searchParams.get('topic')
    const offset = parseInt(searchParams.get('offset') ?? '0')

    let query = supabase
      .from('questions')
      .select('*, subjects(name, code)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + 49)

    if (subject_id) query = query.eq('subject_id', subject_id)
    if (difficulty) query = query.eq('difficulty', difficulty)
    if (topic) query = query.ilike('topic', `%${topic}%`)

    const { data, count, error } = await query
    if (error) throw new Error(error.message)

    return NextResponse.json({ questions: data ?? [], total: count ?? 0 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

/* ── POST — create question ─────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const { admin, supabase } = await guardAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as {
      subject_id: string
      topic: string
      difficulty: string
      question_text: string
      options?: { label: string; text: string }[]
      correct_answer: string
      explanation?: string
    }

    if (!body.subject_id || !body.topic?.trim() || !body.question_text?.trim() || !body.correct_answer?.trim()) {
      return NextResponse.json({ error: 'subject_id, topic, question_text and correct_answer are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('questions')
      .insert({
        subject_id: body.subject_id,
        topic: body.topic.trim(),
        difficulty: ['easy', 'medium', 'hard'].includes(body.difficulty) ? body.difficulty : 'medium',
        question_text: body.question_text.trim(),
        options: body.options ?? null,
        correct_answer: body.correct_answer.trim(),
        explanation: body.explanation?.trim() ?? null,
        created_by: admin.id,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    await supabase.from('audit_logs').insert({
      admin_id: admin.id, action: 'create_question', resource_type: 'question',
      resource_id: data.id, details: { topic: data.topic, difficulty: data.difficulty },
    })

    return NextResponse.json({ question: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
