import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — list teacher's SBP assignments with submission counts
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: teacher } = await supabase
      .from('teacher_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null; error: unknown }

    if (!teacher) return NextResponse.json({ assignments: [] })

    const { data, error } = await supabase
      .from('sbp_assignments')
      .select('id, title, description, heritage_theme, max_marks, due_date, zimsec_level, published, created_at, subject:subjects(name, code)')
      .eq('teacher_id', teacher.id)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    const assignments = data ?? []
    const ids = assignments.map((a: { id: string }) => a.id)

    // Fetch submission counts
    const { data: subs } = await supabase
      .from('sbp_submissions')
      .select('sbp_assignment_id, current_stage')
      .in('sbp_assignment_id', ids.length > 0 ? ids : ['none']) as {
        data: { sbp_assignment_id: string; current_stage: string }[] | null
        error: unknown
      }

    const counts: Record<string, { total: number; submitted: number; graded: number }> = {}
    for (const s of subs ?? []) {
      if (!counts[s.sbp_assignment_id]) counts[s.sbp_assignment_id] = { total: 0, submitted: 0, graded: 0 }
      counts[s.sbp_assignment_id].total++
      if (s.current_stage === 'submitted') counts[s.sbp_assignment_id].submitted++
    }

    // Fetch graded count
    const { data: graded } = await supabase
      .from('sbp_submissions')
      .select('sbp_assignment_id')
      .in('sbp_assignment_id', ids.length > 0 ? ids : ['none'])
      .not('graded_at', 'is', null) as { data: { sbp_assignment_id: string }[] | null; error: unknown }

    for (const g of graded ?? []) {
      if (counts[g.sbp_assignment_id]) counts[g.sbp_assignment_id].graded++
    }

    const result = assignments.map((a: { id: string }) => ({
      ...a,
      submission_count: counts[a.id]?.total ?? 0,
      submitted_count: counts[a.id]?.submitted ?? 0,
      graded_count: counts[a.id]?.graded ?? 0,
    }))

    return NextResponse.json({ assignments: result })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

// POST — create a new SBP assignment
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: teacher } = await supabase
      .from('teacher_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null; error: unknown }

    if (!teacher) return NextResponse.json({ error: 'No teacher profile' }, { status: 403 })

    const body = await req.json()
    const { title, description, guidelines, heritage_theme, subject_id, max_marks, due_date, zimsec_level, published } = body

    if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })

    const { data, error } = await supabase
      .from('sbp_assignments')
      .insert({
        teacher_id: teacher.id,
        title: title.trim(),
        description: description ?? null,
        guidelines: guidelines ?? null,
        heritage_theme: heritage_theme ?? null,
        subject_id: subject_id ?? null,
        max_marks: max_marks ?? 100,
        due_date: due_date ?? null,
        zimsec_level: zimsec_level ?? null,
        published: published ?? false,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ assignment: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

// PATCH — update / publish an assignment
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { data, error } = await supabase
      .from('sbp_assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ assignment: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

// DELETE — remove an assignment
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabase.from('sbp_assignments').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
