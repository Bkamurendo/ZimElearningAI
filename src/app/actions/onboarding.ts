'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ZimsecLevel } from '@/types/database'

export async function completeStudentOnboarding(formData: FormData): Promise<{ error: string } | void> {
  const supabase = createClient()

  const { data, error: authError } = await supabase.auth.getUser()
  const user = data?.user
  if (authError || !user) return { error: 'Session expired. Please log in again.' }

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
    return { error: 'Failed to save your profile. Please try again.' }
  }

  // Enrol in selected subjects — replace existing
  await supabase.from('student_subjects').delete().eq('student_id', studentProfile.id)

  if (subjectIds.length > 0) {
    const rows = subjectIds.map((subject_id) => ({
      student_id: studentProfile.id,
      subject_id,
    }))
    const { error: subErr } = await supabase.from('student_subjects').insert(rows)
    if (subErr) return { error: 'Failed to save subjects. Please try again.' }
  }

  // Mark onboarding complete — this is the critical update
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', user.id)

  if (profileErr) {
    return { error: 'Failed to complete onboarding. Please try again.' }
  }

  // Best-effort: set trial & referral (these columns may not exist yet — never block onboarding)
  try {
    const referralCode = formData.get('referral_code') as string
    let trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    let referrerId: string | null = null

    if (referralCode) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode.toUpperCase())
        .single()
      if (referrer) {
        referrerId = referrer.id
        trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    }

    await supabase.from('profiles').update({
      trial_ends_at: trialEndsAt.toISOString(),
      ...(referrerId && { referred_by: referrerId }),
    }).eq('id', user.id)

    if (referrerId) {
      await supabase.from('referrals').insert({ referrer_id: referrerId, referred_id: user.id })
    }
  } catch {
    // Non-critical — don't fail onboarding if trial columns are missing
  }

  revalidatePath('/', 'layout')
  redirect('/student/dashboard')
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
