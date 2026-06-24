import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js')

let openaiInstance: OpenAI | null = null
let anthropicInstance: Anthropic | null = null
let supabaseInstance: ReturnType<typeof createClient> | null = null

function getOpenAI() {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY is missing.')
    openaiInstance = new OpenAI({ apiKey })
  }
  return openaiInstance
}

function getAnthropic() {
  if (!anthropicInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is missing.')
    anthropicInstance = new Anthropic({ apiKey })
  }
  return anthropicInstance
}

function getSupabase() {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('Supabase credentials (URL/Role Key) are missing from environment.')
    }
    supabaseInstance = createClient(url, key)
  }
  return supabaseInstance as any
}

const CHUNK_SIZE = 1500
const CHUNK_OVERLAP = 200

/**
 * Funda Knowledge Engine
 *
 * Handles chunking, embedding, and semantic retrieval of curriculum resources.
 * Supports text-based and scanned (image) PDFs via Claude Vision OCR.
 */
export class KnowledgeEngine {

  static chunkText(text: string): string[] {
    const chunks: string[] = []
    let start = 0
    while (start < text.length) {
      chunks.push(text.slice(start, start + CHUNK_SIZE))
      start += CHUNK_SIZE - CHUNK_OVERLAP
    }
    return chunks
  }

  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const openai = getOpenAI()
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.replace(/\n/g, ' '),
      })
      return response.data[0].embedding
    } catch (err) {
      console.error('[KNOWLEDGE ENGINE] Embedding Error:', err)
      throw err
    }
  }

  /**
   * Ingests a resource into knowledge_vectors.
   * Deletes any existing chunks for this source first to prevent duplicates.
   */
  static async ingestResource(
    sourceId: string,
    sourceType: 'lesson' | 'document',
    title: string,
    content: string,
    metadata: any = {}
  ) {
    if (!content || content.trim().length < 50) {
      console.warn(`[KNOWLEDGE ENGINE] Skipping "${title}" — content too short or empty.`)
      return
    }

    console.log(`[KNOWLEDGE ENGINE] Ingesting ${sourceType}: ${title}...`)
    const supabase = getSupabase()

    // Remove any existing chunks for this source to avoid duplicates on re-ingest
    await supabase.from('knowledge_vectors').delete().eq('source_id', sourceId)

    const chunks = this.chunkText(content)

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const embedding = await this.generateEmbedding(chunk)

      const { error: insertError } = await supabase.from('knowledge_vectors').insert({
        source_id: sourceId,
        source_type: sourceType,
        content: chunk,
        embedding,
        metadata: {
          ...metadata,
          title,
          chunk_index: i,
          total_chunks: chunks.length,
        },
      })

      if (insertError) {
        console.error(`[KNOWLEDGE ENGINE] DB Error for "${title}" chunk ${i}:`, insertError.message)
        throw new Error(insertError.message)
      }
    }

    console.log(`[KNOWLEDGE ENGINE] Ingested ${chunks.length} chunks for "${title}".`)
  }

  /**
   * Downloads a document from storage, extracts its text (with Claude Vision OCR
   * for scanned PDFs ≤100 pages), saves the text back to uploaded_documents,
   * then ingests into knowledge_vectors.
   */
  static async extractAndIngestDocument(doc: {
    id: string
    title: string
    file_path: string
    zimsec_level?: string
  }) {
    const supabase = getSupabase()
    console.log(`[KNOWLEDGE ENGINE] Processing Doc: ${doc.title}...`)

    // 1. Download from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('platform-documents')
      .download(doc.file_path)

    if (downloadError || !fileData) {
      console.warn(`[KNOWLEDGE ENGINE] Download failed for ${doc.title}:`, downloadError?.message)
      return
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    let text = ''
    let pageCount = 0
    let isScanned = false

    // 2. Try pdf-parse first (handles text-based PDFs with no page limit)
    try {
      const parsed = await pdfParse(buffer)
      text = parsed.text?.trim() || ''
      pageCount = parsed.numpages ?? 0
      if (!text && pageCount > 0) isScanned = true
    } catch (_err) {
      console.warn(`[KNOWLEDGE ENGINE] PDF parse failed for ${doc.title}`)
      isScanned = true
    }

    // 3. For scanned PDFs ≤100 pages, use Claude Vision to extract text
    if (!text && isScanned && pageCount <= 100) {
      try {
        const anthropic = getAnthropic()
        const base64 = buffer.toString('base64')
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5',
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
                text: 'Extract all text content from this document exactly as it appears. Preserve all questions, answers, marks allocations, and document structure. Return plain text only — no JSON, no markdown fences.',
              },
            ],
          }],
        })
        const extracted = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
        if (extracted.length > 100) {
          text = extracted
          console.log(`[KNOWLEDGE ENGINE] Claude Vision OCR succeeded for "${doc.title}" — ${text.length} chars extracted.`)
        }
      } catch (visionErr) {
        console.warn(`[KNOWLEDGE ENGINE] Claude Vision OCR failed for ${doc.title}:`, visionErr)
      }
    }

    if (!text) {
      if (isScanned && pageCount > 100) {
        console.warn(`[KNOWLEDGE ENGINE] Scanned PDF >100 pages — cannot OCR: ${doc.title}`)
        await supabase
          .from('uploaded_documents')
          .update({ extracted_text: '[SCANNED_IMAGE_OCR_REQUIRED]' })
          .eq('id', doc.id)
      } else {
        console.warn(`[KNOWLEDGE ENGINE] No text found in ${doc.title}`)
      }
      return
    }

    // 4. Save extracted text back to DB for the Study Panel and future ingestion
    await supabase
      .from('uploaded_documents')
      .update({ extracted_text: text })
      .eq('id', doc.id)

    // 5. Ingest into knowledge_vectors
    await this.ingestResource(doc.id, 'document', doc.title, text, {
      zimsec_level: doc.zimsec_level,
    })
  }

  /**
   * Performs semantic similarity search using pgvector.
   */
  static async search(
    query: string,
    options: {
      grade?: string
      level?: string
      limit?: number
      threshold?: number
    } = {}
  ): Promise<any[]> {
    const {
      grade = 'all',
      level = 'all',
      limit = 4,
      threshold = 0.5,
    } = options

    const queryEmbedding = await this.generateEmbedding(query)
    const supabase = getSupabase()

    const { data, error } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      filter_grade: grade,
      filter_level: level,
    })

    if (error) {
      console.error('[KNOWLEDGE ENGINE] Search Error:', error)
      return []
    }

    return data || []
  }
}
