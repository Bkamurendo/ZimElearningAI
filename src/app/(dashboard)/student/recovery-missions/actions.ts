'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeMission(missionId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Verify ownership before updating
  const { data: sp } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!sp) return

  await supabase
    .from('student_remediation_missions')
    .update({ status: 'completed' })
    .eq('id', missionId)
    .eq('student_id', sp.id)

  revalidatePath('/student/recovery-missions')
  revalidatePath('/student/dashboard')
}
