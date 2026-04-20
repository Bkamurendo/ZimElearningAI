export const dynamic = 'force-dynamic';
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// 3 study plan generations per user per minute (large output)
const RATE_LIMIT = { limit: 3, windowSecs: 60 }

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(`study-planner:${user.id}`, RATE_LIMIT)
  if (!rl.success) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${rl.retryAfterSecs}s.` },
      { status: 429, headers: rateLimitHeaders(rl, RATE_LIMIT.limit) }
    )
  }

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
      model: 'claude-haiku-4-5',
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
      // Delete existing plan first, then insert (avoids UNIQUE constraint requirement)
      await supabase.from('study_plans').delete().eq('student_id', student.id)
      await supabase.from('study_plans').insert({
        student_id: student.id,
        exam_date: examDate || null,
        plan_data: plan,
        updated_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ plan })
  } catch (err) {
    console.error('Study planner error:', err)
    const raw = err instanceof Error ? err.message : String(err)
    const friendly = raw.includes('credit balance') || raw.includes('credit')
      ? 'AI credits exhausted — please top up at console.anthropic.com → Plans & Billing, then try again.'
      : raw.includes('overloaded')
      ? 'AI service is busy. Please try again in a moment.'
      : 'Failed to generate plan. Please try again.'
    return NextResponse.json({ error: friendly }, { status: 500 })
  }
}
