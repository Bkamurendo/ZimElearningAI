export const dynamic = 'force-dynamic';
/**
 * POST /api/payments/callback
 *
 * Server-to-server webhook from Paynow.
 * Paynow posts a URL-encoded body when a payment status changes.
 *
 * On successful payment → upgrades user to Pro plan in `profiles`.
 *
 * IMPORTANT: This endpoint must be publicly accessible (no auth cookie).
 *            The hash in the Paynow body acts as the authentication mechanism.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parsePaynowCallback, PLANS, type PlanId } from '@/lib/paynow'

export async function POST(req: NextRequest) {
  const raw = await req.text()

  const integrationKey = process.env.PAYNOW_INTEGRATION_KEY ?? ''
  const { valid, reference, status, paynowReference } =
    parsePaynowCallback(raw, integrationKey)

  if (!valid) {
    // Bad hash — reject silently with 200 so Paynow doesn't keep retrying
    return new NextResponse('OK', { status: 200 })
  }

  // reference format: zimlearn-{planId}-{userId8}-{timestamp}-{paymentId}
  // Extract the DB payment UUID (last segment)
  const parts = (reference ?? '').split('-')
  const paymentId = parts[parts.length - 1]

  if (!paymentId) {
    return new NextResponse('OK', { status: 200 })
  }

  const supabase = createClient()

  // Look up payment row
  const { data: payment } = await supabase
    .from('payments')
    .select('id, user_id, plan_id, status, item_type, item_id, amount_usd')
    .eq('id', paymentId)
    .single()

  if (!payment) {
    return new NextResponse('OK', { status: 200 })
  }

  // Idempotency: if already processed, skip
  if (payment.status === 'paid') {
    return new NextResponse('OK', { status: 200 })
  }

  const isPaid = (status ?? '').toLowerCase() === 'paid'

  // Update payment record
  await supabase
    .from('payments')
    .update({
      status: isPaid ? 'paid' : status?.toLowerCase() === 'cancelled' ? 'cancelled' : 'failed',
      paynow_reference: paynowReference,
      ...(isPaid ? { paid_at: new Date().toISOString() } : {}),
    })
    .eq('id', payment.id)

  if (isPaid) {
    const plan = PLANS[payment.plan_id as PlanId]
    const days = plan?.days ?? 30
    const now = new Date()

    // 1. Handle One-time Purchases (Reports, Subject Packs)
    if (payment.item_type === 'ai_grade_report' || payment.item_type === 'subject_pack') {
      await supabase.from('one_time_purchases').insert({
        user_id: payment.user_id,
        item_type: payment.item_type,
        item_id: payment.item_id,
        amount_usd: payment.amount_usd,
        status: 'completed',
        payment_id: payment.id,
      })

      if (payment.item_type === 'subject_pack' && payment.item_id) {
        // Unlock subject for student
        await supabase.from('subject_access').upsert({
          user_id: payment.user_id,
          subject_id: payment.item_id,
          expires_at: new Date(now.getFullYear(), 11, 31).toISOString(), // End of current year
        })
      }
    } 
    // 2. Handle Parent Monitoring
    else if (payment.item_type === 'monitoring') {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)
      await supabase
        .from('profiles')
        .update({ monitoring_expires_at: expiresAt.toISOString() })
        .eq('id', payment.user_id)
    }
    // 3. Handle Main Subscriptions (Pro/Elite)
    else {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + days)

      await supabase
        .from('profiles')
        .update({
          plan: plan?.tier ?? 'pro',
          pro_expires_at: expiresAt.toISOString(),
        })
        .eq('id', payment.user_id)
    }

    // Trigger referral reward if this user was referred
    try {
      const { data: referral } = await supabase
        .from('referrals')
        .select('id, referrer_id, reward_granted')
        .eq('referred_id', payment.user_id)
        .single()

      if (referral && !referral.reward_granted) {
        const now = new Date().toISOString()
        await supabase.from('referrals').update({
          converted_at: now,
          reward_granted: true,
          reward_granted_at: now,
        }).eq('id', referral.id)

        // Increment referral_credits for the referrer
        const { data: referrer } = await supabase
          .from('profiles')
          .select('referral_credits, email, full_name')
          .eq('id', referral.referrer_id)
          .single()

        if (referrer) {
          await supabase.from('profiles')
            .update({ referral_credits: (referrer.referral_credits ?? 0) + 1 })
            .eq('id', referral.referrer_id)

          // Send thank-you email to referrer
          if (referrer.email) {
            const { sendEmail } = await import('@/lib/email')
            const name = referrer.full_name?.split(' ')[0] ?? 'there'
            await sendEmail(
              referrer.email,
              '🎉 You earned a free month on ZimLearn!',
              `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
                <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px;text-align:center">
                  <h1 style="color:#fff;margin:0;font-size:22px">You earned a free month! 🎉</h1>
                </div>
                <div style="padding:32px">
                  <p style="font-size:16px;color:#374151">Hi ${name},</p>
                  <p style="font-size:16px;color:#374151">Someone you referred just upgraded to a paid ZimLearn plan. As promised, <strong>1 free month</strong> has been credited to your account.</p>
                  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;text-align:center">
                    <p style="font-size:32px;font-weight:900;color:#15803d;margin:0">+1 Month FREE</p>
                    <p style="font-size:13px;color:#374151;margin:8px 0 0">Applied to your next renewal</p>
                  </div>
                  <div style="text-align:center;margin:24px 0">
                    <a href="https://zim-elearningai.co.zw/student/referral" style="background:#16a34a;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block">View My Referrals</a>
                  </div>
                </div>
              </div>`
            ).catch(() => { /* email failure non-critical */ })
          }
        }
      }
    } catch {
      // Referral reward must never break payment processing
    }
  }

  // Always respond 200 — Paynow retries on non-200
  return new NextResponse('OK', { status: 200 })
}
