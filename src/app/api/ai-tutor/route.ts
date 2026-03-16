import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const {
    messages,
    subjectName,
    subjectCode,
    level,
  }: {
    messages: { role: 'user' | 'assistant'; content: string }[]
    subjectName: string
    subjectCode: string
    level: string
  } = await req.json()

  const levelLabel =
    level === 'primary' ? 'Primary' : level === 'olevel' ? 'O-Level' : 'A-Level'

  // Fetch published documents for this subject to inject as context
  const subjectId = await getSubjectId(supabase, subjectCode)
  let documentContext = ''
  if (subjectId) {
    const { data: docs } = await supabase
      .from('uploaded_documents')
      .select('title, document_type, year, paper_number, ai_summary, topics, extracted_text')
      .eq('subject_id', subjectId)
      .eq('moderation_status', 'published')
      .order('created_at', { ascending: false })
      .limit(3)

    if (docs && docs.length > 0) {
      const docSections = docs.map((d: {
        title: string
        document_type: string
        year: number | null
        paper_number: number | null
        ai_summary: string | null
        topics: string[] | null
        extracted_text: string | null
      }) => {
        const typeLabel = d.document_type === 'past_paper' ? 'Past Exam Paper'
          : d.document_type === 'marking_scheme' ? 'Marking Scheme'
          : d.document_type === 'notes' ? 'Study Notes'
          : d.document_type === 'textbook' ? 'Textbook'
          : 'Resource'
        const yearInfo = d.year ? ` (${d.year}${d.paper_number ? ` Paper ${d.paper_number}` : ''})` : ''
        let section = `**${typeLabel}: ${d.title}${yearInfo}**\n`
        if (d.ai_summary) section += `Summary: ${d.ai_summary}\n`
        if (d.topics && d.topics.length > 0) section += `Key topics: ${d.topics.join(', ')}\n`
        if (d.extracted_text) {
          // Include first 1500 chars of extracted text for grounding
          const textSnippet = d.extracted_text.slice(0, 1500).trim()
          if (textSnippet) section += `Content excerpt:\n${textSnippet}${d.extracted_text.length > 1500 ? '…' : ''}\n`
        }
        return section
      }).join('\n---\n')

      documentContext = `\n\n## Real ZIMSEC Materials Available\nYou have access to the following authentic ZIMSEC materials uploaded for ${subjectName}. Reference these when relevant:\n\n${docSections}\n\nWhen answering questions, prioritise information from these real materials over general knowledge.`
    }
  }

  const system = `You are EduZim AI — an expert ZIMSEC ${levelLabel} tutor specialising in ${subjectName} (subject code: ${subjectCode}), built specifically for Zimbabwean students.

## Your Purpose
Help every Zimbabwean student pass their ZIMSEC examinations. Zimbabwe's O-Level pass rate is 35% — your job is to change that, one student at a time.

## How You Teach
- Always align explanations to the official ZIMSEC ${levelLabel} syllabus for ${subjectName}
- Teach exactly how ZIMSEC examiners expect topics to be answered — reference command words (describe, explain, discuss, calculate, state), mark allocation, and marking scheme logic
- Use Zimbabwean examples, contexts, and references wherever possible (local places, names, currencies in USD, local businesses, events)
- Break every topic into: (1) Core concept, (2) Worked example, (3) Common exam mistakes to avoid
- For Mathematics/Sciences: show ALL working step by step with clear layout — ZIMSEC marks working, not just the answer
- For Humanities/Languages: model ZIMSEC essay and structured question technique — intro, body points with evidence, conclusion
- If a student is struggling, try a completely different angle — analogy, diagram description, simpler vocabulary

## Exam Focus
- Always relate what you're teaching to how it appears in ZIMSEC past papers
- When relevant, mention which topics are "high-frequency" in ZIMSEC exams
- Teach mark-scoring technique: "For 2 marks, you need X and Y. For 4 marks, add Z."
- Warn about common ZIMSEC examiner pitfalls — misread command words, incomplete working, wrong units

## Tone
Warm, patient, encouraging. Many students have been told they are not clever enough — prove them wrong. Never make a student feel bad for not knowing something. Celebrate effort and progress.

## Format
- Use markdown for clarity: headings, bold key terms, numbered steps for calculations
- Keep responses focused and not overwhelming — if a topic is large, offer to break it into parts
- End responses with a short comprehension check or practice question when appropriate${documentContext}`

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: 'claude-opus-4-6',
          max_tokens: 8192,
          thinking: { type: 'adaptive' },
          system,
          messages,
        })

        let assistantText = ''

        for await (const event of stream) {
          if (event.type === 'content_block_delta') {
            if (event.delta.type === 'text_delta') {
              assistantText += event.delta.text
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`
                )
              )
            }
            // thinking_delta: skip (don't expose reasoning to student)
          }
        }

        // Persist assistant turn to DB (best-effort)
        if (assistantText) {
          await supabase.from('ai_chat_messages').insert({
            user_id: user.id,
            subject_id: subjectId,
            role: 'assistant',
            content: assistantText,
          })
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

// Save user message to DB before streaming (call from client)
export async function PUT(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { content, subjectCode } = await req.json()

  const subjectId = await getSubjectId(supabase, subjectCode)
  if (subjectId) {
    await supabase.from('ai_chat_messages').insert({
      user_id: user.id,
      subject_id: subjectId,
      role: 'user',
      content,
    })
  }

  return new Response('OK')
}

async function getSubjectId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  subjectCode: string
): Promise<string | null> {
  const { data } = await supabase
    .from('subjects')
    .select('id')
    .eq('code', subjectCode)
    .single()
  return data?.id ?? null
}
