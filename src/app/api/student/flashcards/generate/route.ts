import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: studentProfile } = await supabase
      .from('student_profiles').select('id').eq('user_id', user.id).single()
    if (!studentProfile) return NextResponse.json({ error: 'Student profile not found' }, { status: 403 })

    const { lesson_id, subject_id } = await req.json() as { lesson_id: string; subject_id?: string }
    if (!lesson_id) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })

    // Fetch lesson content
    const { data: lesson } = await supabase
      .from('lessons')
      .select('title, content, content_type, course:courses(subject:subjects(name, zimsec_level))')
      .eq('id', lesson_id)
      .single() as {
      data: {
        title: string
        content: string
        content_type: string
        course: { subject: { name: string; zimsec_level: string } | null } | null
      } | null
      error: unknown
    }

    if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    if (lesson.content_type !== 'text') {
      return NextResponse.json({ error: 'Flashcards can only be generated from text lessons' }, { status: 400 })
    }

    const subjectName = (lesson.course?.subject as { name: string; zimsec_level: string } | null)?.name ?? 'the subject'
    const level = (lesson.course?.subject as { name: string; zimsec_level: string } | null)?.zimsec_level ?? 'olevel'
    const levelLabel = level === 'primary' ? 'Primary' : level === 'olevel' ? 'O-Level' : 'A-Level'

    const prompt = `You are a ZIMSEC ${levelLabel} ${subjectName} teacher creating study flashcards.

Based on the following lesson content, generate exactly 6 flashcard pairs that test key concepts, definitions, and facts a student must know.

Lesson: "${lesson.title}"
Content:
${lesson.content.slice(0, 3000)}

Return ONLY a valid JSON array with this exact format, no explanation:
[{"front":"question or term here","back":"answer or definition here"}]`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('Invalid AI response format')

    const cards = JSON.parse(jsonMatch[0]) as { front: string; back: string }[]
    if (!Array.isArray(cards) || cards.length === 0) throw new Error('No flashcards generated')

    // Resolve subject_id from lesson if not provided
    let resolvedSubjectId = subject_id ?? null
    if (!resolvedSubjectId) {
      const { data: courseRow } = await supabase
        .from('lessons')
        .select('course:courses(subject_id)')
        .eq('id', lesson_id)
        .single() as { data: { course: { subject_id: string } | null } | null; error: unknown }
      resolvedSubjectId = (courseRow?.course as { subject_id: string } | null)?.subject_id ?? null
    }

    const rows = cards.map(c => ({
      student_id: studentProfile.id,
      subject_id: resolvedSubjectId,
      lesson_id,
      front: c.front,
      back: c.back,
    }))

    const { data: inserted, error: insertError } = await supabase.from('flashcards').insert(rows).select()
    if (insertError) throw new Error(insertError.message)

    return NextResponse.json({ flashcards: inserted ?? [], count: inserted?.length ?? 0 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
