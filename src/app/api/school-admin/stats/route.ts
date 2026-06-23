export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'school_admin' || !profile.school_id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const schoolId = profile.school_id as string

  const [
    { count: studentCount },
    { count: teacherCount },
    { data: aiData },
    { data: school },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('role', 'student'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('role', 'teacher'),
    supabase.from('profiles').select('ai_requests_today').eq('school_id', schoolId),
    supabase.from('schools').select('name, subscription_plan, subscription_expires_at, max_students').eq('id', schoolId).single(),
  ])

  const aiRequestsToday = (aiData ?? []).reduce((sum: number, p: { ai_requests_today: number | null }) => sum + (p.ai_requests_today ?? 0), 0)

  return NextResponse.json({
    studentCount: studentCount ?? 0,
    teacherCount: teacherCount ?? 0,
    aiRequestsToday,
    school,
  })
}
