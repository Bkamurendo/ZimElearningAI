import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subjectName, level, question, markingPoints, modelAnswer, studentAnswer, marks } = await req.json()

  const levelLabel = level === 'olevel' ? 'O-Level' : level === 'alevel' ? 'A-Level' : 'Primary'

  const prompt = `You are a ZIMSEC ${levelLabel} ${subjectName} examiner marking a student's response.

QUESTION (${marks} marks):
${question}

MARKING SCHEME (${marks} points — 1 mark each unless stated):
${markingPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}

MODEL ANSWER (examiner reference):
${modelAnswer}

STUDENT'S ANSWER:
${studentAnswer || '(No answer provided — 0 marks)'}

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
  "grade": "<A|B|C|D|E|U based on percentage: A=75%+, B=60%+, C=50%+, D=40%+, E=30%+, U=below 30%>"
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
