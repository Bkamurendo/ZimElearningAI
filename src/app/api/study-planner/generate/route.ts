import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { examDate, subjects, weakTopics, level } = await req.json()

  const levelLabel = level === 'primary' ? 'Primary' : level === 'olevel' ? 'O-Level' : 'A-Level'
  const today = new Date().toISOString().slice(0, 10)
  const daysUntilExam = examDate
    ? Math.max(1, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000))
    : 90

  const prompt = `Create a personalised ZIMSEC ${levelLabel} study plan for a student.

Details:
- Subjects: ${subjects.join(', ')}
- Days until exam: ${daysUntilExam} (exam date: ${examDate || 'not set'})
- Weak topics needing focus: ${weakTopics.length > 0 ? weakTopics.join(', ') : 'none identified yet'}
- Today: ${today}

Generate a practical weekly study plan as a JSON object with this structure:
{
  "summary": "2-3 sentence overview of the plan strategy",
  "weeks": [
    {
      "week": 1,
      "theme": "Week theme/focus",
      "days": [
        {
          "day": "Monday",
          "tasks": [
            { "subject": "Mathematics", "topic": "Algebra", "duration": "45 mins", "type": "learn|practice|review" }
          ]
        }
      ]
    }
  ],
  "tips": ["Exam tip 1", "Exam tip 2", "Exam tip 3"]
}

Rules:
- Return raw JSON only, no markdown
- Generate ${Math.min(daysUntilExam <= 14 ? 2 : 4, 4)} weeks maximum
- Prioritise weak topics in early weeks
- Include rest days (Sunday)
- Sessions should be 30-60 minutes each
- Mix learning new content, practice questions, and ZIMSEC past paper practice
- Include specific ZIMSEC exam technique tips for Zimbabwe`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const plan = JSON.parse(cleaned)

    // Save plan
    const { data: student } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (student) {
      await supabase.from('study_plans').upsert(
        { student_id: student.id, exam_date: examDate || null, plan_data: plan, updated_at: new Date().toISOString() },
        { onConflict: 'student_id' }
      )
    }

    return NextResponse.json({ plan })
  } catch (err) {
    console.error('Study planner error:', err)
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}
