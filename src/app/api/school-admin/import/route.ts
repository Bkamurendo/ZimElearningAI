export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ImportRow {
  full_name: string
  email: string
  password: string
  zimsec_level?: string  // for students
  grade?: string          // for students
  qualification?: string  // for teachers
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'school_admin' || !adminProfile.school_id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const schoolId = adminProfile.school_id as string
  const body = await req.json()
  const { type, rows } = body as { type: 'students' | 'teachers'; rows: ImportRow[] }

  if (!type || !rows?.length) {
    return NextResponse.json({ error: 'Missing type or rows' }, { status: 400 })
  }

  // Check school capacity for student imports
  if (type === 'students') {
    const { data: school } = await supabase.from('schools').select('max_students').eq('id', schoolId).single()
    const { count: current } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('role', 'student')
    const remaining = (school?.max_students ?? 50) - (current ?? 0)
    if (rows.length > remaining) {
      return NextResponse.json({
        error: `School capacity exceeded. ${remaining} student seat${remaining !== 1 ? 's' : ''} remaining, trying to import ${rows.length}.`,
      }, { status: 400 })
    }
  }

  const role = type === 'students' ? 'student' : 'teacher'
  const results: { email: string; success: boolean; error?: string }[] = []

  for (const row of rows) {
    if (!row.email || !row.full_name || !row.password) {
      results.push({ email: row.email ?? '?', success: false, error: 'Missing required fields' })
      continue
    }

    // Create auth user via Supabase admin (service role needed for this — use signUp instead)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: row.email.trim().toLowerCase(),
      password: row.password,
      options: {
        data: { full_name: row.full_name, role },
      },
    })

    if (signUpError || !signUpData.user) {
      results.push({ email: row.email, success: false, error: signUpError?.message ?? 'Sign up failed' })
      continue
    }

    const newUserId = signUpData.user.id

    // Update profile with role, school_id, and name
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role,
        full_name: row.full_name,
        school_id: schoolId,
        onboarding_completed: true,
      })
      .eq('id', newUserId)

    if (profileError) {
      results.push({ email: row.email, success: false, error: profileError.message })
      continue
    }

    // Create student_profile row if student
    if (type === 'students') {
      await supabase.from('student_profiles').insert({
        user_id: newUserId,
        zimsec_level: (row.zimsec_level ?? 'olevel') as 'olevel' | 'alevel' | 'primary',
        grade: row.grade ?? null,
      }).select()
    }

    // Create teacher_profile row if teacher
    if (type === 'teachers') {
      await supabase.from('teacher_profiles').insert({
        user_id: newUserId,
        qualification: row.qualification ?? null,
        is_approved: true,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      }).select()
    }

    results.push({ email: row.email, success: true })
  }

  const successCount = results.filter(r => r.success).length
  const failures = results.filter(r => !r.success)

  return NextResponse.json({ successCount, failures, total: rows.length })
}
