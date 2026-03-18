import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { checkAIQuota } from '@/lib/ai-quota'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// 10 quiz generations per user per minute
const RATE_LIMIT = { limit: 10, windowSecs: 60 }

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(`quiz-generate:${user.id}`, RATE_LIMIT)
  if (!rl.success) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${rl.retryAfterSecs}s.` },
      { status: 429, headers: rateLimitHeaders(rl, RATE_LIMIT.limit) }
    )
  }

  const quota = await checkAIQuota(supabase, user.id)
  if (!quota.allowed) {
    return NextResponse.json({
      error: `Daily AI limit reached (${quota.used}/${quota.limit}). Resets at midnight UTC. Upgrade to Pro for unlimited access.`,
      quota,
    }, { status: 429 })
  }

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
      model: 'claude-haiku-4-5',
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
    const raw = err instanceof Error ? err.message : String(err)
    const friendly = raw.includes('credit balance') || raw.includes('credit')
      ? 'AI credits exhausted — please top up at console.anthropic.com → Plans & Billing.'
      : raw.includes('overloaded')
      ? 'AI service is busy. Please try again in a moment.'
      : 'Failed to generate. Please try again.'
    return NextResponse.json({ error: friendly }, { status: 500 })
  }
}
