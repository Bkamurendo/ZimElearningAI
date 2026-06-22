import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 10

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subjectId, score, total, topic } = await req.json()

  if (!subjectId || typeof score !== 'number' || typeof total !== 'number') {
    return NextResponse.json({ error: 'subjectId, score, and total are required' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })

  const { error } = await supabase.from('quiz_attempts').insert({
    student_id: profile.id,
    subject_id: subjectId,
    score,
    total,
    topic: String(topic ?? 'Past Paper').slice(0, 200),
  })

  if (error) {
    console.error('save-attempt error:', error)
    return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 })
  }

  return NextResponse.json({ saved: true })
}
