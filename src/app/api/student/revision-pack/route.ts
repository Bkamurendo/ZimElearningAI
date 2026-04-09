import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const subjectCode = req.nextUrl.searchParams.get('subjectCode')
  if (!subjectCode) {
    return NextResponse.json({ error: 'Missing subjectCode query parameter' }, { status: 400 })
  }

  try {
    // 1. Get student profile
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id, zimsec_level, grade')
      .eq('user_id', user.id)
      .single()

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // 2. Get subject details
    const { data: subject } = await supabase
      .from('subjects')
      .select('id, name, code, zimsec_level')
      .eq('code', subjectCode)
      .single()

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    // 3. Get exam date for this subject
    const { data: examEntry } = await supabase
      .from('exam_timetable')
      .select('exam_date')
      .eq('student_id', studentProfile.id)
      .eq('subject_id', subject.id)
      .order('exam_date', { ascending: true })
      .limit(1)
      .maybeSingle()

    const examDate = examEntry?.exam_date ?? null
    const daysUntilExam = examDate
      ? Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000)
      : null

    // 4. Get quiz history for this subject
    const { data: quizAttempts } = await supabase
      .from('quiz_attempts')
      .select('score, total, created_at, subject_id')
      .eq('student_id', studentProfile.id)
      .eq('subject_id', subject.id)
      .order('created_at', { ascending: false })
      .limit(20)

    // 5. Get weak topics (topic mastery data)
    const { data: topicMastery } = await supabase
      .from('topic_mastery')
      .select('topic, mastery_level, last_score')
      .eq('student_id', studentProfile.id)
      .eq('subject_id', subject.id)

    // Build weak topics list (topics with mastery below "mastered")
    const weakTopics = (topicMastery ?? [])
      .filter((t: any) => t.mastery_level !== 'mastered')
      .map((t: any) => ({
        topic: t.topic,
        lastScore: t.last_score ?? 0,
        mastery: t.mastery_level,
      }))
      .sort((a: any, b: any) => a.lastScore - b.lastScore)

    // Calculate average quiz score
    const avgScore = (quizAttempts && quizAttempts.length > 0)
      ? Math.round(quizAttempts.reduce((sum: number, q: any) => sum + (q.score / q.total) * 100, 0) / quizAttempts.length)
      : null

    // 6. Build Claude prompt
    const prompt = buildRevisionPackPrompt({
      subjectName: subject.name,
      subjectCode: subject.code,
      zimsecLevel: studentProfile.zimsec_level ?? subject.zimsec_level,
      grade: studentProfile.grade,
      examDate,
      daysUntilExam,
      weakTopics,
      avgScore,
      totalQuizzes: quizAttempts?.length ?? 0,
    })

    // 7. Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Claude API error:', errText)
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 })
    }

    const aiResult = await response.json()
    const rawText = aiResult.content?.[0]?.text ?? ''

    // 8. Parse the JSON from Claude's response
    let revisionPack
    try {
      // Extract JSON from potential markdown code fences
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawText.trim()
      revisionPack = JSON.parse(jsonStr)
    } catch {
      console.error('Failed to parse Claude response as JSON. Raw:', rawText.slice(0, 500))
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    return NextResponse.json({ revisionPack })
  } catch (err: any) {
    console.error('Revision pack error:', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}

/* ── Prompt Builder ─────────────────────────────────────────────────── */

function buildRevisionPackPrompt(params: {
  subjectName: string
  subjectCode: string
  zimsecLevel: string
  grade: string | null
  examDate: string | null
  daysUntilExam: number | null
  weakTopics: { topic: string; lastScore: number; mastery: string }[]
  avgScore: number | null
  totalQuizzes: number
}): string {
  const {
    subjectName, subjectCode, zimsecLevel, grade,
    examDate, daysUntilExam, weakTopics, avgScore, totalQuizzes,
  } = params

  const levelLabel = zimsecLevel === 'primary' ? 'Primary'
    : zimsecLevel === 'olevel' ? 'O-Level'
    : 'A-Level'

  const weakTopicsList = weakTopics.length > 0
    ? weakTopics.map(t => `- "${t.topic}" (last score: ${t.lastScore}%, mastery: ${t.mastery})`).join('\n')
    : '- No specific weak topics identified yet'

  const examInfo = examDate
    ? `Exam date: ${examDate} (${daysUntilExam} days away)`
    : 'No specific exam date set — assume exams are approaching soon'

  const performanceInfo = avgScore !== null
    ? `Average quiz score: ${avgScore}% across ${totalQuizzes} quizzes`
    : 'No quiz history available yet'

  return `You are a ZIMSEC exam preparation specialist for Zimbabwe secondary and primary education.

Generate a comprehensive Pre-Exam Revision Pack for a student studying:

Subject: ${subjectName} (${subjectCode})
Level: ZIMSEC ${levelLabel}${grade ? ` — ${grade}` : ''}
${examInfo}
${performanceInfo}

The student's WEAK TOPICS (areas needing most attention):
${weakTopicsList}

Return a JSON object with EXACTLY this structure (no extra keys, no markdown outside the JSON):

\`\`\`json
{
  "subject": "${subjectName}",
  "examDate": "${examDate ?? 'TBD'}",
  "daysUntilExam": ${daysUntilExam ?? 30},
  "weakTopics": [
    {
      "topic": "string — topic name",
      "lastScore": number (0-100),
      "importance": "high" | "medium" | "low"
    }
  ],
  "mustPracticeQuestions": [
    {
      "question": "string — full ZIMSEC-style question",
      "topic": "string — related topic",
      "difficulty": "easy" | "medium" | "hard",
      "answer": "string — complete model answer",
      "explanation": "string — step-by-step explanation"
    }
  ],
  "formulaSheet": "string — markdown formatted formulas and key equations relevant to this subject",
  "keyDefinitions": [
    {
      "term": "string",
      "definition": "string — clear, exam-ready definition"
    }
  ],
  "studyTips": ["string — actionable tip"],
  "estimatedStudyHours": number
}
\`\`\`

IMPORTANT RULES:
1. Generate EXACTLY 10 must-practice questions — focus on ZIMSEC-style questions following the Zimbabwe curriculum
2. Include at least 5 weak topics (use the provided weak topics plus infer common struggle areas for this subject at ${levelLabel} level)
3. The formula sheet should be in Markdown with proper formatting (use LaTeX-style notation where appropriate)
4. Include 8-12 key definitions that are commonly tested in ZIMSEC exams
5. Provide 5-7 practical study tips tailored to this specific subject
6. Estimate realistic study hours based on days remaining and weak topic count
7. Questions should range across easy, medium, and hard difficulty
8. All content must align with the ZIMSEC ${levelLabel} ${subjectName} syllabus
9. Return ONLY the JSON — no additional text before or after the code fence`
}
