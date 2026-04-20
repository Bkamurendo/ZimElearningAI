export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { checkAIQuota, getUserPlan, isPaidPlan } from '@/lib/ai-quota'

export const maxDuration = 60
import crypto from 'crypto'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// 5 grade predictions per user per minute (data-heavy)
const RATE_LIMIT = { limit: 5, windowSecs: 60 }

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(`grade-predictor:${user.id}`, RATE_LIMIT)
  if (!rl.success) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${rl.retryAfterSecs}s.` },
      { status: 429, headers: rateLimitHeaders(rl, RATE_LIMIT.limit) }
    )
  }

  const plan = await getUserPlan(supabase, user.id)
  if (!isPaidPlan(plan)) {
    return NextResponse.json(
      { error: 'Grade Predictor is a premium feature. Upgrade to Starter or Pro to access it.' },
      { status: 403 }
    )
  }

  const quota = await checkAIQuota(supabase, user.id)
  if (!quota.allowed) {
    return NextResponse.json({
      error: `Daily AI limit reached (${quota.used}/${quota.limit}). Resets at midnight UTC. Upgrade to Pro for unlimited access.`,
      quota,
    }, { status: 429 })
  }

  const { subjectId, subjectName, level } = await req.json()

  // Security: always use the authenticated user's own student profile — never trust a client-supplied studentId
  const { data: ownStudentProfile } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
  const studentId = ownStudentProfile?.id ?? null
  if (!studentId) {
    return NextResponse.json({ error: 'Student profile not found for this account' }, { status: 404 })
  }

  // Cache key: hash of student + subject + level
  const cacheKey = crypto.createHash('md5').update(`grade-predictor:${user.id}:${subjectId}:${level}`).digest('hex')

  // Check cache (6 hour TTL)
  const { data: cached } = await supabase
    .from('ai_cache')
    .select('response, expires_at')
    .eq('cache_key', cacheKey)
    .single()

  if (cached && new Date(cached.expires_at) > new Date()) {
    return NextResponse.json({ ...cached.response, cached: true })
  }

  // Gather all performance data for this subject
  const [
    { data: quizAttempts },
    { data: masteryData },
    { data: streakData },
    { data: lessonProgress },
    { count: totalLessons },
  ] = await Promise.all([
    supabase
      .from('quiz_attempts')
      .select('score, total, topic, created_at')
      .eq('student_id', studentId)
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: true }),
    supabase
      .from('topic_mastery')
      .select('topic, mastery_level, updated_at')
      .eq('student_id', studentId)
      .eq('subject_id', subjectId),
    supabase
      .from('student_streaks')
      .select('current_streak, longest_streak, total_xp')
      .eq('student_id', studentId)
      .single(),
    supabase
      .from('lesson_progress')
      .select('id')
      .eq('student_id', studentId),
    supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', subjectId),
  ])

  if (!quizAttempts || quizAttempts.length === 0) {
    return NextResponse.json({
      error: 'Not enough data to predict grade. Complete at least one quiz first.',
    }, { status: 400 })
  }

  // Calculate trajectory: compare first half vs second half of attempts
  const half = Math.ceil(quizAttempts.length / 2)
  const firstHalf = quizAttempts.slice(0, half)
  const secondHalf = quizAttempts.slice(half)
  const avgFirst = firstHalf.reduce((s, a) => s + (a.score / a.total), 0) / firstHalf.length
  const avgSecond = secondHalf.length > 0
    ? secondHalf.reduce((s, a) => s + (a.score / a.total), 0) / secondHalf.length
    : avgFirst
  const trajectory = avgSecond > avgFirst + 0.05 ? 'improving' : avgSecond < avgFirst - 0.05 ? 'declining' : 'stable'

  const levelLabel = level === 'olevel' ? 'O-Level' : level === 'alevel' ? 'A-Level' : 'Primary'

  const masteryCount = {
    mastered: masteryData?.filter(m => m.mastery_level === 'mastered').length ?? 0,
    competent: masteryData?.filter(m => m.mastery_level === 'competent').length ?? 0,
    learning: masteryData?.filter(m => m.mastery_level === 'learning').length ?? 0,
    not_started: masteryData?.filter(m => m.mastery_level === 'not_started').length ?? 0,
  }
  const weakTopics = masteryData?.filter(m => m.mastery_level === 'learning').map(m => m.topic) ?? []
  const strongTopics = masteryData?.filter(m => m.mastery_level === 'mastered').map(m => m.topic) ?? []

  const overallAvg = quizAttempts.reduce((s, a) => s + (a.score / a.total), 0) / quizAttempts.length
  const streak = (streakData as { current_streak: number; longest_streak: number; total_xp: number } | null)

  const prompt = `You are an expert ZIMSEC ${levelLabel} academic advisor predicting a student's exam grade for ${subjectName}.

STUDENT PERFORMANCE DATA:
- Total quiz attempts: ${quizAttempts.length}
- Overall average score: ${Math.round(overallAvg * 100)}%
- Performance trajectory: ${trajectory} (${Math.round(avgFirst * 100)}% early → ${Math.round(avgSecond * 100)}% recent)
- Topics mastered: ${masteryCount.mastered}
- Topics competent: ${masteryCount.competent}
- Topics still learning: ${masteryCount.learning}
- Strong topics: ${strongTopics.join(', ') || 'none yet'}
- Weak topics needing work: ${weakTopics.join(', ') || 'none identified'}
- Study streak: ${streak?.current_streak ?? 0} days current, ${streak?.longest_streak ?? 0} days best
- Lessons completed: ${lessonProgress?.length ?? 0} of ${totalLessons ?? '?'}

ZIMSEC GRADING SCALE:
- A (Distinction): 75-100% — Exceptional understanding
- B (Merit): 60-74% — Good understanding
- C (Credit): 50-59% — Satisfactory understanding
- D (Pass): 40-49% — Basic understanding
- E (Pass): 30-39% — Minimum pass
- U (Ungraded): Below 30% — Insufficient

Based on this data, provide a grade prediction. Return ONLY valid JSON (no markdown):
{
  "predictedGrade": "A|B|C|D|E|U",
  "confidence": "high|medium|low",
  "predictedPercentage": <estimated exam score as integer 0-100>,
  "reasoning": "2-3 sentence explanation of why this grade was predicted, referencing the specific data",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["specific action 1", "specific action 2", "specific action 3"],
  "gradeToAchieve": {
    "A": "what they need to do to achieve/maintain A",
    "B": "what they need to do to achieve B if below",
    "C": "minimum requirement to pass with C"
  },
  "examReadiness": <integer 0-100 representing overall readiness for ZIMSEC exam>
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const prediction = JSON.parse(cleaned)

    // Save to cache (6 hours)
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
    await supabase.from('ai_cache').upsert(
      { cache_key: cacheKey, user_id: user.id, route: 'grade-predictor', response: prediction, generated_at: new Date().toISOString(), expires_at: expiresAt },
      { onConflict: 'cache_key' }
    )

    return NextResponse.json(prediction)
  } catch (err) {
    console.error('Grade predictor error:', err)
    return NextResponse.json({ error: 'Failed to generate prediction' }, { status: 500 })
  }
}
