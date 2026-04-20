'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'
import { sendSMS } from '@/lib/sms'
import { SMS_TEMPLATES } from '@/lib/sms-templates'

export async function login(formData: FormData): Promise<void> {
  let supabase
  try {
    supabase = createClient()
  } catch (err: any) {
    console.error('[Login Action] Configuration Error:', err.message)
    redirect(`/login?error=${encodeURIComponent('System configuration error: Use the system diagnostics page to verify environment variables.')}`)
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  // Safely check for user without crashing on null data
  const { data, error: userError } = await supabase.auth.getUser()
  const user = data?.user
  if (userError || !user) {
    console.error('[Login] Auth check failed:', userError?.message)
    redirect('/login?error=Authentication+failed')
  }

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
  // school_admin has its own dashboard path
  else if (profile.role === 'school_admin') redirect('/school-admin/dashboard')
  else redirect(`/${profile.role}/dashboard`)
}

export async function register(formData: FormData): Promise<void> {
  let supabase
  try {
    supabase = createClient()
  } catch (err: any) {
    console.error('[Register Action] Configuration Error:', err.message)
    redirect(`/register?error=${encodeURIComponent('System configuration error: Use the system diagnostics page to verify environment variables.')}`)
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const rawRole = formData.get('role') as string
  
  const ALLOWED_REGISTRATION_ROLES: UserRole[] = ['student', 'teacher', 'parent']
  const role: UserRole = ALLOWED_REGISTRATION_ROLES.includes(rawRole as UserRole)
    ? (rawRole as UserRole)
    : 'student'

  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zim-elearningai.co.zw'}/auth/callback`,
    },
  })

  if (signUpError) {
    redirect(`/register?error=${encodeURIComponent(signUpError.message)}`)
  }

  // Set role on the profile row created by the trigger
  const { data: authData, error: _userError } = await supabase.auth.getUser()
  const user = authData?.user
  
  if (user) {
    try {
      // 1. Core Profile Update
      const trialEndsAt = role === 'student'
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : null

      await supabase
        .from('profiles')
        .update({ 
          role, 
          full_name: fullName, 
          ...(trialEndsAt ? { trial_ends_at: trialEndsAt } : {}) 
        })
        .eq('id', user.id)

      // 2. Referral Tracking (Student Only)
      const refCode = (formData.get('ref') as string | null)?.trim().toUpperCase()
      if (refCode && role === 'student') {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', refCode)
          .single()

        if (referrer && referrer.id !== user.id) {
          await supabase.from('referrals').insert({
            referrer_id: referrer.id,
            referred_id: user.id,
          })
          await supabase.from('profiles')
            .update({ referred_by: referrer.id })
            .eq('id', user.id)
        }
      }

      // 3. Welcome SMS (Parent Only)
      if (role === 'parent') {
        const { data: parentProfile } = await supabase
          .from('parent_profiles')
          .select('phone_number')
          .eq('id', user.id)
          .single()

        if (parentProfile?.phone_number) {
          await sendSMS(
            parentProfile.phone_number as string,
            SMS_TEMPLATES.welcomeStudent(fullName)
          )
        }
      }
    } catch (err) {
      console.error('[Register] Post-registration side-effects failed:', err)
      // We continue anyway so the user isn't stuck half-registered
    }
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
