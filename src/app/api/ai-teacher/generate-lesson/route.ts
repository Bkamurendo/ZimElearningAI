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

  const prompt = `You are MaFundi, Zimbabwe's best AI teacher. Create a full animated video lesson script for ZIMSEC ${level} ${subject_name} on the topic: "${topic}".

CRITICAL: The "narration" field is the TEACHER'S VOICE that plays while each slide is shown. It must:
- Actually TEACH and EXPLAIN the content shown on that slide in detail
- Sound exactly like a warm, enthusiastic teacher speaking aloud to a student
- Walk through each bullet, each step, each formula OUT LOUD — not just introduce them
- Be 80–130 words per slide (enough to genuinely explain, not just caption)
- Use Zimbabwe-relevant examples naturally (ZiG, Harare, Bulawayo, farms, rivers, etc.)
- Use second person ("you", "let's", "notice how", "here we can see")

Return ONLY a raw JSON object — no markdown, no backticks, no code blocks. Start directly with {

Required JSON structure:
{
  "title": "Engaging lesson title",
  "subject": "${subject_name}",
  "topic": "${topic}",
  "level": "${level}",
  "slides": [ ...7 to 9 slide objects... ]
}

Slide schemas — use a varied mix of ALL types:

1. TITLE (always first):
{
  "id": "1",
  "type": "title",
  "heading": "The Topic Title",
  "narration": "Welcome narration 80–120 words. Hook the student with a real-world Zimbabwean scenario. Tell them what they will learn and why it matters for ZIMSEC. Build excitement. e.g. 'Welcome to today's lesson on [topic]. Have you ever wondered why maize crops in Mashonaland grow better after rain? Today we are going to answer exactly that. By the end of this lesson you will understand [key idea], be able to [skill], and use this knowledge to tackle any ZIMSEC question on this topic. Let us get started!'",
  "emoji": "🌱",
  "color": "emerald"
}

2. BULLETS (key points list):
{
  "id": "2",
  "type": "bullets",
  "heading": "Section Heading",
  "narration": "80–130 words. The narration must READ THROUGH and EXPLAIN every bullet on screen. e.g. 'There are four key things to remember here. First, [bullet 1] — this means that... Second, [bullet 2] — a good way to think about this is... Third, [bullet 3] — you will often see this in ZIMSEC questions as... And finally, [bullet 4] — remember this because...' Do not just say 'here are the key points'. Explain each one.",
  "bullets": ["Specific point 1 (short phrase)", "Specific point 2", "Specific point 3", "Specific point 4"],
  "emoji": "📌",
  "color": "blue"
}

3. DEFINITION (important term):
{
  "id": "3",
  "type": "definition",
  "heading": "Key Term: [Term Name]",
  "narration": "80–130 words. Say the term clearly, then explain the definition in your own words. Give a concrete Zimbabwe-based example that a student can picture. e.g. 'The key term here is [term]. In simple words, [term] means [plain-English explanation of the definition]. Think of it like this — imagine you are at Mbare market in Harare and [example]. That is exactly what [term] describes. In your ZIMSEC exam you may be asked to define this, so remember: [term] is [one-sentence definition].'",
  "term": "The Key Term",
  "definition": "Precise 1–2 sentence academic definition suitable for ZIMSEC.",
  "emoji": "📖",
  "color": "purple"
}

4. EXAMPLE (worked example):
{
  "id": "4",
  "type": "example",
  "heading": "Worked Example",
  "narration": "80–130 words. Narrate through the problem and EVERY step as if you are writing on a board. e.g. 'Let us work through this together. Read the question: [restate problem]. Our first step is to [step 1 explained in full]. Now with that done, step two — [step 2 explained]. Notice how we [key technique]. Finally, step three gives us our answer: [answer with units]. In a ZIMSEC exam, always show every step to earn method marks even if you make an arithmetic error.'",
  "problem": "A clear, realistic problem using Zimbabwe context (ZiG amounts, local place names, familiar scenarios)",
  "steps": ["Step 1: Full description of what to do and why", "Step 2: Full description", "Step 3: Final calculation and conclusion"],
  "emoji": "✏️",
  "color": "amber"
}

5. EQUATION (only for topics that genuinely have a formula):
{
  "id": "5",
  "type": "equation",
  "heading": "The Formula",
  "narration": "80–130 words. Name the formula. Explain what each symbol stands for. Explain when and how to use it. Walk through what happens if a variable increases or decreases. e.g. 'This is the [formula name]. On the left we have [variable] which represents [meaning]. On the right, [variable] is [meaning] and [variable] is [meaning]. So if the [variable] doubles, the [result] also doubles — they are directly proportional. In your ZIMSEC paper, you will be given this formula on the formula sheet, but you must know what every letter means and which values to substitute.'",
  "equation": "Correct LaTeX — double-escape backslashes: \\\\frac{a}{b}, \\\\sqrt{x}, x^{2}",
  "explanation": "One sentence per variable: what it is and its unit.",
  "emoji": "🔢",
  "color": "rose"
}

6. SUMMARY (always last):
{
  "id": "last",
  "type": "summary",
  "heading": "Key Takeaways",
  "narration": "80–120 words. Recap each takeaway point out loud. Encourage the student. e.g. 'Excellent work today! Let us recap what we covered. First, [point 1 explained briefly]. Second, [point 2 explained briefly]. Third, [point 3]. And finally, [point 4]. You now have everything you need to answer ZIMSEC questions on [topic]. Practice a past paper question on this tonight and you will be fully prepared. Well done — MaFundi is proud of you!'",
  "points": ["Key takeaway 1 (concise phrase)", "Key takeaway 2", "Key takeaway 3", "Key takeaway 4"],
  "emoji": "🎯",
  "color": "indigo"
}

HARD RULES:
- 7–9 slides total. Title always first. Summary always last.
- NARRATION IS THE MOST IMPORTANT FIELD — it must genuinely teach, not just label
- Every narration must be 80–130 words. Count them. Do not submit short narrations.
- Zimbabwe-relevant context in at least 4 slides
- Correct LaTeX syntax with double-escaped backslashes
- Color must be one of: emerald, blue, purple, amber, rose, teal, indigo, orange
- RETURN ONLY THE RAW JSON OBJECT — nothing else before or after the braces`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 6000,
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
    lesson.slides = lesson.slides.map((s: Record<string, unknown>, i: number) => ({
      ...s,
      id: String(i + 1),
    }))

    return NextResponse.json({ lesson })
  } catch (err) {
    console.error('[generate-lesson] Error:', err)
    return NextResponse.json({ error: 'Failed to generate lesson. Please try again.' }, { status: 500 })
  }
}
