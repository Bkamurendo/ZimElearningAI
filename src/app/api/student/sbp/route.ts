export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — student's active submissions + available (unstarted) SBP assignments
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: student } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null; error: unknown }

    if (!student) return NextResponse.json({ submissions: [], available: [] })

    // My active/completed project submissions
    const { data: submissions, error: sErr } = await supabase
      .from('sbp_submissions')
      .select(`
        id, project_title, current_stage, marks_awarded, teacher_feedback,
        submitted_at, graded_at, created_at, updated_at,
        self_initiated, subject_name, heritage_theme,
        assignment:sbp_assignments(id, title, description, heritage_theme, max_marks, due_date, zimsec_level,
          subject:subjects(name, code))
      `)
      .eq('student_id', student.id)
      .order('updated_at', { ascending: false })

    if (sErr) throw new Error(sErr.message)

    // Available published assignments for the student's enrolled subjects that they haven't started
    const startedIds = (submissions ?? []).map((s: Record<string, unknown>) => {
      const asgn = s.assignment as { id?: string }[] | null
      return Array.isArray(asgn) ? asgn[0]?.id : (asgn as unknown as { id?: string } | null)?.id
    }).filter(Boolean) as string[]

    const { data: enrolled } = await supabase
      .from('student_subjects')
      .select('subject_id')
      .eq('student_id', student.id) as { data: { subject_id: string }[] | null; error: unknown }

    const subjectIds = (enrolled ?? []).map(e => e.subject_id)

    let available: unknown[] = []
    if (subjectIds.length > 0) {
      const query = supabase
        .from('sbp_assignments')
        .select('id, title, description, heritage_theme, max_marks, due_date, zimsec_level, subject:subjects(name, code)')
        .eq('published', true)
        .in('subject_id', subjectIds)
        .order('due_date', { ascending: true })

      if (startedIds.length > 0) {
        query.not('id', 'in', `(${startedIds.join(',')})`)
      }

      const { data: avail } = await query
      available = avail ?? []
    }

    return NextResponse.json({ submissions: submissions ?? [], available })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

// POST — start a new project (teacher-assigned OR self-initiated by student)
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: student } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null; error: unknown }

    if (!student) return NextResponse.json({ error: 'No student profile' }, { status: 403 })

    const body = await req.json()
    const { sbp_assignment_id, project_title, self_initiated, subject_name, heritage_theme } = body

    // Self-initiated: no assignment needed, but project_title is required
    if (!sbp_assignment_id && !self_initiated) {
      return NextResponse.json({ error: 'Either sbp_assignment_id or self_initiated:true is required' }, { status: 400 })
    }
    if (self_initiated && !project_title?.trim()) {
      return NextResponse.json({ error: 'A project title is required for self-initiated projects' }, { status: 400 })
    }

    if (sbp_assignment_id) {
      // Teacher-assigned: upsert (idempotent if already started)
      const { data, error } = await supabase
        .from('sbp_submissions')
        .upsert({
          sbp_assignment_id,
          student_id: student.id,
          project_title: project_title ?? null,
          current_stage: 'proposal',
          self_initiated: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'sbp_assignment_id,student_id' })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return NextResponse.json({ submission: data }, { status: 201 })
    } else {
      // Self-initiated: always a new row (no unique constraint applies)
      const { data, error } = await supabase
        .from('sbp_submissions')
        .insert({
          sbp_assignment_id: null,
          student_id: student.id,
          project_title: project_title.trim(),
          current_stage: 'proposal',
          self_initiated: true,
          subject_name: subject_name ?? null,
          heritage_theme: heritage_theme ?? null,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return NextResponse.json({ submission: data }, { status: 201 })
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

// PATCH — update project title
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, project_title } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabase
      .from('sbp_submissions')
      .update({ project_title, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
