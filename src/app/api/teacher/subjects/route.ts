import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    if (!teacher) return NextResponse.json({ subjects: [] })

    const { data } = await supabase
      .from('teacher_subjects')
      .select('subjects(id, name, code, zimsec_level)')
      .eq('teacher_id', teacher.id) as { data: { subjects: { id: string; name: string; code: string; zimsec_level: string } | null }[] | null; error: unknown }

    const subjects = (data ?? [])
      .map(row => row.subjects)
      .filter(Boolean)

    return NextResponse.json({ subjects })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
