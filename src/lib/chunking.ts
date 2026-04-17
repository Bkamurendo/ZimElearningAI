const CHUNK_SIZE = 800      // characters per chunk (~200 tokens)
const CHUNK_OVERLAP = 100   // overlap between chunks to preserve context

export function chunkText(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= CHUNK_SIZE) return [cleaned]

  const chunks: string[] = []
  let start = 0

  while (start < cleaned.length) {
    let end = start + CHUNK_SIZE

    // Try to break at sentence boundary (. ! ?) within last 150 chars
    if (end < cleaned.length) {
      const window = cleaned.slice(end - 150, end)
      const sentenceEnd = Math.max(
        window.lastIndexOf('. '),
        window.lastIndexOf('! '),
        window.lastIndexOf('? '),
        window.lastIndexOf('\n'),
      )
      if (sentenceEnd > 0) {
        end = end - 150 + sentenceEnd + 1
      }
    }

    const chunk = cleaned.slice(start, end).trim()
    if (chunk.length > 50) chunks.push(chunk)

    start = end - CHUNK_OVERLAP
  }

  return chunks
}
