import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function extractPdfLinks(html: string, baseUrl: string): string[] {
  const links = new Set<string>()
  const patterns = [
    /href\s*=\s*["']([^"']*\.pdf[^"']*?)["']/gi,
    /src\s*=\s*["']([^"']*\.pdf[^"']*?)["']/gi,
  ]
  for (const regex of patterns) {
    let match
    while ((match = regex.exec(html)) !== null) {
      try {
        const absolute = new URL(match[1], baseUrl).toString()
        links.add(absolute)
      } catch {
        // skip invalid URLs
      }
    }
  }
  return Array.from(links).slice(0, 10)
}

// ── PDF Processing ────────────────────────────────────────────────────────────

interface FetchParams {
  document_type: string
  subject_id: string | null
  zimsec_level: string | null
  year: number | null
  paper_number: number | null
  auto_discover: boolean
}

interface FetchResult {
  url: string
  status: 'saved' | 'error'
  document_id?: string
  title?: string
  discovered_count?: number
  error?: string
}

async function processPdf(
  url: string,
  arrayBuffer: ArrayBuffer,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  uploaderRole: string,
  params: FetchParams
): Promise<FetchResult> {
  try {
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const filename = url.split('/').pop()?.split('?')[0]?.replace(/[^a-zA-Z0-9._-]/g, '_') ?? 'document.pdf'

    // ── Claude Step 1: Extract ──
    const extractionResponse = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          } as { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } },
          {
            type: 'text',
            text: `You are an educational content analyst for ZimLearn, a ZIMSEC e-learning platform for Zimbabwe.

Analyse this document fetched from the web and respond with JSON:
{
  "title": "Descriptive title for this document (include subject, level, year if detectable)",
  "extracted_text": "Full readable text content of the document (first 4000 chars, preserve structure)",
  "ai_summary": "A concise summary in 200-300 words written for ZIMSEC students. Mention: subject, level, year/type if applicable, key topics, how students benefit.",
  "topics": ["topic1", "topic2", "topic3"],
  "document_structure": "Brief description of document structure",
  "detected_year": null or integer year (e.g. 2023),
  "detected_paper_number": null or integer paper number
}

Respond ONLY with valid JSON, no markdown fences.`,
          },
        ],
      }],
    })

    let extraction: {
      title: string
      extracted_text: string
      ai_summary: string
      topics: string[]
      document_structure: string
      detected_year: number | null
      detected_paper_number: number | null
    }
    try {
      const raw = extractionResponse.content[0].type === 'text' ? extractionResponse.content[0].text : ''
      extraction = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())
    } catch {
      extraction = {
        title: filename.replace(/\.pdf$/i, '').replace(/_/g, ' '),
        extracted_text: 'Text extraction failed. PDF may be scanned or image-based.',
        ai_summary: `Document fetched from ${url}. Manual review may be needed.`,
        topics: [],
        document_structure: 'Unknown',
        detected_year: null,
        detected_paper_number: null,
      }
    }

    // ── Claude Step 2: Moderate ──
    const moderationResponse = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `You are a content moderator for ZimLearn, a ZIMSEC educational platform for Zimbabwean students aged 10-20.

Review this web-fetched document:
TITLE: ${extraction.title}
SOURCE URL: ${url}
TYPE: ${params.document_type}
SUMMARY: ${extraction.ai_summary}
TOPICS: ${extraction.topics.join(', ')}

Evaluate:
1. Is this educationally appropriate for ZIMSEC students?
2. Is this aligned with legitimate academic/educational purposes?
3. Does it contain harmful, inappropriate, or misleading content?

Respond with JSON only:
{
  "decision": "approved" | "flagged" | "rejected",
  "confidence": 0-100,
  "notes": "Brief explanation"
}`,
      }],
    })

    let moderation: { decision: string; confidence: number; notes: string }
    try {
      const raw = moderationResponse.content[0].type === 'text' ? moderationResponse.content[0].text : ''
      moderation = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())
    } catch {
      moderation = { decision: 'flagged', confidence: 50, notes: 'Moderation parse error — needs human review' }
    }

    const isAdmin = uploaderRole === 'admin'
    const isApproved = moderation.decision === 'approved'
    const isRejected = moderation.decision === 'rejected'
    const moderationStatus = isRejected ? 'rejected' : 'ai_reviewed'
    const finalStatus = (isAdmin && isApproved) ? 'published' : moderationStatus
    const visibility = isApproved && isAdmin ? 'public'
      : isApproved && uploaderRole === 'teacher' ? 'subject'
        : 'private'

    // ── Upload to Supabase Storage ──
    const filePath = `web-fetch/${userId}/${Date.now()}_${filename}`
    const { error: storageError } = await supabase.storage
      .from('platform-documents')
      .upload(filePath, arrayBuffer, { contentType: 'application/pdf', cacheControl: '3600', upsert: false })

    if (storageError) {
      return { url, status: 'error', error: `Storage error: ${storageError.message}` }
    }

    // ── Insert to DB ──
    const { data: doc, error: dbError } = await supabase
      .from('uploaded_documents')
      .insert({
        title: extraction.title || filename.replace(/\.pdf$/i, ''),
        description: `Fetched from: ${url}`,
        document_type: params.document_type,
        subject_id: params.subject_id,
        zimsec_level: params.zimsec_level,
        year: params.year ?? extraction.detected_year,
        paper_number: params.paper_number ?? extraction.detected_paper_number,
        file_path: filePath,
        file_name: filename,
        file_size: arrayBuffer.byteLength,
        file_url: '',
        extracted_text: extraction.extracted_text || null,
        ai_summary: extraction.ai_summary || null,
        topics: extraction.topics.length > 0 ? extraction.topics : null,
        moderation_status: finalStatus,
        moderation_notes: `Web fetch. AI Moderation (${moderation.confidence}% confidence): ${moderation.notes}. Structure: ${extraction.document_structure}`,
        visibility,
        uploaded_by: userId,
        uploader_role: uploaderRole,
        processed_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (dbError || !doc) {
      return { url, status: 'error', error: `DB error: ${dbError?.message}` }
    }

    return { url, status: 'saved', document_id: doc.id, title: extraction.title }
  } catch (err) {
    return { url, status: 'error', error: err instanceof Error ? err.message : 'PDF processing failed' }
  }
}

