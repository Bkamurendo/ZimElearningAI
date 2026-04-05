import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subjectId, subjectName } = await req.json()
  if (!subjectId) return NextResponse.json({ error: 'Missing subjectId' }, { status: 400 })

  try {
    // 1. Get current mastery gaps for this subject
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id, zimsec_level')
      .eq('user_id', user.id)
      .single()

    const zimsecLevel = studentProfile?.zimsec_level ?? 'olevel'

    const { data: gaps } = await supabase
      .from('topic_mastery')
      .select('topic, mastery_level')
      .eq('student_id', studentProfile?.id)
      .eq('subject_id', subjectId)
      .neq('mastery_level', 'mastered')
      .limit(10)

    const topicsToFix = gaps?.map(g => g.topic).join(', ') || 'General Syllabus Review'

    // 2. Generate 30-day plan via AI
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 2000,
      system: `You are a ZIMSEC Master Teacher specialized in increasing national pass rates. 
      Generate a 30-day intensive study plan (4 weeks) for a student preparing for their ${zimsecLevel} exams.
      Focus on the topics they have NOT mastered yet.
      Format the response as a JSON array of objects: [{ week: 1, day: 1, topic: '...', task: '...', goal: 'Pass-Ready Threshold' }]`,
      messages: [
        { role: 'user', content: `Create a ZIMSEC Grade-C Transformation plan for ${subjectName}. Gaps identified: ${topicsToFix}.` }
      ],
    })

    const content = 'text' in message.content[0] ? message.content[0].text : '[]'
    const planArray = JSON.parse(content.match(/\[[\s\S]*\]/)?.[0] || '[]')

    if (planArray.length > 0) {
      // 3. Store the plan
      const startsAt = new Date().toISOString().split('T')[0]
      const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { data: savedPlan, error: saveErr } = await supabase
        .from('study_autopilot_plans')
        .upsert({
          user_id: user.id,
          subject_id: subjectId,
          plan_data: planArray,
          starts_at: startsAt,
          ends_at: endsAt
        })
        .select()
        .single()

      if (saveErr) throw saveErr

      return NextResponse.json({ success: true, plan: planArray, planId: savedPlan.id })
    }

    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
