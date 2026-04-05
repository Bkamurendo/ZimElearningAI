import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const LEVEL_SUBJECTS: Record<string, string[]> = {
  primary: ['Mathematics', 'English', 'Science', 'Social Studies', 'Shona', 'Ndebele'],
  olevel: [
    'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Commerce', 'Accounts', 'Computer Science',
  ],
  alevel: [
    'Pure Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Economics', 'History', 'Geography', 'Accounting',
  ],
}

function getTodayLabel(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[new Date().getDay()]
}

// GET — fetch today's challenge (or generate it if it doesn't exist yet)
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const level = searchParams.get('level') as 'primary' | 'olevel' | 'alevel' | null
  if (!level || !['primary', 'olevel', 'alevel'].includes(level)) {
    return NextResponse.json({ error: 'Invalid level' }, { status: 400 })
  }

  const todayStr = new Date().toISOString().split('T')[0]

  // Check if today's challenge already exists
  const { data: existing } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('challenge_date', todayStr)
    .eq('zimsec_level', level)
    .single()

  let challenge = existing

  // Generate if not yet created
  if (!challenge) {
    const subjects = LEVEL_SUBJECTS[level] ?? LEVEL_SUBJECTS.olevel
    const picked = subjects.sort(() => Math.random() - 0.5).slice(0, 5)
    const levelLabel = level === 'primary' ? 'Primary' : level === 'olevel' ? 'O-Level' : 'A-Level'

    const prompt = `Generate exactly 5 multiple-choice questions for ZIMSEC ${levelLabel} students.
Each question must cover a DIFFERENT subject from this list: ${picked.join(', ')}.
One question per subject, in the same order.

Return a raw JSON array (no markdown, no code fences) with exactly this structure:
[
  {
    "subject": "Mathematics",
    "topic": "Algebra",
    "question": "The question text here",
    "options": [
      {"label": "A", "text": "first option", "correct": false},
      {"label": "B", "text": "second option", "correct": true},
      {"label": "C", "text": "third option", "correct": false},
      {"label": "D", "text": "fourth option", "correct": false}
    ],
    "explanation": "Brief explanation of the correct answer referencing ZIMSEC syllabus"
  }
]

Rules:
- Questions must match the ZIMSEC ${levelLabel} syllabus exactly
- Use ZIMSEC exam-style language
- Use Zimbabwean context where relevant
- Each question must have exactly one correct option (correct: true)`

    try {
      console.log(`[daily-challenge] Generating for ${level}...`)
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const questions = JSON.parse(cleaned)

      const dayLabel = getTodayLabel()
      const title = `${dayLabel} Challenge — Mixed Subjects`

      const { data: inserted, error: insertError } = await supabase
        .from('daily_challenges')
        .insert({
          challenge_date: todayStr,
          zimsec_level: level,
          title,
          questions,
          xp_reward: 50,
          bonus_xp: 25,
        })
        .select()
        .single()

      if (insertError) {
        console.error('[daily-challenge] Insert error:', insertError)
        // Race condition: another request already inserted; fetch it
        const { data: raceResult, error: raceError } = await supabase
          .from('daily_challenges')
          .select('*')
          .eq('challenge_date', todayStr)
          .eq('zimsec_level', level)
          .single()
        
        if (raceError) {
          console.error('[daily-challenge] Race fetch error:', raceError)
          throw new Error('Could not find challenge after race condition.')
        }
        challenge = raceResult
      } else {
        challenge = inserted
      }
    } catch (err) {
      console.error('[daily-challenge] Generation/Save error:', err)
      const raw = err instanceof Error ? err.message : String(err)
      const friendly = raw.includes('credit') || raw.includes('credit balance')
        ? 'AI credits exhausted — please top up at console.anthropic.com.'
        : raw.includes('overloaded')
        ? 'AI service is busy. Please try again in a moment.'
        : raw.includes('relation "daily_challenges" does not exist')
        ? 'Database schema out of sync (missing daily_challenges table). Please run migrations.'
        : `Failed to generate challenge: ${raw}`
      return NextResponse.json({ error: friendly }, { status: 500 })
    }
  }

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not available' }, { status: 500 })
  }

  // Check if this user has already attempted today's challenge
  const { data: attempt } = await supabase
    .from('daily_challenge_attempts')
    .select('*')
    .eq('challenge_id', challenge.id)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ challenge, attempt: attempt ?? null })
}

