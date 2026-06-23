export const dynamic = 'force-dynamic';
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// pdf-parse extracts text natively — no Claude page limits apply
// Use the lib path directly to avoid pdf-parse@1.1.1's test-runner firing during Next.js build
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js')

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const docId = params.id

  // Fetch document record
  const { data: doc, error: fetchError } = await supabase
    .from('uploaded_documents')
    .select('*')
    .eq('id', docId)
    .single()

  if (fetchError || !doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Security: only the document owner, admins, or teachers may trigger AI processing.
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const isOwner = doc.uploaded_by === user.id
  const isPrivileged = callerProfile?.role && ['admin', 'teacher'].includes(callerProfile.role)
  if (!isOwner && !isPrivileged) {
    return NextResponse.json({ error: 'Forbidden — you do not have permission to process this document' }, { status: 403 })
  }

  // Mark as processing
  await supabase
    .from('uploaded_documents')
    .update({ moderation_status: 'processing' })
    .eq('id', docId)

  try {
    // ── Step 1: Download PDF from Supabase Storage ────────────────────────────
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('platform-documents')
      .download(doc.file_path)

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`)
    }

    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // ── Step 2: Extract text with pdf-parse (no page limit) ───────────────────
    let rawText = ''
    let pageCount = 0
    let isImageBased = false

    try {
      const parsed = await pdfParse(buffer)
      rawText = parsed.text?.trim() ?? ''
      pageCount = parsed.numpages ?? 0
      // If parsed text is very short relative to page count, it's likely image-based
      isImageBased = rawText.length < pageCount * 20
    } catch (parseErr) {
      console.warn('[process] pdf-parse failed:', parseErr)
      isImageBased = true
    }

    // ── Step 3: For image-based PDFs, try Anthropic document block (≤100 pages) ─
    let extractedViaAI = false
    let extractionData: {
      extracted_text: string
      ai_summary: string
      topics: string[]
      document_structure: string
    } = {
      extracted_text: '',
      ai_summary: `${doc.title} — This document has been uploaded for student reference.`,
      topics: [],
      document_structure: 'Unknown',
    }

    if (isImageBased && pageCount <= 100) {
      // Image/scanned PDF — use Claude's vision via document block API
      try {
        const base64 = buffer.toString('base64')
        const extractionResponse = await anthropic.messages.create({
          model: 'claude-haiku-4-5',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: base64,
                  },
                } as { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } },
                {
                  type: 'text',
                  text: `You are an educational content analyst for ZimLearn, a ZIMSEC e-learning platform.

Analyse this uploaded document and respond with a JSON object:
{
  "extracted_text": "Full readable text content (preserve structure, questions, answers)",
  "ai_summary": "Concise summary in 200-300 words for students: subject, level, year/type if applicable, key topics, how students benefit.",
  "topics": ["topic1", "topic2", "topic3"],
  "document_structure": "Brief description (e.g. 'Past paper with 4 sections, 80 marks total')"
}

Respond ONLY with valid JSON, no markdown fences.`,
                },
              ],
            },
          ],
        })

        const raw = extractionResponse.content[0].type === 'text' ? extractionResponse.content[0].text : ''
        extractionData = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())
        extractedViaAI = true
      } catch (aiErr) {
        console.warn('[process] Anthropic document block failed:', aiErr)
        // Fall through to text-based approach below
      }
    }

    if (!extractedViaAI) {
      if (rawText.length > 100) {
        // ── Step 3a: Text-based PDF — ask Claude to analyse the extracted text ──
        // Truncate if extremely long (Claude handles up to 200K tokens, ~800K chars)
        const truncated = rawText.length > 600_000 ? rawText.slice(0, 600_000) + '\n\n[Content truncated — document is very large]' : rawText

        const analysisResponse = await anthropic.messages.create({
          model: 'claude-haiku-4-5',
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: `You are an educational content analyst for ZimLearn, a ZIMSEC e-learning platform for Zimbabwean students.

The following is the full text content extracted from a PDF document titled "${doc.title}" (type: ${doc.document_type}).

TEXT CONTENT:
${truncated}

---

Respond with a JSON object:
{
  "ai_summary": "Concise summary in 200-300 words for students: subject, level, year/type if applicable, key topics, how students benefit.",
  "topics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "document_structure": "Brief description of the document structure"
}

Respond ONLY with valid JSON, no markdown fences.`,
            },
          ],
        })

        let analysisData: { ai_summary: string; topics: string[]; document_structure: string }
        try {
          const raw = analysisResponse.content[0].type === 'text' ? analysisResponse.content[0].text : ''
          analysisData = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())
        } catch {
          analysisData = {
            ai_summary: `Document: ${doc.title}. This is a ${doc.document_type} uploaded for student reference. It contains ${pageCount} pages of study material.`,
            topics: [],
            document_structure: `${pageCount}-page document`,
          }
        }

        extractionData = {
          extracted_text: rawText,
          ai_summary: analysisData.ai_summary,
          topics: analysisData.topics,
          document_structure: analysisData.document_structure,
        }
      } else {
        // ── Step 3b: Could not extract any text (scanned + >100 pages) ─────────
        extractionData = {
          extracted_text: '',
          ai_summary: `${doc.title} — This is a ${doc.document_type} (${pageCount} pages). The document appears to be image-based or scanned. Text extraction requires manual processing.`,
          topics: [],
          document_structure: `Scanned document, ${pageCount} pages`,
        }
      }
    }

    // ── Step 4: AI Moderation ─────────────────────────────────────────────────
    const moderationResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `You are a content moderator for ZimLearn, a ZIMSEC educational platform for Zimbabwean students aged 10-20.

Review this document:
TITLE: ${doc.title}
TYPE: ${doc.document_type}
SUMMARY: ${extractionData.ai_summary}
TOPICS: ${extractionData.topics.join(', ')}

Evaluate:
1. Is this educationally appropriate for ZIMSEC students?
2. Is this content aligned with legitimate academic/educational purposes?
3. Does it contain harmful, inappropriate, or misleading content?

Respond with JSON only:
{
  "decision": "approved" | "flagged" | "rejected",
  "confidence": 0-100,
  "notes": "Brief explanation"
}`,
        },
      ],
    })

    let moderationData: { decision: string; confidence: number; notes: string }
    try {
      const raw = moderationResponse.content[0].type === 'text' ? moderationResponse.content[0].text : ''
      moderationData = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())
    } catch {
      moderationData = { decision: 'flagged', confidence: 50, notes: 'Moderation parse error — needs human review' }
    }

    // ── Step 5: Determine status and save ─────────────────────────────────────
    const isAdmin = doc.uploader_role === 'admin'
    const isApproved = moderationData.decision === 'approved'
    const isRejected = moderationData.decision === 'rejected'

    const moderationStatus = isRejected ? 'rejected' : 'ai_reviewed'
    const finalStatus = (isAdmin && isApproved) ? 'published' : moderationStatus
    const visibility =
      isApproved && isAdmin ? 'public'
        : isApproved && doc.uploader_role === 'teacher' ? 'subject'
          : 'private'

    await supabase
      .from('uploaded_documents')
      .update({
        extracted_text: extractionData.extracted_text || null,
        ai_summary: extractionData.ai_summary,
        topics: extractionData.topics,
        moderation_status: finalStatus,
        moderation_notes: `AI Moderation (${moderationData.confidence}% confidence): ${moderationData.notes}. Structure: ${extractionData.document_structure}. Pages: ${pageCount}. Method: ${extractedViaAI ? 'Claude vision' : rawText.length > 100 ? 'pdf-parse + Claude NLP' : 'metadata only'}.`,
        visibility,
        processed_at: new Date().toISOString(),
      })
      .eq('id', docId)

    return NextResponse.json({
      success: true,
      moderation_status: finalStatus,
      visibility,
      topics: extractionData.topics,
      summary: extractionData.ai_summary,
      pages: pageCount,
      extraction_method: extractedViaAI ? 'claude-vision' : rawText.length > 100 ? 'pdf-parse' : 'metadata-only',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing failed'
    await supabase
      .from('uploaded_documents')
      .update({
        moderation_status: 'pending',
        moderation_notes: `Processing error: ${message}`,
      })
      .eq('id', docId)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
