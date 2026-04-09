import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const pdfParse = require('pdf-parse/lib/pdf-parse.js')

let openaiInstance: OpenAI | null = null
let supabaseInstance: ReturnType<typeof createClient> | null = null

function getOpenAI() {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY is missing.')
    openaiInstance = new OpenAI({ apiKey })
  }
  return openaiInstance
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
 */
export class KnowledgeEngine {
  
  /**
   * Chunks a long text into smaller pieces with overlap for better context.
   */
  static chunkText(text: string): string[] {
    const chunks: string[] = []
    let start = 0
    
    while (start < text.length) {
      const end = start + CHUNK_SIZE
      const chunk = text.slice(start, end)
      chunks.push(chunk)
      start += CHUNK_SIZE - CHUNK_OVERLAP
    }
    
    return chunks
  }

  /**
   * Generates a vector embedding for a given text.
   */
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
   * Ingests a single resource (Lesson or Document) into the vector engine.
   */
  static async ingestResource(
    sourceId: string, 
    sourceType: 'lesson' | 'document', 
    title: string, 
    content: string, 
    metadata: any = {}
  ) {
    console.log(`[KNOWLEDGE ENGINE] Ingesting ${sourceType}: ${title}...`)
    
    // 1. Clean and chunk the text
    const chunks = this.chunkText(content)
    
    // 2. Process each chunk
    const supabase = getSupabase()
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const embedding = await this.generateEmbedding(chunk)
        
        await supabase.from('knowledge_vectors').upsert({
            source_id: sourceId,
            source_type: sourceType,
            content: chunk,
            embedding,
            metadata: {
                ...metadata,
                title,
                chunk_index: i,
                total_chunks: chunks.length
            }
        }, { onConflict: 'source_id, content' }) // Simple conflict handling
    }
    
    console.log(`[KNOWLEDGE ENGINE] Successfully ingested ${chunks.length} chunks for ${title}.`)
  }

  /**
   * Specifically for Documents: Downloads and extracts text if missing, then ingests.
   */
  static async extractAndIngestDocument(doc: { id: string, title: string, file_path: string, zimsec_level?: string }) {
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

    // 2. Extract text
    const buffer = Buffer.from(await fileData.arrayBuffer())
    let text = ''
    try {
      const parsed = await pdfParse(buffer)
      text = parsed.text?.trim() || ''
    } catch (err) {
      console.warn(`[KNOWLEDGE ENGINE] PDF Parse failed for ${doc.title}`)
      return
    }

    if (!text) {
      console.warn(`[KNOWLEDGE ENGINE] No text found in ${doc.title}`)
      return
    }

    // 3. Save extracted text back to DB for future use
    await supabase.from('uploaded_documents').update({ extracted_text: text }).eq('id', doc.id)

    // 4. Ingest as normal
    await this.ingestResource(doc.id, 'document', doc.title, text, { zimsec_level: doc.zimsec_level })
  }

  /**
   * Performs semantic similarity search using pgvector.
   */
  static async search(query: string, options: { 
    grade?: string, 
    level?: string, 
    limit?: number, 
    threshold?: number 
  } = {}): Promise<any[]> {
    const { 
        grade = 'all', 
        level = 'all', 
        limit = 5, 
        threshold = 0.5 
    } = options

    // 1. Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query)
    const supabase = getSupabase()

    // 2. Query Supabase using the match_knowledge_chunks RPC
    const { data, error } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      filter_grade: grade,
      filter_level: level
    })

    if (error) {
      console.error('[KNOWLEDGE ENGINE] Search Error:', error)
      return []
    }

    return data || []
  }
}
