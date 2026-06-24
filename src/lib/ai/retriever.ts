import { createClient } from '@/lib/supabase/server'
import { KnowledgeEngine } from './knowledge-engine'

export type SearchResult = {
  title: string
  content: string
  source_type: 'lesson' | 'document' | 'note'
  relevance: number
}

/**
 * Searches the platform's internal knowledge base (Lessons, Documents, Notes)
 * using the Funda Knowledge Engine (Vector RAG).
 */
export async function retrievePlatformKnowledge(
  query: string,
  grade?: string,
  level?: string
): Promise<SearchResult[]> {
  try {
    const supabase = createClient()

    // Primary: semantic vector search — threshold lowered to 0.30 to match
    // the Solver and catch relevant docs that 0.45 was silently excluding
    const vectorResults = await KnowledgeEngine.search(query, {
      grade,
      level,
      limit: 6,
      threshold: 0.30,
    })

    if (vectorResults && vectorResults.length >= 2) {
      return vectorResults.map(res => ({
        title: res.metadata?.title || 'Knowledge Resource',
        content: res.content,
        source_type: res.source_type as any,
        relevance: res.similarity,
      }))
    }

    // Secondary: direct document search — catches uploaded past papers and
    // textbooks that haven't yet been ingested into knowledge_vectors
    const results: SearchResult[] = vectorResults?.map(res => ({
      title: res.metadata?.title || 'Knowledge Resource',
      content: res.content,
      source_type: res.source_type as any,
      relevance: res.similarity,
    })) ?? []

    const { data: docs } = await supabase
      .from('uploaded_documents')
      .select('title, ai_summary, topics, document_type, year, zimsec_level')
      .eq('moderation_status', 'published')
      .eq('zimsec_level', level || 'olevel')
      .not('ai_summary', 'is', null)
      .limit(4)

    if (docs && docs.length > 0) {
      docs.forEach((doc: any) => {
        const typeLabel = doc.document_type === 'past_paper'
          ? `Past Paper ${doc.year ?? ''}`.trim()
          : doc.document_type?.replace(/_/g, ' ') ?? 'Document'
        results.push({
          title: `${doc.title} (${typeLabel})`,
          content: doc.ai_summary || '',
          source_type: 'document',
          relevance: 0.6,
        })
      })
    }

    if (results.length > 0) {
      return results.sort((a, b) => b.relevance - a.relevance).slice(0, 6)
    }

    // Tertiary: legacy full-text search on lessons
    const { data: lessons } = await supabase
      .from('lessons')
      .select('title, content, courses(title, subject_id, subjects(name, zimsec_level))')
      .textSearch('content', query, { config: 'english', type: 'plain' })
      .limit(3)

    if (lessons) {
      lessons.forEach((l: any) => {
        if (l.content) {
          results.push({
            title: `${l.courses?.subjects?.name}: ${l.title}`,
            content: l.content.slice(0, 1000),
            source_type: 'lesson',
            relevance: 0.5,
          })
        }
      })
    }

    return results.sort((a, b) => b.relevance - a.relevance)
  } catch (err) {
    console.error('[RETRIEVER ERROR]', err)
    return []
  }
}

