export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

interface PathItem {
  subject: string
  topic: string
  reason: string
  priority: number
  actionType: 'Start Lesson' | 'Practice Quiz' | 'Watch Video' | 'Review Notes'
  actionUrl: string
}

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student profile
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id, zimsec_level, grade')
      .eq('user_id', user.id)
      .single() as { data: { id: string; zimsec_level: string; grade: string } | null; error: unknown }

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Fetch data in parallel
    const [
      { data: enrolledSubjects },
      { data: quizAttempts },
      { data: masteryData },
      { data: examTimetable },
    ] = await Promise.all([
      // Enrolled subjects
      supabase
        .from('student_subjects')
        .select('subject:subjects(id, name, code)')
        .eq('student_id', studentProfile.id),

      // Recent quiz attempts (last 10)
      supabase
        .from('quiz_attempts')
        .select('score, total, topic, created_at, subject:subjects(id, name)')
        .eq('student_id', studentProfile.id)
        .order('created_at', { ascending: false })
        .limit(10),

      // Topic mastery data
      supabase
        .from('topic_mastery')
        .select('topic, mastery_level, subject:subjects(id, name), updated_at')
        .eq('student_id', studentProfile.id),

      // Upcoming exams (if table exists, gracefully handle if not)
      supabase
        .from('exam_timetable')
        .select('exam_date, subject:subjects(id, name)')
        .eq('student_id', studentProfile.id)
        .gte('exam_date', new Date().toISOString().split('T')[0])
        .order('exam_date', { ascending: true })
        .limit(10),
    ])

    const subjects = (enrolledSubjects ?? []).map((s: any) => s.subject).filter(Boolean) as { id: string; name: string; code?: string }[]

    // If no enrolled subjects, return empty path
    if (subjects.length === 0) {
      return NextResponse.json({
        path: [],
        message: 'Enrol in subjects first to get a personalized study path.',
      })
    }

    // Build context for Claude
    const quizSummary = (quizAttempts ?? []).map((q: Record<string, unknown>) => {
      const sub = q.subject as { name: string } | null
      const pct = q.total ? Math.round(((q.score as number) / (q.total as number)) * 100) : 0
      return `${sub?.name ?? 'Unknown'} - "${q.topic}": ${pct}% (${q.score}/${q.total}) on ${new Date(q.created_at as string).toLocaleDateString()}`
    }).join('\n')

    const masterySummary = (masteryData ?? []).map((m: Record<string, unknown>) => {
      const sub = m.subject as { name: string } | null
      return `${sub?.name ?? 'Unknown'} - "${m.topic}": ${m.mastery_level}`
    }).join('\n')

    const examSummary = (examTimetable ?? []).map((e: Record<string, unknown>) => {
      const sub = e.subject as { name: string } | null
      return `${sub?.name ?? 'Unknown'}: ${e.exam_date}`
    }).join('\n')

    const subjectNames = subjects.map((s: { name: string }) => s.name).join(', ')

    const prompt = `You are a ZIMSEC education advisor for a ${studentProfile.zimsec_level} level, ${studentProfile.grade ?? 'unknown grade'} student in Zimbabwe.

The student is enrolled in: ${subjectNames}

RECENT QUIZ RESULTS (most recent first):
${quizSummary || 'No quiz attempts yet.'}

TOPIC MASTERY LEVELS:
${masterySummary || 'No mastery data yet.'}

UPCOMING EXAMS:
${examSummary || 'No exam dates set.'}

Based on this data, generate exactly 5 personalized study recommendations. Prioritize:
1. Topics where the student scored below 50% (urgent)
2. Topics with mastery_level "not_started" or "learning" (important)
3. Subjects with upcoming exams (time-sensitive)
4. Topics not yet attempted in any enrolled subject (discovery)
5. Topics to reinforce where scores are 50-79% (reinforcement)

For each recommendation, determine the best action:
- "Start Lesson" for topics not yet started
- "Practice Quiz" for topics that need more practice
- "Review Notes" for topics with low mastery
- "Watch Video" for complex topics needing visual explanation

Respond ONLY with a valid JSON array of exactly 5 objects. No markdown, no explanation, no code fences. Each object must have:
- "subject": the subject name (string)
- "topic": specific topic name (string)
- "reason": a short, encouraging explanation for why this is recommended (string, max 80 chars)
- "priority": 1-5 where 1 is most urgent (number)
- "actionType": one of "Start Lesson", "Practice Quiz", "Watch Video", "Review Notes" (string)

Example format:
[{"subject":"Mathematics","topic":"Quadratic Equations","reason":"You scored 35% — let's strengthen this before your exam","priority":1,"actionType":"Practice Quiz"}]`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      console.error('Claude API error:', response.status, await response.text())
      // Return a sensible default path based on enrolled subjects
      return NextResponse.json({ path: buildDefaultPath(subjects) })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''

    let pathItems: PathItem[]
    try {
      pathItems = JSON.parse(text)
    } catch {
      console.error('Failed to parse Claude response:', text)
      return NextResponse.json({ path: buildDefaultPath(subjects) })
    }

    // Validate and attach actionUrls
    const path = pathItems.slice(0, 5).map((item) => {
      const matchedSubject = subjects.find(
        (s: { name: string }) => s.name.toLowerCase() === item.subject.toLowerCase()
      ) as { id: string; name: string } | undefined

      const subjectId = matchedSubject?.id ?? ''
      const encodedTopic = encodeURIComponent(item.topic)

      let actionUrl = '/student/dashboard'
      switch (item.actionType) {
        case 'Start Lesson':
          actionUrl = `/student/subjects/${subjectId}/lessons?topic=${encodedTopic}`
          break
        case 'Practice Quiz':
          actionUrl = `/student/subjects/${subjectId}/quiz?topic=${encodedTopic}`
          break
        case 'Watch Video':
          actionUrl = `/student/subjects/${subjectId}/lessons?topic=${encodedTopic}&type=video`
          break
        case 'Review Notes':
          actionUrl = `/student/subjects/${subjectId}/notes?topic=${encodedTopic}`
          break
      }

      return {
        subject: item.subject,
        topic: item.topic,
        reason: item.reason,
        priority: item.priority,
        actionType: item.actionType,
        actionUrl,
      }
    })

    return NextResponse.json({ path })
  } catch (err) {
    console.error('Adaptive path error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}

/** Fallback path when Claude API is unavailable or returns invalid data */
function buildDefaultPath(subjects: { id: string; name: string }[]): PathItem[] {
  const actions: Array<{ actionType: PathItem['actionType']; suffix: string }> = [
    { actionType: 'Start Lesson', suffix: 'lessons' },
    { actionType: 'Practice Quiz', suffix: 'quiz' },
    { actionType: 'Review Notes', suffix: 'notes' },
    { actionType: 'Start Lesson', suffix: 'lessons' },
    { actionType: 'Practice Quiz', suffix: 'quiz' },
  ]

  return subjects.slice(0, 5).map((subject, i) => ({
    subject: subject.name,
    topic: 'General Review',
    reason: 'Start here to build a strong foundation in this subject',
    priority: i + 1,
    actionType: actions[i % actions.length].actionType,
    actionUrl: `/student/subjects/${subject.id}/${actions[i % actions.length].suffix}`,
  }))
}
