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
    // Perform semantic search via the new Knowledge Engine
    const vectorResults = await KnowledgeEngine.search(query, {
        grade,
        level,
        limit: 4, // Slimmed down for Free Tier reliability
        threshold: 0.45 // Higher quality threshold = less database work
    })

    if (vectorResults && vectorResults.length > 0) {
      return vectorResults.map(res => ({
        title: res.metadata?.title || 'Knowledge Resource',
        content: res.content,
        source_type: res.source_type as any,
        relevance: res.similarity
      }))
    }

    // Fallback to legacy text search if vector search returns nothing
    const supabase = createClient()
    const results: SearchResult[] = []

    // Legacy Search Lessons
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
            relevance: 0.8
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
