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
      .from('student_profiles').select('id, zimsec_level').eq('user_id', user.id).single()
    if (!studentProfile) return NextResponse.json({ error: 'Student profile not found' }, { status: 403 })

    const { subject_id } = await req.json() as { subject_id: string }
    if (!subject_id) return NextResponse.json({ error: 'subject_id required' }, { status: 400 })

    // 1. Fetch student's struggles from teaching memory
    const { data: memory } = await supabase
      .from('student_teaching_memory')
      .select('topic, common_mistakes, mastery_level')
      .eq('student_id', studentProfile.id)
      .eq('subject_id', subject_id)
      .order('mastery_level', { ascending: true }) // Target weak areas first
      .limit(5)

    if (!memory || memory.length === 0) {
      return NextResponse.json({ error: 'No teaching memory found for this subject yet. Start chatting with MaFundi first!' }, { status: 404 })
    }

    const { data: subject } = await supabase.from('subjects').select('name').eq('id', subject_id).single()
    const subjectName = subject?.name ?? 'the subject'
    const levelLabel = studentProfile.zimsec_level === 'primary' ? 'Primary' : studentProfile.zimsec_level === 'olevel' ? 'O-Level' : 'A-Level'

    // 2. Prepare AI prompt using struggles
    const strugglesText = memory
      .map(m => `- Topic: ${m.topic} (Mastery: ${m.mastery_level}%). Mistakes: ${JSON.stringify(m.common_mistakes)}`)
      .join('\n')

    const prompt = `You are a ZIMSEC ${levelLabel} ${subjectName} teacher. 
    A student is struggling with specific concepts. Based on their common mistakes below, generate 8 high-impact flashcards (Active Recall) to help them overcome these gaps.
    Focus exclusively on clarifying the areas they misunderstood.

    STUDENT STRUGGLES:
    ${strugglesText}

    Return ONLY a valid JSON array with this exact format:
    [{"front":"challenging question addressing a mistake","back":"clear corrective explanation"}]`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1536,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('Invalid AI response format')

    const cards = JSON.parse(jsonMatch[0]) as { front: string; back: string }[]
    if (!Array.isArray(cards) || cards.length === 0) throw new Error('No flashcards generated')

    // 3. Insert into flashcards table
    const rows = cards.map(c => ({
      student_id: studentProfile.id,
      subject_id,
      front: c.front,
      back: c.back,
      is_ai_generated: true,
      generation_source: 'struggles'
    }))

    const { data: inserted, error: insertError } = await supabase.from('flashcards').insert(rows).select()
    if (insertError) throw new Error(insertError.message)

    return NextResponse.json({ 
      flashcards: inserted ?? [], 
      count: inserted?.length ?? 0,
      message: `🎯 Generated ${inserted?.length} personalized cards from your recent struggles!`
    })
  } catch (err) {
    console.error('[flashcards-struggles] Error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
