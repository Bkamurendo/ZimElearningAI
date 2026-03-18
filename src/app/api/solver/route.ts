import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { checkAIQuota } from '@/lib/ai-quota'

export const maxDuration = 90

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Subject categories for mode-specific prompting
const CALC_SUBJECTS = ['mathematics', 'physics', 'chemistry', 'accounting', 'additional mathematics', 'statistics']
const isCalcSubject = (name: string) => CALC_SUBJECTS.some(s => name.toLowerCase().includes(s))

// 15 solver requests per user per minute
const RATE_LIMIT = { limit: 15, windowSecs: 60 }

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const rl = checkRateLimit(`solver:${user.id}`, RATE_LIMIT)
  if (!rl.success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: rateLimitHeaders(rl, RATE_LIMIT.limit),
    })
  }

  const quota = await checkAIQuota(supabase, user.id)
  if (!quota.allowed) {
    return new Response(
      `data: ${JSON.stringify({ type: 'error', message: `Daily AI limit reached (${quota.used}/${quota.limit}). Resets at midnight UTC.` })}\n\ndata: [DONE]\n\n`,
      { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } }
    )
  }

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

  // Security: sanitize all user-supplied fields injected into system prompt
  const safeSubjectName = String(subjectName ?? '').slice(0, 100).replace(/[\r\n]/g, ' ')
  const safeSubjectCode = String(subjectCode ?? '').slice(0, 20).replace(/[^A-Z0-9\s]/gi, '')
  const safeLevel = ['primary', 'olevel', 'alevel'].includes(level) ? level : 'olevel'
  const safeMode = ['step_by_step', 'essay', 'explain', 'mark_answer'].includes(mode) ? mode : 'explain'
  // documentContext comes from the client — strip any injection attempts, cap at 3000 chars
  const safeDocumentContext = documentContext
    ? String(documentContext).slice(0, 3000).replace(/\[INST\]|\[\/INST\]|<\|system\|>|<\|user\|>/gi, '')
    : undefined

  const levelLabel = safeLevel === 'primary' ? 'Primary' : safeLevel === 'olevel' ? 'O-Level' : 'A-Level'
  const isCalc = isCalcSubject(safeSubjectName)

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

  // Build document context if provided (using sanitized value)
  const docSection = safeDocumentContext
    ? `\n\nRELEVANT DOCUMENT CONTEXT:\n${safeDocumentContext}\n`
    : ''

  const system = `You are EduZim AI — Zimbabwe's expert ZIMSEC ${levelLabel} tutor specialising in ${safeSubjectName} (${safeSubjectCode}).

Your mission: Help every Zimbabwean student pass their ZIMSEC exams by solving problems with full, ZIMSEC-aligned working.
${docSection}
${modePrompts[safeMode] || modePrompts.explain}

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
          model: 'claude-sonnet-4-5',
          max_tokens: 4096,
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
        console.error('[solver] Anthropic stream error:', msg)
        const friendly = msg.includes('credit balance') || msg.includes('billing')
          ? 'AI credits exhausted. Please check your Anthropic billing at console.anthropic.com.'
          : msg.includes('API key') || msg.includes('auth') || msg.includes('401')
          ? 'AI service authentication failed. Please check ANTHROPIC_API_KEY in your Vercel environment variables.'
          : msg.includes('overloaded') || msg.includes('529')
          ? 'AI service is temporarily busy. Please try again in a moment.'
          : msg
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: friendly })}\n\n`)
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
