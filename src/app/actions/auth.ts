'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

export async function login(formData: FormData): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?error=Authentication+failed')

  // Fetch profile — first try with mfa_method, fall back if column doesn't exist yet
  type ProfileShape = { role: string; onboarding_completed: boolean; mfa_method?: string }
  let profile: ProfileShape | null = null
  const { data: fullProfile, error: fullProfileError } = await supabase
    .from('profiles')
    .select('role, onboarding_completed, mfa_method')
    .eq('id', user.id)
    .single()

  if (fullProfileError) {
    // Column may not exist yet (migration pending) — fetch without it
    const { data: basicProfile } = await supabase
      .from('profiles')
      .select('role, onboarding_completed')
      .eq('id', user.id)
      .single()
    profile = basicProfile as ProfileShape | null
  } else {
    profile = fullProfile as ProfileShape | null
  }

  // 1. Check Supabase TOTP (AAL2) — for authenticator app users
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (
    aalData &&
    aalData.nextLevel === 'aal2' &&
    aalData.currentLevel !== 'aal2'
  ) {
    revalidatePath('/', 'layout')
    redirect('/mfa-verify')
  }

  // 2. Check custom email / phone OTP MFA
  if (profile?.mfa_method === 'email' || profile?.mfa_method === 'phone') {
    revalidatePath('/', 'layout')
    redirect(`/mfa-verify?method=${profile.mfa_method}`)
  }

  revalidatePath('/', 'layout')

  if (!profile?.onboarding_completed) redirect('/onboarding')
  else redirect(`/${profile.role}/dashboard`)
}

export async function register(formData: FormData): Promise<void> {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  // Security: only allow public-facing roles; 'admin' must be assigned manually via DB
  const rawRole = formData.get('role') as string
  const ALLOWED_REGISTRATION_ROLES: UserRole[] = ['student', 'teacher', 'parent']
  const role: UserRole = ALLOWED_REGISTRATION_ROLES.includes(rawRole as UserRole)
    ? (rawRole as UserRole)
    : 'student'

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`)
  }

  // Set role on the profile row created by the trigger
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    // Give every new student a 7-day free Pro trial
    const trialEndsAt = role === 'student'
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : null
    await supabase
      .from('profiles')
      .update({ role, full_name: fullName, ...(trialEndsAt ? { trial_ends_at: trialEndsAt } : {}) })
      .eq('id', user.id)
  }

  revalidatePath('/', 'layout')
  redirect('/onboarding')
}

export async function logout(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
