import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subjectCode, subjectName, level, topic, difficulty = 'medium', count = 5 } = await req.json()

  const levelLabel = level === 'primary' ? 'Primary' : level === 'olevel' ? 'O-Level' : 'A-Level'

  const prompt = `Generate ${count} multiple-choice quiz questions for ZIMSEC ${levelLabel} ${subjectName}.
Topic: ${topic}
Difficulty: ${difficulty}

Return a JSON array with exactly this structure (no markdown, just raw JSON):
[
  {
    "question": "The question text",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correct": "A",
    "explanation": "Brief explanation of why A is correct, referencing the ZIMSEC syllabus"
  }
]

Rules:
- Questions must match the ZIMSEC ${levelLabel} ${subjectName} syllabus exactly
- Use ZIMSEC exam-style language and command words
- Explanations must reference how ZIMSEC examiners expect this to be answered
- For ${difficulty} difficulty: ${difficulty === 'easy' ? 'basic recall and understanding' : difficulty === 'medium' ? 'application and analysis' : 'evaluation and synthesis — exam-level challenge'}
- Use Zimbabwean context in examples where relevant`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    // Strip any markdown code fences if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const questions = JSON.parse(cleaned)

    return NextResponse.json({ questions, topic, subjectCode, subjectName, level })
  } catch (err) {
    console.error('Quiz generation error:', err)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}
