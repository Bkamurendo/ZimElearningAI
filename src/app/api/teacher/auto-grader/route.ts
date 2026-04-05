import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { image, rubric, assignmentTitle } = await req.json()

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Extract base64 details
    const base64Data = image.split(',')[1] || image
    const mediaType = image.split(';')[0]?.split(':')[1] || 'image/jpeg'

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 2048,
      system: `You are an expert ZIMSEC (Zimbabwe School Examinations Council) examiner. 
      Your task is to grade handwritten student work based on the provided image and rubric.
      Provide a detailed breakdown including:
      1. Score (out of total marks)
      2. Strengths
      3. Areas for Improvement
      4. AI-suggested grade.
      Format your entire response as a clean JSON object.`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as any,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `Assignment: ${assignmentTitle || 'Unspecified'}\nRubric/Context: ${rubric || 'General academic assessment'}\nPlease grade this work.`,
            },
          ],
        },
      ],
    })

    const textContent = response.content[0].type === 'text' ? response.content[0].text : ''
    
    // Attempt to extract JSON if Claude wrapped it in markdown
    const jsonMatch = textContent.match(/\{[\s\S]*\}/)
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Failed to parse AI response', raw: textContent }

    // Log the activity for CPD points
    await supabase.from('teacher_cpd_points').insert({
      teacher_id: user.id,
      points: 10,
      activity_type: 'grading',
      description: `Used AI Auto-Grader for: ${assignmentTitle || 'Standard Assignment'}`,
      metadata: { assignment_title: assignmentTitle }
    })

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error('Auto-Grader Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
