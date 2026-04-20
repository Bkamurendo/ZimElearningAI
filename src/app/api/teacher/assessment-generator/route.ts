import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { KnowledgeEngine } from '@/lib/ai/knowledge-engine'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { questions: providedQuestions, numVersions = 1, title, topic, level = 'olevel', numQuestionsToGenerate = 5 } = await req.json()

    let baseQuestions = providedQuestions || []

    // If no questions are provided, generate an INFINITE PAST PAPER using the Vector Engine
    if (baseQuestions.length === 0 && topic) {
       // 1. Fetch exact syllabus constraints from the database
       let ragContext = ''
       try {
         const chunks = await KnowledgeEngine.search(`Exam questions and facts for ${topic}`, { limit: 5, threshold: 0.28 })
         if (chunks && chunks.length > 0) {
           ragContext = "\n--- OFFICIAL ZIMSEC SYLLABUS FACT BASE ---\n" + chunks.map(c => `[From ${c.metadata?.title || 'ZIMSEC Document'}]:\n${c.content}`).join('\n\n')
         }
       } catch (e) {
         console.error('[Assessment Generator] RAG Error', e)
       }

       // 2. Instruct Claude to act as a ZIMSEC Chief Examiner
       const prompt = `You are a ZIMSEC Chief Examiner for ${level.toUpperCase()}. 
       Generate EXACTLY ${numQuestionsToGenerate} highly-challenging exam questions for the topic: "${topic}".
       Mix multiple-choice (mcq) and structured free-response questions. Include ZIMSEC-style mark allocations (e.g., [4]).
       Use the strict factual constraints from the Knowledge Base below to invent questions that perfectly map to the Zimbabwean syllabus.

       ${ragContext}

       Return ONLY a raw JSON array of objects format, with NO markdown formatting, NO backticks. Follow this exact structure:
       [
         {
           "id": "q1",
           "question_type": "mcq", /* or "structured" */
           "content": "The question text here... [2]",
           "options": ["A", "B", "C", "D"], /* Only if question_type is mcq */
           "correct_answer": "A",
           "mark_scheme": "Clearly detail how the marks are awarded step by step"
         }
       ]`

       const response = await anthropic.messages.create({
         model: 'claude-3-5-sonnet-20240620',
         max_tokens: 3500,
         system: 'You are a raw JSON returning machine. Never use markdown code blocks.',
         messages: [{ role: 'user', content: prompt }]
       })

       let textRaw = response.content[0].type === 'text' ? response.content[0].text : '[]'
       const jsonMatch = textRaw.match(/\[[\s\S]*\]/)
       
       try {
           if (jsonMatch) {
             baseQuestions = JSON.parse(jsonMatch[0])
           } else {
             baseQuestions = JSON.parse(textRaw)
           }
       } catch (parseErr) {
           console.error("Failed to parse AI question output", textRaw)
           return NextResponse.json({ error: 'AI failed to generate valid questions. Try again.' }, { status: 500 })
       }
    }

    if (!baseQuestions || baseQuestions.length === 0) {
      return NextResponse.json({ error: 'No questions generated or provided' }, { status: 400 })
    }

    const versions: any[] = []
    const versionNames = ['A', 'B', 'C', 'D', 'E']

    // Generate alternate versions for anti-cheating by shuffling options and ordering
    for (let i = 0; i < Math.min(numVersions, 5); i++) {
       const shuffledQuestions = [...baseQuestions]
          .sort(() => Math.random() - 0.5)
          .map((q: any) => {
             if (q.question_type === 'mcq' && q.options) {
                return {
                   ...q,
                   options: [...q.options].sort(() => Math.random() - 0.5)
                }
             }
             return q
          })

       versions.push({
          versionName: versionNames[i],
          questions: shuffledQuestions
       })
    }

    // Award CPD points for advanced curriculum resource creation
    await supabase.from('teacher_cpd_points').insert({
      teacher_id: user.id,
      points: 15,
      activity_type: 'exam_generation',
      description: `Generated AI ZIMSEC Exam: ${title || topic || 'Custom Paper'}`,
      metadata: { num_versions: numVersions, generated_by_ai: !providedQuestions, title: title || topic }
    })

    return NextResponse.json({ versions, original_questions: baseQuestions })
  } catch (error: any) {
    console.error('Assessment Generator Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
