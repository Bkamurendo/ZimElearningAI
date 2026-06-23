export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch both base profile and student profile in parallel
  const [profileResult, studentProfileResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, avatar_url, role, preferred_language, onboarding_completed')
      .eq('id', user.id)
      .single(),
    supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
  ])

  if (profileResult.error && profileResult.error.code !== 'PGRST116') {
    return NextResponse.json({ error: profileResult.error.message }, { status: 500 })
  }

  return NextResponse.json({
    user,
    profile: profileResult.data,
    student_profile: studentProfileResult.data || null
  })
}
