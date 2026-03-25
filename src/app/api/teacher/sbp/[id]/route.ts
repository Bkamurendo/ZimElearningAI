import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — all student submissions for a specific SBP assignment (with stage entries)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const assignmentId = params.id

    // Get the assignment itself
    const { data: assignment, error: aErr } = await supabase
      .from('sbp_assignments')
      .select('id, title, description, guidelines, heritage_theme, max_marks, due_date, zimsec_level, published, subject:subjects(name, code)')
      .eq('id', assignmentId)
      .single() as { data: Record<string, unknown> | null; error: unknown }

    if (aErr || !assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })

    // Get submissions with student profile info
    const { data: submissions, error: sErr } = await supabase
      .from('sbp_submissions')
      .select(`
        id, project_title, current_stage, marks_awarded, teacher_feedback,
        submitted_at, graded_at, created_at, updated_at,
        student:student_profiles(id, user:profiles(full_name, email))
      `)
      .eq('sbp_assignment_id', assignmentId)
      .order('created_at', { ascending: false })

    if (sErr) throw new Error(sErr.message)

    const submissionList = submissions ?? []
    const submissionIds = submissionList.map((s: { id: string }) => s.id)

    // Get all stage entries for these submissions
    const { data: entries } = await supabase
      .from('sbp_stage_entries')
      .select('id, submission_id, stage, content, ai_feedback, teacher_comment, created_at')
      .in('submission_id', submissionIds.length > 0 ? submissionIds : ['none'])
      .order('created_at', { ascending: true }) as {
        data: { id: string; submission_id: string; stage: string; content: string; ai_feedback: string | null; teacher_comment: string | null; created_at: string }[] | null
        error: unknown
      }

    // Group entries by submission_id
    const entriesBySubmission: Record<string, unknown[]> = {}
    for (const e of entries ?? []) {
      if (!entriesBySubmission[e.submission_id]) entriesBySubmission[e.submission_id] = []
      entriesBySubmission[e.submission_id].push(e)
    }

    const result = submissionList.map((s: { id: string }) => ({
      ...s,
      stage_entries: entriesBySubmission[s.id] ?? [],
    }))

    return NextResponse.json({ assignment, submissions: result })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

// PATCH — grade a submission (marks_awarded + teacher_feedback)
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { submission_id, marks_awarded, teacher_feedback, entry_id, teacher_comment } = body

    // Grade the overall submission
    if (submission_id && (marks_awarded !== undefined || teacher_feedback !== undefined)) {
      const { error } = await supabase
        .from('sbp_submissions')
        .update({
          marks_awarded: marks_awarded ?? null,
          teacher_feedback: teacher_feedback ?? null,
          graded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', submission_id)

      if (error) throw new Error(error.message)
    }

    // Add teacher comment to a specific stage entry
    if (entry_id && teacher_comment !== undefined) {
      const { error } = await supabase
        .from('sbp_stage_entries')
        .update({ teacher_comment })
        .eq('id', entry_id)

      if (error) throw new Error(error.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
