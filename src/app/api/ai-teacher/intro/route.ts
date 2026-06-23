import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: student } = await supabase
    .from('student_profiles')
    .select('grade, zimsec_level')
    .eq('user_id', user.id)
    .single()

  const level = student?.zimsec_level || 'olevel'
  const grade = student?.grade || 'Form 4'

  const prompt = `You are MaFundi, the AI Super Teacher. This is your first time meeting a student in ${grade} (${level}). 
  Introduce yourself warmly in 3-4 sentences. Explain that you are an AI powered by the official Zimbabwe Heritage-Based Curriculum.
  Mention your 'Super Powers':
  1. Vision AI: You can solve any photo of a question.
  2. Audio Briefings: You can turn any lesson into a podcast.
  3. ZIMSEC Coaching: You know the marking schemes and predict grades.
  
  Keep it energetic and encouraging. Use local Zimbabwean greetings.`

  const response = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }]
  })

  const introText = response.content[0].type === 'text' ? response.content[0].text : "Mwauya! I am MaFundi, your AI Super Teacher."

  return NextResponse.json({ introText })
}
