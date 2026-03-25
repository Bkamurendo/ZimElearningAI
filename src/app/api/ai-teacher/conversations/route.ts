import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null; error: unknown }

    if (!studentProfile) return NextResponse.json({ conversations: [] })

    const { data } = await supabase
      .from('ai_teacher_conversations')
      .select('id, title, updated_at')
      .eq('student_id', studentProfile.id)
      .order('updated_at', { ascending: false })
      .limit(30)

    return NextResponse.json({ conversations: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
