import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Subject categories for mode-specific prompting
const CALC_SUBJECTS = ['mathematics', 'physics', 'chemistry', 'accounting', 'additional mathematics', 'statistics']
const isCalcSubject = (name: string) => CALC_SUBJECTS.some(s => name.toLowerCase().includes(s))

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const {
    question,
    subjectName,
    subjectCode,
    level,
    mode,
    documentContext,
    studentAnswer,
  }: {
    question: string
    subjectName: string
    subjectCode: string
    level: string
    mode: 'step_by_step' | 'essay' | 'explain' | 'mark_answer'
    documentContext?: string
    studentAnswer?: string
  } = await req.json()

  const levelLabel = level === 'primary' ? 'Primary' : level === 'olevel' ? 'O-Level' : 'A-Level'
  const isCalc = isCalcSubject(subjectName)

  // Mode-specific system prompts
  const modePrompts: Record<string, string> = {
    step_by_step: isCalc
      ? `## Step-by-Step Calculation Mode
Solve this problem with COMPLETE working shown. Format:

**Step 1: [What you are doing]**
[Calculation or reasoning]
= [Result]

**Step 2: [Next step]**
...

**∴ Final Answer: [boxed answer with units]**

After the solution, state:
"**ZIMSEC mark allocation:** This question would typically award marks for: [list each mark-worthy step]"

Use unicode math symbols: ÷ × √ ∴ ∵ ≠ ≈ ≤ ≥ → π Σ`
      : `## Step-by-Step Analysis Mode
Break down this question systematically:

**Step 1: Understand the question**
[Identify command word and what is being asked]

**Step 2: Key information / context**
[List relevant facts, definitions, or evidence]

**Step 3: Development**
[Analysis, argument, or explanation with evidence]

**Step 4: Conclusion**
[Summary answer that directly addresses the question]

**ZIMSEC marking:** [How marks would be awarded]`,

    essay: `## Essay / Structured Answer Mode
Structure your response as a ZIMSEC model answer:

**Introduction** (1-2 sentences directly addressing the question)

**Main Body**
- Point 1: [State the point] + [Explain/develop] + [Evidence/example]
- Point 2: ...
- Point 3: ...

**Conclusion** (Summarise argument, directly answer the question)

**ZIMSEC Examiner Tips:** [Common mistakes to avoid, what earns marks]`,

    explain: `## Concept Explanation Mode
Explain this concept clearly for a ZIMSEC student:

1. **Core Definition** — What it is in simple terms
2. **Why It Matters** — Relevance to ZIMSEC syllabus and real life
3. **Worked Example** — Show how it applies in practice
4. **Common Exam Questions** — How ZIMSEC typically tests this
5. **Memory Aid** — A tip, mnemonic, or shortcut to remember it`,

    mark_answer: `## Mark My Answer Mode
You are a ZIMSEC examiner. Assess the student's answer against the question.

**Marking:**
- ✅ [Each mark-worthy point found in the student's answer]
- ❌ [Key points that were missed]

**Score: X / Y marks** (estimate based on ZIMSEC marking standards)

**Grade: [A/B/C/D/E/U]** (using ZIMSEC percentage bands)

**Detailed Feedback:**
[Specific, constructive feedback on what was good and what to improve]

**Model Answer Key Points:**
[List the points that a top student would include]`,
  }

  // Build document context if provided
  const docSection = documentContext
    ? `\n\nRELEVANT DOCUMENT CONTEXT:\n${documentContext}\n`
    : ''

  const system = `You are EduZim AI — Zimbabwe's expert ZIMSEC ${levelLabel} tutor specialising in ${subjectName} (${subjectCode}).

Your mission: Help every Zimbabwean student pass their ZIMSEC exams by solving problems with full, ZIMSEC-aligned working.
${docSection}
${modePrompts[mode] || modePrompts.explain}

Always:
- Use Zimbabwean examples and contexts where relevant
- Reference ZIMSEC command words and marking conventions
- Format with clear markdown (headings, bold, numbered steps)
- Be encouraging and patient`

  // Build messages
  const userContent = mode === 'mark_answer' && studentAnswer
    ? `QUESTION:\n${question}\n\nSTUDENT'S ANSWER:\n${studentAnswer}`
    : question

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: 'claude-opus-4-6',
          max_tokens: 4096,
          thinking: { type: 'adaptive' },
          system,
          messages: [{ role: 'user', content: userContent }],
        })

        for await (const event of stream) {
          if (event.type === 'content_block_delta') {
            if (event.delta.type === 'text_delta') {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`
                )
              )
            }
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Stream error'
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`)
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
