import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// pdf-parse extracts text natively from PDFs — works on any page count
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse')

// Max pages the Anthropic document-block API accepts
const ANTHROPIC_PDF_PAGE_LIMIT = 100

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const {
    documentId,
    question,
    mode = 'explain',
    conversationHistory = [],
  }: {
    documentId: string
    question: string
    mode?: 'explain' | 'solve' | 'summarise' | 'examine'
    conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
  } = await req.json()

  // Fetch document (user must own it or it must be published)
  const { data: docOrNull } = await supabase
    .from('uploaded_documents')
    .select('id, title, document_type, ai_summary, extracted_text, topics, zimsec_level, year, paper_number, file_path')
    .eq('id', documentId)
    .or(`uploaded_by.eq.${user.id},moderation_status.eq.published`)
    .single()

  if (!docOrNull) return new Response('Document not found or access denied', { status: 404 })

  // Re-bind to a definitely-non-null const so TypeScript's closure analysis
  // keeps the narrowed type inside nested helper functions below.
  const doc = docOrNull

  const modeInstructions: Record<string, string> = {
    explain: 'Explain clearly, using examples from the document content. Reference specific sections when possible.',
    solve: 'Solve this step by step with complete working shown. For maths/science: number each step, show all calculations, box the final answer. For humanities: structure as Context → Analysis → Key Points → Conclusion.',
    summarise: 'Provide a structured summary. Use headings for each main section/topic. Include key definitions, formulas, dates or facts as appropriate.',
    examine: 'Analyse what ZIMSEC examiners are likely to test from this document. List high-frequency topics, typical question types, command words used, and mark allocations. Provide 3-5 practice questions a student should prepare.',
  }

  const baseSystem = `You are EduZim AI — an expert ZIMSEC tutor built for Zimbabwean students.

Mode: ${modeInstructions[mode] || modeInstructions.explain}

Guidelines:
- Ground your responses in the document content where available
- Apply ZIMSEC marking criteria: show how many marks each point would score
- Use simple, clear language appropriate for Zimbabwean students
- Format with markdown: bold key terms, use numbered steps for working, use bullet points for lists
- If the document is a past paper, treat each question seriously as ZIMSEC-style exam practice`

  const encoder = new TextEncoder()

  // ── Helper: stream events to the client ────────────────────────────────────
  async function* streamAnthropic(params: Parameters<typeof anthropic.messages.stream>[0]) {
    const stream = anthropic.messages.stream(params)
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text
      }
    }
  }

  // ── Helper: build metadata-only context ───────────────────────────────────
  function buildMetaMessages() {
    const metaContext = `
DOCUMENT: "${doc.title}"
TYPE: ${doc.document_type}${doc.year ? ` · Year: ${doc.year}` : ''}${doc.paper_number ? ` · Paper ${doc.paper_number}` : ''}
ZIMSEC LEVEL: ${doc.zimsec_level ?? 'Not specified'}
KEY TOPICS: ${doc.topics?.join(', ') || 'Not specified'}
AI SUMMARY: ${doc.ai_summary || 'No summary available'}
NOTE: Full document text is not yet available. Answer based on the metadata above and your comprehensive ZIMSEC subject knowledge.
`.trim()

    return {
      system: `${baseSystem}

You are helping with a document for which full text extraction is pending. Use the metadata below along with your expert ZIMSEC knowledge to answer as helpfully as possible.

---
${metaContext}
---`,
      messages: [
        ...conversationHistory,
        { role: 'user' as const, content: question },
      ],
    }
  }

  const readable = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk))
      const sendText = (text: string) =>
        send(`data: ${JSON.stringify({ type: 'text', text })}\n\n`)
      const sendError = (message: string) =>
        send(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
      const sendDone = () => send('data: [DONE]\n\n')

      try {
        const hasExtractedText =
          doc.extracted_text &&
          doc.extracted_text.trim().length > 0 &&
          !doc.extracted_text.includes('Text extraction failed')

        if (hasExtractedText) {
          // ── Path A: use pre-extracted text (fast, reliable) ──────────────
          const docContext = `
DOCUMENT: "${doc.title}"
TYPE: ${doc.document_type}${doc.year ? ` · Year: ${doc.year}` : ''}${doc.paper_number ? ` · Paper ${doc.paper_number}` : ''}
KEY TOPICS: ${doc.topics?.join(', ') || 'Not specified'}
SUMMARY: ${doc.ai_summary || 'No summary available'}

FULL CONTENT:
${doc.extracted_text}
`.trim()

          const system = `${baseSystem}

You are helping a student study from a specific uploaded document. Here is the document content:

---
${docContext}
---`

          for await (const text of streamAnthropic({
            model: 'claude-haiku-4-5',
            max_tokens: 4096,
            system,
            messages: [
              ...conversationHistory,
              { role: 'user', content: question },
            ],
          })) {
            sendText(text)
          }

        } else if (doc.file_path) {
          // ── Path B: download PDF and extract text with pdf-parse ──────────
          // This works for ANY page count — no Anthropic page-limit applies.
          let pathBSucceeded = false

          try {
            const { data: fileData, error: dlError } = await supabase.storage
              .from('platform-documents')
              .download(doc.file_path)

            if (!dlError && fileData) {
              const arrayBuffer = await fileData.arrayBuffer()
              const buffer = Buffer.from(arrayBuffer)

              // Try pdf-parse first (text-based PDFs, any page count)
              let rawText = ''
              let pageCount = 0
              try {
                const parsed = await pdfParse(buffer)
                rawText = parsed.text?.trim() ?? ''
                pageCount = parsed.numpages ?? 0
              } catch { /* pdf-parse failed — fall through */ }

              const isImageBased = rawText.length < Math.max(pageCount * 20, 50)

              if (!isImageBased && rawText.length > 50) {
                // Text extracted successfully — send it to Claude
                const truncated = rawText.length > 600_000
                  ? rawText.slice(0, 600_000) + '\n\n[Content truncated — document is very large]'
                  : rawText

                const docContext = `
DOCUMENT: "${doc.title}"
TYPE: ${doc.document_type}${doc.year ? ` · Year: ${doc.year}` : ''}${doc.paper_number ? ` · Paper ${doc.paper_number}` : ''}
KEY TOPICS: ${doc.topics?.join(', ') || 'Not specified'}
PAGES: ${pageCount}

FULL CONTENT:
${truncated}
`.trim()

                const system = `${baseSystem}

You are helping a student study from a specific uploaded document. Here is the full document content:

---
${docContext}
---`

                for await (const text of streamAnthropic({
                  model: 'claude-haiku-4-5',
                  max_tokens: 4096,
                  system,
                  messages: [
                    ...conversationHistory,
                    { role: 'user', content: question },
                  ],
                })) {
                  sendText(text)
                  pathBSucceeded = true
                }

              } else if (pageCount <= ANTHROPIC_PDF_PAGE_LIMIT) {
                // Image/scanned PDF small enough for Claude's document block API
                try {
                  const base64 = buffer.toString('base64')
                  const docIntroTurn = {
                    role: 'user' as const,
                    content: [
                      {
                        type: 'document' as const,
                        source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 },
                      } as { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } },
                      { type: 'text' as const, text: `This is "${doc.title}" (${doc.document_type}). Use its content to answer the student.` },
                    ],
                  }
                  const docAckTurn = {
                    role: 'assistant' as const,
                    content: `I've read the document "${doc.title}". I'm ready to help — ask away!`,
                  }
                  for await (const text of streamAnthropic({
                    model: 'claude-haiku-4-5',
                    max_tokens: 4096,
                    system: baseSystem,
                    messages: [docIntroTurn, docAckTurn, ...conversationHistory, { role: 'user', content: question }],
                  })) {
                    sendText(text)
                    pathBSucceeded = true
                  }
                } catch { /* Claude document block failed — fall through */ }
              }
            }
          } catch (err) {
            console.error('[documents/ask] Path B error:', err instanceof Error ? err.message : err)
          }

          if (!pathBSucceeded) {
            // ── Path C: metadata + ZIMSEC knowledge (always works) ───────────
            const { system, messages } = buildMetaMessages()
            for await (const text of streamAnthropic({
              model: 'claude-haiku-4-5',
              max_tokens: 4096,
              system,
              messages,
            })) {
              sendText(text)
            }
          }

        } else {
          // ── Path C: no file_path — metadata + ZIMSEC knowledge ───────────
          const { system, messages } = buildMetaMessages()
          for await (const text of streamAnthropic({
            model: 'claude-haiku-4-5',
            max_tokens: 4096,
            system,
            messages,
          })) {
            sendText(text)
          }
        }

        sendDone()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Stream error'
        sendError(msg)
        sendDone()
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
