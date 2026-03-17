import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subjectName, level, question, markingPoints, modelAnswer, studentAnswer, marks } = await req.json()

  // Security: sanitize all fields injected into the Claude prompt to prevent prompt injection
  const safeSubjectName = String(subjectName ?? '').slice(0, 100).replace(/[\r\n]/g, ' ')
  const safeLevel = ['olevel', 'alevel', 'primary'].includes(level) ? level : 'olevel'
  const safeQuestion = String(question ?? '').slice(0, 2000)
  const safeMarks = typeof marks === 'number' ? Math.max(1, Math.min(Math.floor(marks), 50)) : 5
  const safeModelAnswer = String(modelAnswer ?? '').slice(0, 2000)
  const safeStudentAnswer = String(studentAnswer ?? '').slice(0, 3000)
  // Cap marking points: max 20 items, each max 200 chars, strip newlines (prompt injection prevention)
  const safeMarkingPoints: string[] = Array.isArray(markingPoints)
    ? markingPoints.slice(0, 20).map((p: unknown) => String(p ?? '').slice(0, 200).replace(/[\r\n]/g, ' '))
    : []

  const levelLabel = safeLevel === 'olevel' ? 'O-Level' : safeLevel === 'alevel' ? 'A-Level' : 'Primary'

  const prompt = `You are a ZIMSEC ${levelLabel} ${safeSubjectName} examiner marking a student's response.

QUESTION (${safeMarks} marks):
${safeQuestion}

MARKING SCHEME (${safeMarks} points — 1 mark each unless stated):
${safeMarkingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

MODEL ANSWER (examiner reference):
${safeModelAnswer}

STUDENT'S ANSWER:
${safeStudentAnswer || '(No answer provided — 0 marks)'}

Apply ZIMSEC marking principles:
- Award marks for each valid marking point the student addresses
- Accept equivalent responses that show understanding
- For calculations: award marks for correct method even if final answer is wrong (error carried forward)
- For essays: assess quality of argument, use of subject terminology, and depth of knowledge
- Do NOT award marks for irrelevant or factually incorrect statements

Return ONLY valid JSON (no markdown) in this format:
{
  "marksAwarded": <number 0 to ${marks}>,
  "pointsAwarded": ["point 1 that was addressed", "point 2 that was addressed"],
  "pointsMissed": ["point that was missed or wrong"],
  "feedback": "2-3 sentence examiner feedback explaining the mark awarded and what to improve",
  "grade": "<A|B|C|D|E|U based on percentage: A=75%+, B=60%+, C=50%+, D=40%+, E=30%+, U=below 30%>",
  "marksAvailable": ${safeMarks}
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleaned)

    return NextResponse.json(result)
  } catch (err) {
    console.error('Marking error:', err)
    return NextResponse.json({ error: 'Failed to mark answer' }, { status: 500 })
  }
}