// ── URL Fetcher ───────────────────────────────────────────────────────────────

async function fetchAndProcess(
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  uploaderRole: string,
  params: FetchParams,
  depth = 0
): Promise<FetchResult[]> {
  const results: FetchResult[] = []

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ZimLearnBot/1.0 (Educational Platform; +https://zimlearn.app)',
        Accept: 'text/html,application/pdf,application/xhtml+xml,*/*',
      },
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return [{ url, status: 'error', error: `HTTP ${response.status}: ${response.statusText}` }]
    }

    const contentType = response.headers.get('content-type') ?? ''
    const isPdf = contentType.includes('pdf') || url.toLowerCase().split('?')[0].endsWith('.pdf')

    if (isPdf) {
      // ── PDF ──
      const arrayBuffer = await response.arrayBuffer()
      if (arrayBuffer.byteLength > 50 * 1024 * 1024) {
        return [{ url, status: 'error', error: 'PDF exceeds 50MB limit' }]
      }
      const result = await processPdf(url, arrayBuffer, supabase, userId, uploaderRole, params)
      results.push(result)
    } else {
      // ── HTML ──
      const html = await response.text()
      const textContent = stripHtml(html).slice(0, 5000)
      const discoveredPdfs = params.auto_discover ? extractPdfLinks(html, url) : []

      // Ask Claude about the HTML content
      const claudeResponse = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `This is text extracted from a webpage: ${url}

Content (first 5000 chars):
${textContent}

Evaluate this content for a ZIMSEC educational platform. Respond with JSON:
{
  "title": "Descriptive title for this page's educational content",
  "summary": "2-3 sentence summary of what's on this page",
  "topics": ["topic1", "topic2"],
  "is_zimsec_relevant": true or false
}
Return ONLY valid JSON.`,
        }],
      })

      let pageInfo: { title: string; summary: string; topics: string[]; is_zimsec_relevant: boolean }
      try {
        const raw = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : ''
        pageInfo = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())
      } catch {
        pageInfo = { title: url, summary: '', topics: [], is_zimsec_relevant: discoveredPdfs.length > 0 }
      }

      // Save page text as notes if ZIMSEC-relevant
      if (pageInfo.is_zimsec_relevant && textContent.length > 200) {
        const isAdmin = uploaderRole === 'admin'
        const filePath = `web-fetch/html/${userId}/${Date.now()}.txt`
        // Store the text content as a file (upload as text blob)
        const textBlob = new Blob([textContent], { type: 'text/plain' })
        const textBuffer = await textBlob.arrayBuffer()

        await supabase.storage
          .from('platform-documents')
          .upload(filePath, textBuffer, { contentType: 'text/plain', cacheControl: '3600', upsert: false })

        const { data: htmlDoc, error: htmlDbErr } = await supabase
          .from('uploaded_documents')
          .insert({
            title: pageInfo.title || url,
            description: `Web page content fetched from: ${url}`,
            document_type: params.document_type === 'past_paper' ? 'notes' : params.document_type,
            subject_id: params.subject_id,
            zimsec_level: params.zimsec_level,
            year: params.year,
            paper_number: params.paper_number,
            file_path: filePath,
            file_name: `${pageInfo.title?.slice(0, 50) || 'webpage'}.txt`,
            file_size: textContent.length,
            file_url: '',
            extracted_text: textContent,
            ai_summary: pageInfo.summary || null,
            topics: pageInfo.topics.length > 0 ? pageInfo.topics : null,
            moderation_status: isAdmin ? 'published' : 'ai_reviewed',
            moderation_notes: `Web page content auto-fetched. AI evaluated as ZIMSEC-relevant.`,
            visibility: isAdmin ? 'public' : 'subject',
            uploaded_by: userId,
            uploader_role: uploaderRole,
            processed_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (!htmlDbErr && htmlDoc) {
          results.push({
            url,
            status: 'saved',
            document_id: htmlDoc.id,
            title: pageInfo.title || url,
            discovered_count: discoveredPdfs.length,
          })
        } else {
          results.push({ url, status: 'error', error: htmlDbErr?.message ?? 'Failed to save page content' })
        }
      } else if (discoveredPdfs.length === 0) {
        results.push({ url, status: 'error', error: 'Page does not appear to contain ZIMSEC-relevant content' })
      } else {
        // Not saving page text but will process discovered PDFs
        results.push({ url, status: 'saved', title: pageInfo.title || url, discovered_count: discoveredPdfs.length })
      }

      // Auto-discover: fetch discovered PDFs (depth 1 only — no recursive crawling)
      if (params.auto_discover && depth === 0 && discoveredPdfs.length > 0) {
        for (const pdfUrl of discoveredPdfs.slice(0, 5)) {
          const pdfResults = await fetchAndProcess(pdfUrl, supabase, userId, uploaderRole, { ...params, auto_discover: false }, 1)
          results.push(...pdfResults)
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const errorMsg = message.includes('aborted') ? 'Request timed out (30s limit)' : message
    results.push({ url, status: 'error', error: errorMsg })
  }

  return results
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden — admin or teacher only' }, { status: 403 })
    }

    const body = await req.json() as {
      urls: string[]
      document_type: string
      subject_id?: string
      zimsec_level?: string
      year?: number
      paper_number?: number
      auto_discover?: boolean
    }

    if (!body.urls || !Array.isArray(body.urls) || body.urls.length === 0) {
      return NextResponse.json({ error: 'urls array is required' }, { status: 400 })
    }

    const params: FetchParams = {
      document_type: body.document_type || 'other',
      subject_id: body.subject_id || null,
      zimsec_level: body.zimsec_level || null,
      year: body.year ? Number(body.year) : null,
      paper_number: body.paper_number ? Number(body.paper_number) : null,
      auto_discover: body.auto_discover !== false,
    }

    const allResults: FetchResult[] = []
    const urlsToProcess = body.urls.slice(0, 5).map((u) => u.trim()).filter(Boolean)

    for (const url of urlsToProcess) {
      const results = await fetchAndProcess(url, supabase, user.id, profile.role, params)
      allResults.push(...results)
    }

    return NextResponse.json({
      results: allResults,
      total_saved: allResults.filter((r) => r.status === 'saved').length,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
