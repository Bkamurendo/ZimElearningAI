import { createClient } from '@/lib/supabase/server'

export type SearchResult = {
  title: string
  content: string
  source_type: 'lesson' | 'document' | 'note'
  relevance: number
}

/**
 * Searches the platform's internal knowledge base (Lessons, Documents, Notes)
 * to provide MaFundi with official ZIMSEC-aligned context.
 */
export async function retrievePlatformKnowledge(
  query: string,
  grade?: string,
  level?: string
): Promise<SearchResult[]> {
  const supabase = createClient()
  const results: SearchResult[] = []

  // 1. Search Lessons
  const lessonQuery = supabase
    .from('lessons')
    .select('title, content, courses(title, subject_id, subjects(name, zimsec_level))')
    .textSearch('content', query, { config: 'english', type: 'plain' })
    .limit(3)

  const { data: lessons } = await lessonQuery

  if (lessons) {
    lessons.forEach((l: any) => {
      if (l.content) {
        results.push({
          title: `${l.courses?.subjects?.name}: ${l.title}`,
          content: l.content.slice(0, 1000), // Limit snippet size
          source_type: 'lesson',
          relevance: 0.8
        })
      }
    })
  }

  // 2. Search Uploaded Documents (Textbooks/Notes)
  let docQuery = supabase
    .from('uploaded_documents')
    .select('title, extracted_text, zimsec_level')
    .textSearch('extracted_text', query, { config: 'english', type: 'plain' })

  if (level) docQuery = docQuery.eq('zimsec_level', level)
  
  const { data: docs } = await docQuery.limit(2)

  if (docs) {
    docs.forEach((d: any) => {
      if (d.extracted_text) {
        results.push({
          title: `Book/Document: ${d.title}`,
          content: d.extracted_text.slice(0, 1500),
          source_type: 'document',
          relevance: 0.9
        })
      }
    })
  }

  return results.sort((a, b) => b.relevance - a.relevance)
}
