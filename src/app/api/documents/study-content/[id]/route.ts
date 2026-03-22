import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkAIQuota } from '@/lib/ai-quota'

// Allow up to 120s — Claude needs time on large documents
export const maxDuration = 120

// Use lib path to avoid pdf-parse@1.1.1's test-runner firing during Next.js build
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js')

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 110_000, // 110s — slightly under maxDuration
  maxRetries: 2,    // SDK auto-retries on 529 / transient 500s
})

// ── Content-type prompts ──────────────────────────────────────────────────────

const PROMPTS: Record<string, (docTitle: string, docType: string) => string> = {

  snap_notes: (title, docType) => `
You are EduZim AI creating ZIMSEC revision snap notes from this document: "${title}".
${docType === 'past_paper' ? 'This is a past exam paper.' : ''}

Create concise, exam-focused snap notes. Every point must be a fact, formula, or key concept a student MUST know.

Respond ONLY with valid JSON array (no markdown fences):
[
  {
    "heading": "Topic heading",
    "emoji": "relevant emoji",
    "points": ["Concise fact 1", "Key formula: F = ma", "Definition: ...", "Remember: ..."]
  }
]

Rules:
- Maximum 10 headings, 5 points each
- Each point max 20 words — make them punchy and memorable
- Include formulas, mnemonics, definitions, common exam traps
- For past papers: extract key topics tested, not the questions themselves
- JSON must be parseable — no trailing commas, no special chars in strings
`.trim(),

  detailed_notes: (title, docType) => `
You are EduZim AI writing comprehensive ZIMSEC study notes from: "${title}".
${docType === 'past_paper' ? 'This is a past exam paper — analyse the types of questions, mark allocations, and topics tested.' : ''}

CRITICAL: You must cover EVERY topic, chapter, and section present in the document — not just the introduction or first chapter. If the document has 10 chapters, write notes for all 10. Do not stop early.

Write structured study notes in markdown covering the FULL document:

Format:
## [Chapter / Main Topic Name]
### [Subtopic]
**Key term**: definition
- bullet point explaining concept
- formula or rule with example
> 💡 Exam tip: what ZIMSEC tests on this

Rules:
- Create one ## section per major topic/chapter found in the document
- Each ## section must have at least 3–5 bullet points of substantive content
- Include ALL formulas, laws, definitions, dates, and key facts from the document
- Add worked examples for calculations or processes where relevant
- End with a "## Common Mistakes" section and a "## Exam Technique" section

Write minimum 1500 words covering all topics comprehensively. Use clear language for Zimbabwean students.
`.trim(),

  model_answers: (title) => `
You are EduZim AI generating model answers for ZIMSEC exam: "${title}".

Extract EVERY question from this paper and provide complete model answers with full working.

Respond ONLY with valid JSON array:
[
  {
    "question_number": "1(a)",
    "question_text": "Full question text here",
    "marks": 3,
    "model_answer": "Complete answer text",
    "working": [
      "Step 1: Identify what is given — ...",
      "Step 2: Choose the correct formula — ...",
      "Step 3: Substitute values — ...",
      "Step 4: Calculate — ...",
      "Final Answer: ..."
    ],
    "examiner_notes": "Examiners award marks for: (1) correct formula, (2) correct substitution, (3) correct answer with units",
    "common_mistakes": "Students often forget to include units / confuse this with ..."
  }
]

Critical rules:
- Include ALL questions from the paper
- Show COMPLETE step-by-step working — do not skip steps
- For calculations: show every algebraic manipulation
- For essays: provide a structured outline with key points per paragraph
- examiner_notes must explain exactly what earns marks
- JSON must be valid and parseable
`.trim(),

  glossary: (title) => `
You are EduZim AI creating a ZIMSEC glossary from: "${title}".

Extract every important term, concept, formula, person, date, or process from this document.

Respond ONLY with valid JSON array:
[
  {
    "term": "Exact term as used in document",
    "definition": "Clear, student-friendly definition (2-3 sentences)",
    "example": "Concrete example or how it appears in ZIMSEC exams",
    "category": "Formula | Concept | Person | Date | Process | Definition"
  }
]

Rules:
- Include ALL subject-specific vocabulary
- Definitions must be accurate and at appropriate reading level
- Examples should reference ZIMSEC exam contexts
- Minimum 15 terms, maximum 50
- JSON must be valid and parseable
`.trim(),

  practice_questions: (title, docType) => `
You are EduZim AI generating ZIMSEC practice questions from: "${title}".
${docType === 'marking_scheme' ? 'Use the marking scheme to understand what good answers look like.' : ''}

Generate challenging practice questions that test understanding at all ZIMSEC levels.

Respond ONLY with valid JSON array:
[
  {
    "number": "1",
    "question": "Full question text",
    "type": "short_answer|long_answer|multiple_choice|calculation|essay",
    "difficulty": "easy|medium|hard",
    "marks": 4,
    "hint": "What concept does this test?",
    "model_answer": "Complete answer",
    "working": "Step-by-step solution or argument",
    "examiner_tip": "This question tests whether students know..."
  }
]

Generate 12 questions:
- 3 easy (1-2 marks) — recall and definition
- 5 medium (3-6 marks) — application and analysis
- 4 hard (7-10 marks) — evaluation and extended response
- Cover all major topics from the document
- JSON must be valid and parseable
`.trim(),

  teaching_guide: (title, docType) => `
You are EduZim AI creating a teacher's guide for: "${title}" (${docType}).

Generate a comprehensive teaching package in markdown format.

Include:
## Lesson Objectives
(What students should know/be able to do after studying this)

## Key Concepts to Teach
(Main ideas with teaching approach for each)

## Suggested Lesson Flow (3-4 lessons)
(Time breakdown, activities, discussion questions)

## Worked Examples for Class
(Problems teachers can solve on the board with students)

## Assessment Ideas
(5 short questions for classwork/homework)

## Differentiation Strategies
(How to support weaker students / challenge stronger ones)

## Common Misconceptions
(What students get wrong and how to correct it)

## Exam Preparation Tips for Students

Write in a practical, teacher-friendly style. Be specific about timing and activities.
`.trim(),
}

