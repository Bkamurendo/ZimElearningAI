export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sp } = await supabase
    .from('student_profiles')
    .select('id, zimsec_level, grade')
    .eq('user_id', user.id)
    .single() as { data: { id: string; zimsec_level: string; grade: string } | null; error: unknown }

  return NextResponse.json({
    user_id: user.id,
    student_id: sp?.id ?? null,
    zimsec_level: sp?.zimsec_level ?? 'olevel',
    grade: sp?.grade ?? null,
  })
}
