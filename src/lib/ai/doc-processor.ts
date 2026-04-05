// Use lib path directly to avoid pdf-parse@1.1.1's test-runner firing during Next.js build
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js')

/**
 * Extracts text from a student-uploaded PDF buffer.
 * Focused on extracting ZIMSEC question papers and notes.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer)
    return data.text || ''
  } catch (err) {
    console.error('PDF Parse Error:', err)
    return ''
  }
}

/**
 * Categorizes a document based on its extracted text or vision analysis.
 */
export function classifyZimsecDocument(texto: string): {
  docType: 'past_paper' | 'notes' | 'homework' | 'textbook' | 'other'
  suggestedActions: string[]
} {
  const t = texto.toLowerCase()
  
  if (t.includes('paper') && (t.includes('zimsec') || t.includes('mark') || t.includes('june') || t.includes('nov'))) {
    return {
      docType: 'past_paper',
      suggestedActions: ['Solve Section A', 'Show Mark Scheme', 'Give me a similar question']
    }
  }

  if (t.includes('notes') || t.includes('summary') || t.includes('lesson')) {
    return {
      docType: 'notes',
      suggestedActions: ['Summarize for me', 'Quiz me on this', 'Explain key terms']
    }
  }

  if (t.includes('homework') || t.includes('assignment') || t.includes('exercise')) {
    return {
      docType: 'homework',
      suggestedActions: ['Check my work', 'Give me a hint', 'Guide me to the answer']
    }
  }

  return {
    docType: 'other',
    suggestedActions: ['Explain this', 'What is this?', 'How can I use this for ZIMSEC?']
  }
}