// ── Route Handlers ────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('document_study_content')
    .select('content_type, content, generated_at')
    .eq('document_id', params.id)

  return NextResponse.json({ content: data ?? [] })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content_type, force_regenerate = false } = await req.json() as {
    content_type: string
    force_regenerate?: boolean
  }

  if (!PROMPTS[content_type]) {
    return NextResponse.json({ error: 'Invalid content_type' }, { status: 400 })
  }

  // Check cache first — cached results don't consume quota

  if (!force_regenerate) {
    const { data: cached } = await supabase
      .from('document_study_content')
      .select('content, generated_at')
      .eq('document_id', params.id)
      .eq('content_type', content_type)
      .maybeSingle()

    if (cached?.content) {
      return NextResponse.json({
        content: cached.content,
        content_type,
        cached: true,
        generated_at: cached.generated_at,
      })
    }
  }

  // Check AI quota before hitting Anthropic (only for non-cached generation)
  const quota = await checkAIQuota(supabase, user.id)
  if (!quota.allowed) {
    return NextResponse.json({
      error: `Daily AI limit reached (${quota.limit} requests/day on free plan). Upgrade to Pro for unlimited access.`,
      quota,
    }, { status: 429 })
  }

  // Fetch document (must be owner or published)
  const { data: doc } = await supabase
    .from('uploaded_documents')
    .select('id, title, document_type, extracted_text, ai_summary, topics, year, paper_number, zimsec_level, file_path')
    .eq('id', params.id)
    .or(`uploaded_by.eq.${user.id},moderation_status.eq.published`)
    .single()

  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

  // Text limits per content type — detailed_notes needs much more context to cover all topics
  const TEXT_LIMITS: Record<string, number> = {
    detailed_notes:     70000,  // large docs need full coverage
    glossary:           40000,
    practice_questions: 35000,
    model_answers:      35000,
    snap_notes:         25000,
    teaching_guide:     30000,
  }
  const textLimit = TEXT_LIMITS[content_type] ?? 30000

  // For long docs, sample beginning + middle + end so all chapters are represented
  function sampleDocument(text: string, limit: number): string {
    if (text.length <= limit) return text
    const third = Math.floor(limit / 3)
    const mid = Math.floor(text.length / 2)
    return (
      text.slice(0, third) +
      '\n\n[... middle section ...]\n\n' +
      text.slice(mid - Math.floor(third / 2), mid + Math.floor(third / 2)) +
      '\n\n[... final section ...]\n\n' +
      text.slice(-third)
    )
  }

  // Build document context — use extracted_text if available, otherwise fall back to PDF
  let generatedContent: string

  if (doc.extracted_text && doc.extracted_text.length > 200) {
    // Use extracted text (faster, cheaper)
    const sampledText = sampleDocument(doc.extracted_text, textLimit)
    const docContext = `
DOCUMENT: "${doc.title}"
TYPE: ${doc.document_type}${doc.year ? ` | Year: ${doc.year}` : ''}${doc.paper_number ? ` | Paper ${doc.paper_number}` : ''}${doc.zimsec_level ? ` | Level: ${doc.zimsec_level}` : ''}
AI SUMMARY: ${doc.ai_summary || 'N/A'}
KEY TOPICS: ${doc.topics?.join(', ') || 'N/A'}

FULL DOCUMENT TEXT:
${sampledText}
`.trim()

    const prompt = PROMPTS[content_type](doc.title, doc.document_type)
    const fullPrompt = `${prompt}\n\n---\nDOCUMENT CONTENT:\n${docContext}`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 8000,
      messages: [{ role: 'user', content: fullPrompt }],
    })

    generatedContent = response.content[0].type === 'text' ? response.content[0].text : ''
  } else {
    // Download PDF from storage
    const { data: fileData } = await supabase.storage
      .from('platform-documents')
      .download(doc.file_path)

    if (!fileData) {
      return NextResponse.json({ error: 'Could not access document file' }, { status: 500 })
    }

    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const prompt = PROMPTS[content_type](doc.title, doc.document_type)

    // ── Try pdf-parse first (works for any page count, no Claude page limit) ──
    let rawText = ''
    let pageCount = 0
    try {
      const parsed = await pdfParse(buffer)
      rawText = parsed.text?.trim() ?? ''
      pageCount = parsed.numpages ?? 0
    } catch { /* image-based or corrupt — fall through */ }

    const isImageBased = rawText.length < Math.max(pageCount * 20, 50)

    if (!isImageBased && rawText.length > 100) {
      // Text-based PDF — use extracted text (no Anthropic page limit)
      const sampledText = sampleDocument(rawText, textLimit)
      const docContext = `
DOCUMENT: "${doc.title}"
TYPE: ${doc.document_type}${doc.year ? ` | Year: ${doc.year}` : ''}${doc.paper_number ? ` | Paper ${doc.paper_number}` : ''}${doc.zimsec_level ? ` | Level: ${doc.zimsec_level}` : ''}
AI SUMMARY: ${doc.ai_summary || 'N/A'}
KEY TOPICS: ${doc.topics?.join(', ') || 'N/A'}

FULL DOCUMENT TEXT:
${sampledText}
`.trim()

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 8000,
        messages: [{ role: 'user', content: `${prompt}\n\n---\nDOCUMENT CONTENT:\n${docContext}` }],
      })
      generatedContent = response.content[0].type === 'text' ? response.content[0].text : ''

    } else if (pageCount > 0 && pageCount <= 100) {
      // Image/scanned PDF small enough for Claude's vision document block API
      const base64 = buffer.toString('base64')
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            } as { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } },
            { type: 'text', text: prompt },
          ],
        }],
      })
      generatedContent = response.content[0].type === 'text' ? response.content[0].text : ''

    } else {
      // Scanned + >100 pages — use metadata as context
      const metaContext = `
DOCUMENT: "${doc.title}"
TYPE: ${doc.document_type}${doc.year ? ` | Year: ${doc.year}` : ''}${doc.paper_number ? ` | Paper ${doc.paper_number}` : ''}${doc.zimsec_level ? ` | Level: ${doc.zimsec_level}` : ''}
AI SUMMARY: ${doc.ai_summary || 'N/A'}
KEY TOPICS: ${doc.topics?.join(', ') || 'N/A'}
NOTE: This is a scanned/image-based document. Generate content based on the metadata and your ZIMSEC curriculum knowledge.
`.trim()

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 8000,
        messages: [{ role: 'user', content: `${prompt}\n\n---\nDOCUMENT CONTEXT:\n${metaContext}` }],
      })
      generatedContent = response.content[0].type === 'text' ? response.content[0].text : ''
    }
  }

  if (!generatedContent) {
    return NextResponse.json({ error: 'Content generation failed' }, { status: 500 })
  }

  // Clean up any markdown code fences if the model wrapped JSON
  const cleanContent = generatedContent.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  // Cache in database
  await supabase
    .from('document_study_content')
    .upsert({
      document_id: params.id,
      content_type,
      content: cleanContent,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'document_id,content_type' })

  return NextResponse.json({
    content: cleanContent,
    content_type,
    cached: false,
    generated_at: new Date().toISOString(),
  })
}
