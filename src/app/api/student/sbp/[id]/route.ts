import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — full project detail: submission + all stage entries
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const submissionId = params.id

    const { data: submission, error: sErr } = await supabase
      .from('sbp_submissions')
      .select(`
        id, project_title, current_stage, marks_awarded, teacher_feedback, ai_summary,
        submitted_at, graded_at, created_at, updated_at,
        self_initiated, subject_name, heritage_theme,
        assignment:sbp_assignments(
          id, title, description, guidelines, heritage_theme, max_marks, due_date, zimsec_level,
          subject:subjects(name, code)
        )
      `)
      .eq('id', submissionId)
      .single()

    if (sErr || !submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: entries, error: eErr } = await supabase
      .from('sbp_stage_entries')
      .select('id, stage, content, ai_feedback, teacher_comment, created_at')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: true })

    if (eErr) throw new Error(eErr.message)

    return NextResponse.json({ submission, entries: entries ?? [] })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
