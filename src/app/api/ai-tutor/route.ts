import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { checkAIQuota } from '@/lib/ai-quota'
import { embedText } from '@/lib/openai'

export const maxDuration = 90

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// 20 AI-tutor requests per user per minute
const RATE_LIMIT = { limit: 20, windowSecs: 60 }

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const rl = checkRateLimit(`ai-tutor:${user.id}`, RATE_LIMIT)
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
    messages: rawMessages,
    subjectName,
    subjectCode,
    level,
  }: {
    messages: { role: 'user' | 'assistant'; content: string }[]
    subjectName: string
    subjectCode: string
    level: string
  } = await req.json()

  // Security: sanitize subject fields injected into system prompt (prompt injection prevention)
  const safeSubjectName = String(subjectName ?? '').slice(0, 100).replace(/[\r\n]/g, ' ')
  const safeSubjectCode = String(subjectCode ?? '').slice(0, 20).replace(/[^A-Z0-9\s]/gi, '')
  const safeLevel = ['primary', 'olevel', 'alevel'].includes(level) ? level : 'olevel'

  // Security: cap conversation history — prevents token abuse and fake-assistant message injection.
  // Only accept 'user'/'assistant' roles; cap each message at 4000 chars; max 20 turns.
  const messages = (Array.isArray(rawMessages) ? rawMessages : [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-20)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: String(m.content ?? '').slice(0, 4000) }))

  const levelLabel =
    safeLevel === 'primary' ? 'Primary' : safeLevel === 'olevel' ? 'O-Level' : 'A-Level'

  // Fetch relevant document chunks via semantic search, falling back to recency
  const subjectId = await getSubjectId(supabase, subjectCode)
  let documentContext = ''

  const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0]?.content ?? ''

  if (subjectId && lastUserMessage) {
    const chunks = await getRelevantChunks(supabase, lastUserMessage, subjectId)

    if (chunks.length > 0) {
      // Group chunks by document for cleaner context
      const byDoc = new Map<string, { title: string; type: string; year: number | null; snippets: string[] }>()
      for (const chunk of chunks) {
        if (!byDoc.has(chunk.document_id)) {
          byDoc.set(chunk.document_id, {
            title: chunk.doc_title,
            type: chunk.doc_type,
            year: chunk.doc_year,
            snippets: [],
          })
        }
        byDoc.get(chunk.document_id)!.snippets.push(chunk.content)
      }

      const docSections = Array.from(byDoc.values()).map(d => {
        const typeLabel = d.type === 'past_paper' ? 'Past Exam Paper'
          : d.type === 'marking_scheme' ? 'Marking Scheme'
          : d.type === 'notes' ? 'Study Notes'
          : d.type === 'textbook' ? 'Textbook'
          : 'Resource'
        const yearInfo = d.year ? ` (${d.year})` : ''
        return `**${typeLabel}: ${d.title}${yearInfo}**\n${d.snippets.join('\n…\n')}`
      }).join('\n---\n')

      documentContext = `\n\n## Relevant ZIMSEC Materials\nThe following passages from authentic uploaded ZIMSEC materials are most relevant to the student's question. Prioritise this content in your answer:\n\n${docSections}\n\nAlways ground your answer in these materials where applicable.`
    }
  }

  const system = `You are EduZim AI — an expert ZIMSEC ${levelLabel} tutor specialising in ${safeSubjectName} (subject code: ${safeSubjectCode}), built specifically for Zimbabwean students.

## Your Purpose
Help every Zimbabwean student pass their ZIMSEC examinations. Zimbabwe's O-Level pass rate is 35% — your job is to change that, one student at a time.

## How You Teach
- Always align explanations to the official ZIMSEC ${levelLabel} syllabus for ${safeSubjectName}
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
          model: 'claude-sonnet-4-5',
          max_tokens: 8192,
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
        console.error('[ai-tutor] Anthropic stream error:', msg)
        // Surface specific Anthropic errors to the client for easier debugging
        const friendly = msg.includes('credit balance') || msg.includes('billing')
          ? 'AI credits exhausted. Please check your Anthropic billing at console.anthropic.com.'
          : msg.includes('API key') || msg.includes('auth') || msg.includes('401')
          ? 'AI service authentication failed. Please check ANTHROPIC_API_KEY in your Vercel environment variables.'
          : msg.includes('overloaded') || msg.includes('529')
          ? 'AI service is temporarily busy. Please try again in a moment.'
          : msg.includes('model') || msg.includes('400')
          ? `AI model error: ${msg}`
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

interface DocumentChunk {
  document_id: string
  content: string
  similarity: number
  doc_title: string
  doc_type: string
  doc_year: number | null
}

async function getRelevantChunks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  query: string,
  subjectId: string,
): Promise<DocumentChunk[]> {
  // If OpenAI key not configured, fall back to most recent docs
  if (!process.env.OPENAI_API_KEY) {
    const { data: docs } = await supabase
      .from('uploaded_documents')
      .select('id, title, document_type, year, extracted_text')
      .eq('subject_id', subjectId)
      .eq('moderation_status', 'published')
      .not('extracted_text', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3)

    return (docs ?? []).map((d: { id: string; title: string; document_type: string; year: number | null; extracted_text: string }) => ({
      document_id: d.id,
      content: d.extracted_text.slice(0, 1500),
      similarity: 1,
      doc_title: d.title,
      doc_type: d.document_type,
      doc_year: d.year,
    }))
  }

  try {
    const embedding = await embedText(query)
    const { data: chunks } = await supabase.rpc('match_document_chunks', {
      query_embedding: JSON.stringify(embedding),
      match_threshold: 0.4,
      match_count: 10,
      filter_subject_id: subjectId,
    })
    return (chunks ?? []) as DocumentChunk[]
  } catch {
    // Semantic search failed — fall back silently
    return []
  }
}
