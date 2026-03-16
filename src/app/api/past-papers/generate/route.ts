import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { subjectCode, subjectName, level, year, paperNumber } = await req.json()

  const levelLabel = level === 'olevel' ? 'O-Level' : level === 'alevel' ? 'A-Level' : 'Primary'
  const simYear = year || 2023

  const prompt = `Generate a ZIMSEC ${levelLabel} ${subjectName} past paper (Paper ${paperNumber || 1}) in the style of ${simYear} examination.

Create 4 structured questions with a mix of short answer and extended response.
Total marks: 80
Time allocation: 2 hours 30 minutes

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "paperTitle": "ZIMSEC ${levelLabel} ${subjectName} Paper ${paperNumber || 1} (${simYear} Style)",
  "totalMarks": 80,
  "timeMinutes": 150,
  "instructions": "Answer ALL questions. Show all working where applicable. Marks are shown in brackets.",
  "questions": [
    {
      "number": 1,
      "topic": "Topic name",
      "parts": [
        {
          "part": "a",
          "question": "Question text here...",
          "marks": 4,
          "markingPoints": ["Mark point 1", "Mark point 2", "Mark point 3", "Mark point 4"],
          "modelAnswer": "Ideal answer text for examiner reference"
        }
      ]
    }
  ]
}

Requirements:
- Questions must be authentic ZIMSEC style with command words (describe, explain, calculate, discuss, evaluate, compare, etc.)
- Each question should have 2-3 parts (a, b, c)
- Marks per part: 2-6 marks for short answer, 8-12 marks for extended writing
- Total marks across all questions = 80
- Include realistic marking scheme points (one point per mark)
- For calculation questions, show the working in modelAnswer
- Content must align with the current ZIMSEC ${levelLabel} ${subjectName} syllabus`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const paper = JSON.parse(cleaned)

    return NextResponse.json({ paper })
  } catch (err) {
    console.error('Past paper generation error:', err)
    return NextResponse.json({ error: 'Failed to generate past paper' }, { status: 500 })
  }
}
