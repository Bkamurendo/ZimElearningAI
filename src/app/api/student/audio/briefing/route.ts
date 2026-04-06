import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { lesson_id, content } = await req.json() as { lesson_id?: string; content?: string }
    
    let textToSummarize = content || ''
    let title = 'Study Note'

    if (lesson_id) {
      const { data: lesson } = await supabase.from('lessons').select('title, content').eq('id', lesson_id).single()
      if (lesson) {
        textToSummarize = lesson.content
        title = lesson.title
      }
    }

    if (!textToSummarize) return NextResponse.json({ error: 'No content to summarize' }, { status: 400 })

    const prompt = `You are a warm, engaging ZIMSEC teacher named MaFundi. 
    Convert the following study material into a "3-minute Audio Briefing" script. 
    The script should be optimized for text-to-speech:
    - Use short, clear sentences.
    - Use phonetic spellings for complex ZIMSEC terms if necessary.
    - Start with a warm greeting: "Hello student, this is MaFundi with your quick study briefing on ${title}."
    - Break it down into 3-4 key "takeaways."
    - End with a motivational Ubuntu quote.

    MATERIAL:
    ${textToSummarize.slice(0, 4000)}

    Return ONLY the structured script text, no metadata.`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const script = (message.content[0] as { type: string; text: string }).text.trim()

    return NextResponse.json({ 
      script,
      title: `Briefing: ${title}`,
      estimated_duration: Math.ceil(script.split(' ').length / 150) // Approx minutes
    })
  } catch (err) {
    console.error('[audio-briefing] Error:', err)
    return NextResponse.json({ error: 'Failed to generate briefing script' }, { status: 500 })
  }
}
