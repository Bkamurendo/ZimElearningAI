'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ZimsecLevel } from '@/types/database'

export async function completeStudentOnboarding(formData: FormData): Promise<{ success: boolean }> {
  const supabase = createClient()

  const { data, error: authError } = await supabase.auth.getUser()
  const user = data?.user
  if (authError || !user) redirect('/login')

  const zimsecLevel = formData.get('zimsec_level') as ZimsecLevel
  const grade = formData.get('grade') as string
  const subjectIds = formData.getAll('subject_ids') as string[]

  // Upsert student_profiles row
  const { data: studentProfile, error: spError } = await supabase
    .from('student_profiles')
    .upsert({ user_id: user.id, zimsec_level: zimsecLevel, grade })
    .select('id')
    .single()

  if (spError || !studentProfile) {
    redirect('/onboarding?error=Failed+to+save+student+profile')
  }

  // Enrol in selected subjects — replace existing
  await supabase.from('student_subjects').delete().eq('student_id', studentProfile.id)

  if (subjectIds.length > 0) {
    const rows = subjectIds.map((subject_id) => ({
      student_id: studentProfile.id,
      subject_id,
    }))
    const { error: subErr } = await supabase.from('student_subjects').insert(rows)
    if (subErr) redirect('/onboarding?error=Failed+to+save+subjects')
  }

  // Mark onboarding complete
  await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id)

  revalidatePath('/', 'layout')
}

export async function completeGeneralOnboarding(formData: FormData): Promise<void> {
  const supabase = createClient()

  const { data, error: authError } = await supabase.auth.getUser()
  const user = data?.user
  if (authError || !user) redirect('/login')

  const role = formData.get('role') as string

  await supabase
    .from('profiles')
    .update({ role, onboarding_completed: true })
    .eq('id', user.id)

  if (role === 'teacher') {
    const qualification = formData.get('qualification') as string
    await supabase.from('teacher_profiles').upsert({ user_id: user.id, qualification })
  }

  if (role === 'parent') {
    const phone = formData.get('phone_number') as string
    await supabase.from('parent_profiles').upsert({ user_id: user.id, phone_number: phone })
  }

  revalidatePath('/', 'layout')
  redirect(`/${role}/dashboard`)
}
