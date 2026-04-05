import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { questions, numVersions, title } = await req.json()

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions provided' }, { status: 400 })
    }

    const versions: any[] = []
    const versionNames = ['A', 'B', 'C', 'D', 'E']

    for (let i = 0; i < Math.min(numVersions, 5); i++) {
       // Deep clone and shuffle questions
       const shuffledQuestions = [...questions]
          .sort(() => Math.random() - 0.5)
          .map(q => {
             // If it's MCQ, also shuffle options
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

    // Award CPD points for resource creation
    await supabase.from('teacher_cpd_points').insert({
      teacher_id: user.id,
      points: 15,
      activity_type: 'quiz_creation',
      description: `Generated ${numVersions} versions of assessment: ${title || 'Exam'}`,
      metadata: { num_versions: numVersions, title }
    })

    return NextResponse.json({ versions })
  } catch (error: any) {
    console.error('Assessment Generator Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
