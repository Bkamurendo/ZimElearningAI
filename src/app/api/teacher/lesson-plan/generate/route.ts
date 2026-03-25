import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { subject, topic, grade, duration, context } = await req.json() as {
      subject: string
      topic: string
      grade: string
      duration: string
      context?: string
    }

    if (!subject || !topic || !grade) {
      return NextResponse.json({ error: 'subject, topic and grade are required' }, { status: 400 })
    }

    const prompt = `You are an expert Zimbabwean curriculum specialist helping a teacher create a structured lesson plan for the ZIMSEC curriculum.

Generate a complete lesson plan for:
- Subject: ${subject}
- Topic: ${topic}
- Grade/Form: ${grade}
- Duration: ${duration ?? '40'} minutes
${context ? `- Additional context: ${context}` : ''}

Follow the Zimbabwe 5-phase lesson plan model used by the Ministry of Primary and Secondary Education (MoPSE):
1. Introduction / Lesson Orientation (establish prior knowledge, link to previous lesson, state objectives)
2. Development (main teaching - direct instruction, demonstrations, worked examples)
3. Guided Practice (supervised practice with teacher support)
4. Independent Practice (students apply knowledge independently)
5. Conclusion / Assessment (summarise, evaluate learning, set homework)

Use Zimbabwean context in examples (local currency USD/ZiG, local geography, local flora/fauna, Zimbabwean history/culture).
Reference ZIMSEC syllabus objectives where appropriate.
Use activity-centred and inquiry-based approaches aligned with the Zimbabwe Competency-Based Curriculum (CBC).

Return ONLY valid JSON in this exact structure (no markdown, no explanation):
{
  "subject": "${subject}",
  "topic": "${topic}",
  "grade": "${grade}",
  "duration": "${duration ?? '40'} minutes",
  "objectives": ["By end of lesson, students should be able to ...", "..."],
  "resources": ["Chalkboard", "..."],
  "phases": [
    {
      "name": "Phase 1: Introduction / Orientation",
      "duration": "5 minutes",
      "teacherActivity": "...",
      "studentActivity": "...",
      "assessment": "..."
    },
    {
      "name": "Phase 2: Development",
      "duration": "12 minutes",
      "teacherActivity": "...",
      "studentActivity": "...",
      "assessment": "..."
    },
    {
      "name": "Phase 3: Guided Practice",
      "duration": "8 minutes",
      "teacherActivity": "...",
      "studentActivity": "...",
      "assessment": "..."
    },
    {
      "name": "Phase 4: Independent Practice",
      "duration": "10 minutes",
      "teacherActivity": "...",
      "studentActivity": "...",
      "assessment": "..."
    },
    {
      "name": "Phase 5: Conclusion & Assessment",
      "duration": "5 minutes",
      "teacherActivity": "...",
      "studentActivity": "...",
      "assessment": "..."
    }
  ],
  "boardWork": "Describe what the teacher should write on the board (title, key definitions, worked examples, summary points)",
  "homework": "Specific homework task or follow-up activity referencing the ZIMSEC textbook or past paper questions if applicable",
  "differentiation": "Strategies for supporting struggling learners and extending gifted learners in the Zimbabwean classroom context",
  "crossCurricular": "Links to other ZIMSEC subjects and real-world Zimbabwean applications"
}`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Could not parse lesson plan' }, { status: 500 })

    const plan = JSON.parse(jsonMatch[0])
    return NextResponse.json({ plan })
  } catch (err) {
    console.error('Lesson plan generation error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
