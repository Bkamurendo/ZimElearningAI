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
    .select('id, title, document_type, ai_summary, extracted_text, topics, zimsec_level, year, paper_number')
    .eq('id', documentId)
    .or(`uploaded_by.eq.${user.id},moderation_status.eq.published`)
    .single()

  if (!doc) return new Response('Document not found or access denied', { status: 404 })

  // Build context from document
  const docContext = `
DOCUMENT: "${doc.title}"
TYPE: ${doc.document_type}${doc.year ? ` · Year: ${doc.year}` : ''}${doc.paper_number ? ` · Paper ${doc.paper_number}` : ''}
KEY TOPICS: ${doc.topics?.join(', ') || 'Not specified'}
SUMMARY: ${doc.ai_summary || 'No summary available'}

FULL CONTENT:
${doc.extracted_text || 'Full text not yet extracted'}
`.trim()

  const modeInstructions: Record<string, string> = {
    explain: 'Explain clearly, using examples from this document. Reference specific sections when possible.',
    solve: 'Solve this step by step with complete working shown. For maths/science: number each step, show all calculations, box the final answer. For humanities: structure as Context → Analysis → Key Points → Conclusion.',
    summarise: 'Provide a structured summary. Use headings for each main section/topic. Include key definitions, formulas, dates or facts as appropriate.',
    examine: 'Analyse what ZIMSEC examiners are likely to test from this document. List high-frequency topics, typical question types, command words used, and mark allocations. Provide 3-5 practice questions a student should prepare.',
  }

  const system = `You are EduZim AI — an expert ZIMSEC tutor built for Zimbabwean students.

You are helping a student study from a specific uploaded document. Here is the document content:

---
${docContext}
---

Mode: ${modeInstructions[mode] || modeInstructions.explain}

Guidelines:
- Always ground your responses in the actual document content above
- Quote or reference specific parts of the document when relevant
- Apply ZIMSEC marking criteria: show how many marks each point would score
- Use simple, clear language appropriate for Zimbabwean students
- Format with markdown: bold key terms, use numbered steps for working, use bullet points for lists
- If the document is a past paper, treat each question seriously as ZIMSEC-style exam practice`

  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    ...conversationHistory,
    { role: 'user', content: question },
  ]

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
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
