import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
  const { data: doc } = await supabase
    .from('uploaded_documents')
    .select('id, title, document_type, ai_summary, extracted_text, topics, zimsec_level, year, paper_number, file_path')
    .eq('id', documentId)
    .or(`uploaded_by.eq.${user.id},moderation_status.eq.published`)
    .single()

  if (!doc) return new Response('Document not found or access denied', { status: 404 })

  const modeInstructions: Record<string, string> = {
    explain: 'Explain clearly, using examples from this document. Reference specific sections when possible.',
    solve: 'Solve this step by step with complete working shown. For maths/science: number each step, show all calculations, box the final answer. For humanities: structure as Context → Analysis → Key Points → Conclusion.',
    summarise: 'Provide a structured summary. Use headings for each main section/topic. Include key definitions, formulas, dates or facts as appropriate.',
    examine: 'Analyse what ZIMSEC examiners are likely to test from this document. List high-frequency topics, typical question types, command words used, and mark allocations. Provide 3-5 practice questions a student should prepare.',
  }

  const system = `You are EduZim AI — an expert ZIMSEC tutor built for Zimbabwean students.

You are helping a student study from a specific uploaded document.

Mode: ${modeInstructions[mode] || modeInstructions.explain}

Guidelines:
- Always ground your responses in the actual document content
- Quote or reference specific parts of the document when relevant
- Apply ZIMSEC marking criteria: show how many marks each point would score
- Use simple, clear language appropriate for Zimbabwean students
- Format with markdown: bold key terms, use numbered steps for working, use bullet points for lists
- If the document is a past paper, treat each question seriously as ZIMSEC-style exam practice`

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        // Decide whether to use extracted text or fall back to reading the PDF directly
        const hasExtractedText = doc.extracted_text && doc.extracted_text.trim().length > 0

        let messages: Anthropic.Messages.MessageParam[]

        if (hasExtractedText) {
          // ── Normal path: use pre-extracted text ──
          const docContext = `
DOCUMENT: "${doc.title}"
TYPE: ${doc.document_type}${doc.year ? ` · Year: ${doc.year}` : ''}${doc.paper_number ? ` · Paper ${doc.paper_number}` : ''}
KEY TOPICS: ${doc.topics?.join(', ') || 'Not specified'}
SUMMARY: ${doc.ai_summary || 'No summary available'}

FULL CONTENT:
${doc.extracted_text}
`.trim()

          messages = [
            ...conversationHistory,
            { role: 'user', content: `[Context: ${docContext}]\n\n${question}` },
          ]
        } else {
          // ── Fallback: download PDF from storage and send to Claude directly ──
          let pdfBlock: Anthropic.Messages.ContentBlockParam | null = null

          if (doc.file_path) {
            const { data: fileData, error: dlError } = await supabase.storage
              .from('platform-documents')
              .download(doc.file_path)

            if (!dlError && fileData) {
              const arrayBuffer = await fileData.arrayBuffer()
              const base64 = Buffer.from(arrayBuffer).toString('base64')
              pdfBlock = {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64,
                },
              } as Anthropic.Messages.ContentBlockParam
            }
          }

          if (pdfBlock) {
            // Inject PDF as the first turn so Claude can see the document
            // even if there is existing conversation history
            const docIntroTurn: Anthropic.Messages.MessageParam = {
              role: 'user',
              content: [
                pdfBlock,
                {
                  type: 'text',
                  text: `This is the document "${doc.title}" (${doc.document_type}). Please use its content to answer the student's questions.`,
                },
              ],
            }
            const docAckTurn: Anthropic.Messages.MessageParam = {
              role: 'assistant',
              content: `I have read the document "${doc.title}". I'm ready to help you study it — please ask your questions.`,
            }

            messages = [
              docIntroTurn,
              docAckTurn,
              ...conversationHistory,
              { role: 'user', content: question },
            ]
          } else {
            // Last resort: no PDF available either — tell Claude what we know from metadata
            const metaContext = `
DOCUMENT: "${doc.title}"
TYPE: ${doc.document_type}${doc.year ? ` · Year: ${doc.year}` : ''}${doc.paper_number ? ` · Paper ${doc.paper_number}` : ''}
KEY TOPICS: ${doc.topics?.join(', ') || 'Not specified'}
SUMMARY: ${doc.ai_summary || 'No summary available'}
NOTE: The full text of this document could not be loaded. Answer based on the metadata above and your general ZIMSEC knowledge.
`.trim()

            messages = [
              ...conversationHistory,
              { role: 'user', content: `[Document metadata: ${metaContext}]\n\n${question}` },
            ]
          }
        }

        const stream = anthropic.messages.stream({
          model: 'claude-haiku-4-5',
          max_tokens: 4096,
          system,
          messages,
        })

        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`
              )
            )
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
