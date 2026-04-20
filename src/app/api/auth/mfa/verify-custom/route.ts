export const dynamic = 'force-dynamic';
/**
 * POST /api/auth/mfa/verify-custom
 *
 * Verifies a 6-digit OTP for email or phone second-factor authentication.
 * Marks the code as used on success.
 *
 * Body: { method: 'email' | 'phone', code: string }
 * Returns: { success: true, role, onboarding_completed } or { error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { verifyOtpHash } from '@/lib/otp'

export async function POST(req: NextRequest) {
  try {
    const { method, code } = (await req.json()) as { method?: string; code?: string }

    if ((method !== 'email' && method !== 'phone') || !code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Auth guard
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    // Use service role to bypass RLS on otp_codes
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Find latest valid (unused, unexpired) code for this user + method
    const { data: otpRows, error: fetchErr } = await serviceClient
      .from('otp_codes')
      .select('id, code_hash, expires_at, used')
      .eq('user_id', user.id)
      .eq('method', method)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchErr) throw new Error(fetchErr.message)
    if (!otpRows || otpRows.length === 0) {
      return NextResponse.json(
        { error: 'Code expired or not found. Please request a new code.' },
        { status: 400 },
      )
    }

    const otp = otpRows[0]

    // Verify hash
    if (!verifyOtpHash(code, otp.code_hash)) {
      return NextResponse.json(
        { error: 'Incorrect code — please try again' },
        { status: 400 },
      )
    }

    // Mark as used
    await serviceClient
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otp.id)

    // Return profile info for redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_completed')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      role: profile?.role ?? 'student',
      onboarding_completed: profile?.onboarding_completed ?? false,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Verification failed'
    console.error('[mfa/verify-custom]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
