export const dynamic = 'force-dynamic';
/**
 * POST /api/admin/send-sms
 *
 * Admin-only endpoint to send bulk SMS messages to platform audiences.
 *
 * Body:
 *   {
 *     audience: 'all' | 'students' | 'teachers' | 'trial_ending' | 'schools',
 *     message: string
 *   }
 *
 * Returns:
 *   { sent: number, failed: number, errors: string[] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendBulkSMS } from '@/lib/sms'

// ── Auth guard ────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, supabase }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return {
    user: profile?.role === 'admin' ? user : null,
    supabase,
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase } = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    // Parse and validate body
    let body: { audience: string; message: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { audience, message } = body

    const VALID_AUDIENCES = ['all', 'students', 'teachers', 'trial_ending', 'schools'] as const
    type Audience = typeof VALID_AUDIENCES[number]

    if (!VALID_AUDIENCES.includes(audience as Audience)) {
      return NextResponse.json(
        { error: `audience must be one of: ${VALID_AUDIENCES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    // ── Resolve contacts by audience ──────────────────────────────────────────

    type ValidRecipient = { phone_number?: string; email?: string; full_name?: string }

    const targets: ValidRecipient[] = []

    if (audience === 'all' || audience === 'students' || audience === 'teachers') {
      const query = supabase
        .from('profiles')
        .select('phone_number, email, full_name')

        .eq('suspended', false)

      if (audience === 'students') {
        const { data } = await query.eq('role', 'student') as { data: ValidRecipient[] | null }
        if (data) targets.push(...data)
      } else if (audience === 'teachers') {
        const { data } = await query.eq('role', 'teacher') as { data: ValidRecipient[] | null }
        if (data) targets.push(...data)
      } else {
        const { data } = await query as { data: ValidRecipient[] | null }
        if (data) targets.push(...data)
      }

      // Also include parent phone numbers from parent_profiles
      if (audience === 'all') {
        const { data: parentRows } = await supabase
          .from('parent_profiles')
          .select('phone_number')
          .not('phone_number', 'is', null) as { data: { phone_number: string }[] | null }
        if (parentRows) {
          targets.push(...parentRows.map(r => ({ phone_number: r.phone_number })))
        }
      }
    }

    if (audience === 'trial_ending') {
      const now = new Date()
      const cutoff = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()

      const { data } = await supabase
        .from('profiles')
        .select('phone_number, email, full_name')

        .eq('role', 'student')
        .eq('suspended', false)
        .not('trial_ends_at', 'is', null)
        .lte('trial_ends_at', cutoff)
        .gte('trial_ends_at', now.toISOString()) as { data: ValidRecipient[] | null }

      if (data) targets.push(...data)
    }

    if (audience === 'schools') {
      const { data } = await supabase
        .from('profiles')
        .select('phone_number, email, full_name')

        .eq('role', 'school_admin')
        .eq('suspended', false) as { data: ValidRecipient[] | null }

      if (data) targets.push(...data)
    }

    // Filter valid contacts and Deduplicate by email/phone
    const sentSet = new Set()
    const validTargets = targets.filter(t => {
      const id = t.phone_number || t.email
      if (!id || sentSet.has(id)) return false
      sentSet.add(id)
      return true
    })


    if (validTargets.length === 0) {
      return NextResponse.json(
        { sent: 0, failed: 0, errors: ['No contact details found for the selected audience'] }
      )
    }

    // ── Send ──────────────────────────────────────────────────────────────────

    const { sendEmail } = await import('@/lib/email')
    
    let totalSent = 0
    let totalFailed = 0
    const errorsList: string[] = []

    // SMS batch
    const smsTargets = validTargets.filter(t => t.phone_number)
    if (smsTargets.length > 0) {
      const recipients = smsTargets.map(t => ({ phone: t.phone_number!, message: message.trim() }))
      const smsResult = await sendBulkSMS(recipients)
      totalSent += smsResult.sent
      totalFailed += smsResult.failed
      if (smsResult.errors) errorsList.push(...smsResult.errors)
    }

    // Email batch (fallback for those without phone numbers)
    const emailTargets = validTargets.filter(t => !t.phone_number && t.email)

    if (emailTargets.length > 0) {
      for (const t of emailTargets) {
        const firstName = t.full_name?.split(' ')[0] || 'User'
        const htmlMsg = `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
            <h2 style="color:#d97706">Update from Zim E-Learning AI</h2>
            <p style="font-size:16px;">Hi ${firstName},</p>
            <p style="font-size:16px;">${message.trim()}</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
            <p style="color:#9ca3af;font-size:12px;text-align:center;">Zim E-Learning AI Team</p>
          </div>
        `
        const res = await sendEmail(t.email!, 'Important Update from ZimLearn', htmlMsg)
        if (res.success) totalSent++
        else {
          totalFailed++
          if (res.error) errorsList.push(res.error)
        }
      }
    }

    // Audit log (non-blocking — don't let this crash the request)
    supabase.from('admin_activity_log').insert({
      admin_id: user.id,
      action: 'bulk_contact',
      resource_type: 'reminder',
      new_values: {
        audience,
        total: validTargets.length,
        sent: totalSent,
        failed: totalFailed,
      },
    }).then(({ error }) => {
      if (error) console.error('[AUDIT] bulk_contact log failed:', error)
    })

    return NextResponse.json({
      sent: totalSent,
      failed: totalFailed,
      errors: errorsList,
    })
  } catch (err) {
    console.error('[/api/admin/send-sms]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  console.log('[REMINDER] GET handler triggered')
  try {
    const { user, supabase } = await requireAdmin()
    console.log('[REMINDER] Auth check - user:', user?.id ?? 'NO USER')

    if (!user) {
      console.error('[REMINDER] Auth failed — no admin user found in session')
      return NextResponse.redirect(new URL('/admin/trials?error=not_authenticated', req.url))
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    console.log('[REMINDER] Target userId:', userId)

    if (!userId) {
      return NextResponse.redirect(new URL('/admin/trials', req.url))
    }

    // Fetch the target user's contact details
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('phone_number, email, full_name')

      .eq('id', userId)
      .single()

    console.log('[REMINDER] Target profile:', JSON.stringify(targetProfile))
    if (profileError) console.error('[REMINDER] Profile fetch error:', profileError)

    if (!targetProfile?.phone_number && !targetProfile?.email) {
      console.error('[REMINDER] No contact found for userId:', userId)
      return NextResponse.redirect(new URL('/admin/trials?error=no_contact', req.url))
    }


    // Default message template
    const firstName = targetProfile.full_name?.split(' ')[0] || 'Student'
    const defaultMessage = `Hi ${firstName}, your AI E-Learning Platform ZIM free trial is ending soon! Don't lose access, upgrade to a paid plan today: https://zim-elearningai.co.zw/pricing`

    let sentResult = { sent: 0 }
    let actionType = 'single_sms_reminder'

    if (targetProfile.phone_number) {
      console.log('[REMINDER] Sending SMS to:', targetProfile.phone_number)
      sentResult = await sendBulkSMS([{ phone: targetProfile.phone_number, message: defaultMessage }])
      console.log('[REMINDER] SMS result:', JSON.stringify(sentResult))
    } else if (targetProfile.email) {

      console.log('[REMINDER] Sending email to:', targetProfile.email)
      const { sendEmail } = await import('@/lib/email')
      const htmlMsg = `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <h2 style="color:#d97706">Your Trial is Ending Soon!</h2>
          <p style="font-size:16px;">Hi ${firstName},</p>
          <p style="font-size:16px;">Your free trial for AI E-Learning Platform ZIM is nearing its end!</p>
          <p style="font-size:16px;">Don't lose your progress and access to all premium learning materials. Upgrade your plan now to continue your educational journey without any interruptions.</p>
          <div style="text-align:center;margin:30px 0">
            <a href="https://zim-elearningai.co.zw/pricing" style="background-color:#16a34a;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;font-size:16px;">View Pro Plans &amp; Upgrade</a>
          </div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
          <p style="color:#9ca3af;font-size:12px;text-align:center;">Zim E-Learning AI Team</p>
        </div>
      `
      const emailRes = await sendEmail(targetProfile.email, 'Action Required: Your Free Trial is Expiring', htmlMsg)
      console.log('[REMINDER] Email result:', JSON.stringify(emailRes))
      sentResult = { sent: emailRes.success ? 1 : 0 }
      actionType = 'single_email_reminder'
    }

    // Audit log (non-blocking)
    supabase.from('admin_activity_log').insert({
      admin_id: user.id,
      action: actionType,
      resource_type: 'reminder',
      new_values: {
        target_user: userId,
        sent: sentResult.sent,
        method: targetProfile.phone_number ? 'sms' : 'email'
      },

    }).then(({ error }) => {
      if (error) console.error('[REMINDER] Audit log failed:', error)
    })

    if (sentResult.sent === 0) {
      console.error('[REMINDER] Delivery failed — sent count is 0')
      return NextResponse.redirect(new URL('/admin/trials?error=delivery_failed', req.url))
    }

    console.log('[REMINDER] Success! Redirecting...')
    return NextResponse.redirect(new URL(`/admin/trials?success=${actionType}`, req.url))
  } catch (err) {
    console.error('[/api/admin/send-sms GET] Unhandled error:', err)
    return NextResponse.redirect(new URL('/admin/trials?error=reminder_failed', req.url))
  }
}
