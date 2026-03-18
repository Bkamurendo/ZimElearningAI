import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
  // Prevents students from burning API credits on arbitrary documents & resetting moderation decisions.
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
    // Download PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('platform-documents')
      .download(doc.file_path)

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`)
    }

    // Convert to base64 for Claude
    const arrayBuffer = await fileData.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // ── Step 1: Extract content + generate summary + identify topics ──
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

Analyse this uploaded document and respond with a JSON object containing:
{
  "extracted_text": "Full readable text content of the document (preserve structure, questions, answers)",
  "ai_summary": "A concise summary of the document in 200-300 words, written for students. Mention: subject, level, year/type if applicable, key topics covered, and how students can benefit from this resource.",
  "topics": ["topic1", "topic2", "topic3", ...],
  "document_structure": "brief description of document structure (e.g. 'Past paper with 4 sections, 80 marks total')"
}

Respond ONLY with valid JSON, no markdown fences.`,
            },
          ],
        },
      ],
    })

    let extractionData: {
      extracted_text: string
      ai_summary: string
      topics: string[]
      document_structure: string
    }
    try {
      const raw = extractionResponse.content[0].type === 'text' ? extractionResponse.content[0].text : ''
      extractionData = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())
    } catch {
      extractionData = {
        extracted_text: 'Text extraction failed. PDF may be scanned or image-based.',
        ai_summary: `Document: ${doc.title}. This document has been uploaded for student reference.`,
        topics: [],
        document_structure: 'Unknown',
      }
    }

    // ── Step 2: AI Moderation ──
    const moderationResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `You are a content moderator for ZimLearn, a ZIMSEC educational platform for Zimbabwean students aged 10-20.

Review this document summary and extracted text:

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
  "notes": "Brief explanation of decision"
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

    // Determine moderation_status and visibility
    const isAdmin = doc.uploader_role === 'admin'
    const isApproved = moderationData.decision === 'approved'
    const isRejected = moderationData.decision === 'rejected'

    const moderationStatus = isRejected ? 'rejected' : 'ai_reviewed'
    // Auto-publish if admin uploaded AND AI approved
    const finalStatus = (isAdmin && isApproved) ? 'published' : moderationStatus
    // Admin → public, teacher → subject-level, student → private (until human review)
    const visibility =
      isApproved && isAdmin ? 'public'
        : isApproved && doc.uploader_role === 'teacher' ? 'subject'
          : 'private'

    // Save all results
    await supabase
      .from('uploaded_documents')
      .update({
        extracted_text: extractionData.extracted_text,
        ai_summary: extractionData.ai_summary,
        topics: extractionData.topics,
        moderation_status: finalStatus,
        moderation_notes: `AI Moderation (${moderationData.confidence}% confidence): ${moderationData.notes}. Structure: ${extractionData.document_structure}`,
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
