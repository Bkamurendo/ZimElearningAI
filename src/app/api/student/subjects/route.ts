export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/* ── GET — enrolled subjects for the current student ─────────── */
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: studentProfile } = await supabase
      .from('student_profiles').select('id').eq('user_id', user.id).single()
    if (!studentProfile) return NextResponse.json({ subjects: [] })

    const { data, error } = await supabase
      .from('student_subjects')
      .select('subjects(id, name, code, zimsec_level)')
      .eq('student_id', studentProfile.id)

    if (error) throw new Error(error.message)

    const subjects = (data ?? [])
      .map(row => (row.subjects as unknown as { id: string; name: string; code: string; zimsec_level: string } | null))
      .filter(Boolean)

    return NextResponse.json({ subjects })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
