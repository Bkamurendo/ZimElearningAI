import { type NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { topic, subject_name, level = 'O-Level' } = await req.json()

  if (!topic?.trim() || !subject_name) {
    return NextResponse.json({ error: 'Subject and topic are required' }, { status: 400 })
  }

  const prompt = `Create an animated video lesson script for ZIMSEC ${level} ${subject_name} on the topic: "${topic}".

Return ONLY a raw JSON object — absolutely no markdown, no backticks, no code blocks. Start directly with the opening brace {.

Required JSON structure:
{
  "title": "Engaging lesson title",
  "subject": "${subject_name}",
  "topic": "${topic}",
  "level": "${level}",
  "slides": [ ...7 to 9 slide objects... ]
}

Slide object schemas — use a varied mix of ALL types:

1. TITLE (always the first slide):
{"id":"1","type":"title","heading":"Topic Title","narration":"Friendly welcome, max 45 words. Use a relevant Zimbabwean example to hook the student.","emoji":"🌱","color":"emerald"}

2. BULLETS (key points list):
{"id":"2","type":"bullets","heading":"Section Heading","narration":"Narration max 45 words","bullets":["Clear point 1","Clear point 2","Clear point 3","Clear point 4"],"emoji":"📌","color":"blue"}

3. DEFINITION (important term):
{"id":"3","type":"definition","heading":"Key Term","narration":"Narration max 45 words","term":"The Term","definition":"A clear, complete 1-2 sentence definition. Include a Zimbabwean example where possible.","emoji":"📖","color":"purple"}

4. EXAMPLE (worked example):
{"id":"4","type":"example","heading":"Worked Example","narration":"Narration max 45 words","problem":"State the problem in one clear sentence, using Zimbabwe-relevant context (ZiG currency, local farms, Harare, etc.)","steps":["Step 1: describe action","Step 2: describe action","Step 3: final answer"],"emoji":"✏️","color":"amber"}

5. EQUATION (maths or science formula — only include if the topic genuinely has a formula):
{"id":"5","type":"equation","heading":"The Formula","narration":"Narration max 45 words","equation":"Valid LaTeX string e.g. A = \\\\pi r^2","explanation":"Brief explanation of each variable in plain English","emoji":"🔢","color":"rose"}

6. SUMMARY (always the last slide):
{"id":"last","type":"summary","heading":"Key Takeaways","narration":"Encouraging closing narration, max 45 words","points":["Concise takeaway 1","Concise takeaway 2","Concise takeaway 3","Concise takeaway 4"],"emoji":"🎯","color":"indigo"}

Hard rules:
- 7–9 slides total. Title is always first. Summary is always last.
- Include Zimbabwe-relevant context in at least 3 slides (ZiG, Harare, Bulawayo, Great Zimbabwe, Limpopo, local agriculture, etc.)
- Narration must sound like a warm, encouraging teacher speaking — not a textbook
- Use correct LaTeX syntax (double-escape backslashes: \\\\frac, \\\\sqrt, etc.)
- Color must be one of: emerald, blue, purple, amber, rose, teal, indigo, orange
- RETURN ONLY THE JSON OBJECT — no other text whatsoever`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    let rawText = ((message.content[0] as { text: string }).text ?? '').trim()

    // Strip markdown code fences if Claude wrapped it anyway
    rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()

    // Find outermost JSON object
    const jsonStart = rawText.indexOf('{')
    const jsonEnd = rawText.lastIndexOf('}')
    if (jsonStart !== -1 && jsonEnd !== -1) {
      rawText = rawText.slice(jsonStart, jsonEnd + 1)
    }

    const lesson = JSON.parse(rawText)

    if (!lesson.slides || !Array.isArray(lesson.slides) || lesson.slides.length === 0) {
      throw new Error('Invalid lesson structure from AI')
    }

    // Ensure IDs are strings and sequential for safety
    lesson.slides = lesson.slides.map((s: Record<string, unknown>, i: number) => ({ ...s, id: String(i + 1) }))

    return NextResponse.json({ lesson })
  } catch (err) {
    console.error('[generate-lesson] Error:', err)
    return NextResponse.json({ error: 'Failed to generate lesson. Please try again.' }, { status: 500 })
  }
}