// POST — submit an attempt
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    challengeId: string
    answers: { questionIndex: number; selected: string }[]
    timeTakenSeconds: number
  }

  const { challengeId, answers, timeTakenSeconds } = body

  // Fetch the challenge to grade against
  const { data: challenge, error: challengeError } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('id', challengeId)
    .single()

  if (challengeError || !challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  // Check for duplicate attempt
  const { data: existing } = await supabase
    .from('daily_challenge_attempts')
    .select('id')
    .eq('challenge_id', challengeId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Already attempted today\'s challenge' }, { status: 409 })
  }

  // Grade the answers
  const questions = challenge.questions as {
    subject: string
    topic: string
    question: string
    options: { label: string; text: string; correct: boolean }[]
    explanation: string
  }[]

  const gradedAnswers = answers.map((a) => {
    const q = questions[a.questionIndex]
    if (!q) return { questionIndex: a.questionIndex, selected: a.selected, correct: false }
    const correctOption = q.options.find((o) => o.correct)
    const isCorrect = correctOption?.label === a.selected
    return { questionIndex: a.questionIndex, selected: a.selected, correct: isCorrect }
  })

  const score = gradedAnswers.filter((a) => a.correct).length
  const isPerfect = score === 5
  const xpEarned = score > 0
    ? challenge.xp_reward + (isPerfect ? challenge.bonus_xp : 0)
    : 0

  // Save the attempt
  const { error: insertError } = await supabase
    .from('daily_challenge_attempts')
    .insert({
      challenge_id: challengeId,
      user_id: user.id,
      answers: gradedAnswers,
      score,
      xp_earned: xpEarned,
      time_taken_seconds: timeTakenSeconds,
    })

  if (insertError) {
    console.error('Attempt insert error:', insertError)
    return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 })
  }

  // Award XP to student_streaks
  let totalXp = 0
  try {
    const { data: sp } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null; error: unknown }

    if (sp) {
      // Award XP to student_streaks (using upsert for robustness)
      const { data: streakRow } = await supabase
        .from('student_streaks')
        .select('id, total_xp')
        .eq('student_id', sp.id)
        .maybeSingle()

      if (streakRow) {
        const newTotal = (streakRow.total_xp ?? 0) + xpEarned
        await supabase
          .from('student_streaks')
          .update({ total_xp: newTotal, updated_at: new Date().toISOString() })
          .eq('id', streakRow.id)
        totalXp = newTotal
      } else {
        // Create new streak record
        const { data: inserted } = await supabase
          .from('student_streaks')
          .insert({
            student_id: sp.id,
            total_xp: xpEarned,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: new Date().toISOString().split('T')[0]
          })
          .select('total_xp')
          .single()
        totalXp = inserted?.total_xp ?? xpEarned
      }
    }
  } catch {
    // XP update is non-critical
  }

  // Build results with explanations
  const results = questions.map((q, i) => {
    const answer = gradedAnswers.find((a) => a.questionIndex === i)
    const correctOption = q.options.find((o) => o.correct)
    return {
      questionIndex: i,
      subject: q.subject,
      question: q.question,
      selected: answer?.selected ?? null,
      correct: answer?.correct ?? false,
      correctLabel: correctOption?.label ?? '',
      correctText: correctOption?.text ?? '',
      explanation: q.explanation,
    }
  })

  return NextResponse.json({ score, xpEarned, results, totalXp, isPerfect })
}
