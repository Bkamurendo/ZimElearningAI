export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/* ── GET — lessons for a subject (text lessons only, for flashcard generation) */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const subjectId = new URL(req.url).searchParams.get('subject_id')
    if (!subjectId) return NextResponse.json({ lessons: [] })

    // Get published courses for this subject
    const { data: courses } = await supabase
      .from('courses')
      .select('id')
      .eq('subject_id', subjectId)
      .eq('published', true)

    const courseIds = (courses ?? []).map(c => c.id)
    if (courseIds.length === 0) return NextResponse.json({ lessons: [] })

    // Get text lessons from those courses
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('id, title, course_id')
      .in('course_id', courseIds)
      .eq('content_type', 'text')
      .order('order_index')

    if (error) throw new Error(error.message)
    return NextResponse.json({ lessons: lessons ?? [] })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
