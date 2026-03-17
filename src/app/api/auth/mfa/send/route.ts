/**
 * POST /api/auth/mfa/send
 *
 * Generates a 6-digit OTP, stores the hash in otp_codes,
 * then sends it to the user via email (Resend) or SMS (Africa's Talking).
 *
 * Body: { method: 'email' | 'phone' }
 * Returns: { success: true } or { error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { generateOtp, hashOtp, otpExpiresAt } from '@/lib/otp'

/* ── helpers ─────────────────────────────────────────────────────────────── */

async function sendEmailOtp(to: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY not configured')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ZimLearn Security <security@zimlearn.app>',
      to: [to],
      subject: `Your ZimLearn verification code: ${code}`,
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto">
          <h2 style="color:#16a34a">ZimLearn — Verification Code</h2>
          <p>Your one-time verification code is:</p>
          <div style="font-size:40px;font-weight:bold;letter-spacing:0.3em;color:#1e1b4b;padding:20px 0">
            ${code}
          </div>
          <p style="color:#6b7280;font-size:13px">
            This code expires in <strong>10 minutes</strong>.<br>
            If you did not request this, you can safely ignore it.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
          <p style="color:#9ca3af;font-size:11px">ZimLearn · Empowering Zimbabwean students</p>
        </div>
      `,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend error: ${body}`)
  }
}

async function sendSmsOtp(to: string, code: string): Promise<void> {
  const username = process.env.AFRICASTALKING_USERNAME
  const apiKey   = process.env.AFRICASTALKING_API_KEY
  if (!username || !apiKey) throw new Error('Africa\'s Talking credentials not configured')

  // Sandbox vs live endpoint
  const isSandbox = username === 'sandbox'
  const endpoint  = isSandbox
    ? 'https://api.sandbox.africastalking.com/version1/messaging'
    : 'https://api.africastalking.com/version1/messaging'

  // Ensure E.164 format for Zimbabwe (+263)
  let phone = to.replace(/\s/g, '')
  if (phone.startsWith('07') || phone.startsWith('08')) {
    phone = '+263' + phone.slice(1)
  } else if (!phone.startsWith('+')) {
    phone = '+' + phone
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username,
      to: phone,
      message: `Your ZimLearn verification code is: ${code}. Valid for 10 minutes.`,
      ...(isSandbox ? {} : { from: 'ZimLearn' }),
    }).toString(),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Africa's Talking error: ${body}`)
  }
}

/* ── route handler ───────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const { method } = (await req.json()) as { method?: string }

    if (method !== 'email' && method !== 'phone') {
      return NextResponse.json({ error: 'Invalid method' }, { status: 400 })
    }

    // Auth guard — user must be logged in
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    // Load profile for email + phone
    const { data: profile } = await supabase
      .from('profiles')
      .select('mfa_method, mfa_phone')
      .eq('id', user.id)
      .single()

    if (method === 'email' && profile?.mfa_method !== 'email') {
      return NextResponse.json({ error: 'Email OTP not enabled on this account' }, { status: 400 })
    }
    if (method === 'phone' && profile?.mfa_method !== 'phone') {
      return NextResponse.json({ error: 'Phone OTP not enabled on this account' }, { status: 400 })
    }
    if (method === 'phone' && !profile?.mfa_phone) {
      return NextResponse.json({ error: 'No phone number registered' }, { status: 400 })
    }

    // Rate-limit: max 3 codes per user per 5 minutes
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { count } = await serviceClient
      .from('otp_codes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('method', method)
      .gte('created_at', fiveMinAgo)

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Too many codes sent. Please wait a few minutes and try again.' },
        { status: 429 },
      )
    }

    // Generate + store OTP
    const code = generateOtp()
    const { error: insertErr } = await serviceClient.from('otp_codes').insert({
      user_id:    user.id,
      code_hash:  hashOtp(code),
      method,
      expires_at: otpExpiresAt(),
    })
    if (insertErr) throw new Error(insertErr.message)

    // Send
    if (method === 'email') {
      await sendEmailOtp(user.email!, code)
    } else {
      await sendSmsOtp(profile!.mfa_phone!, code)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send code'
    console.error('[mfa/send]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
