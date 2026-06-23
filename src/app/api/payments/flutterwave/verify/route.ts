export const dynamic = 'force-dynamic';
/**
 * GET /api/payments/flutterwave/verify
 *
 * Flutterwave redirects the browser here after the user completes (or cancels) payment.
 * Query params from Flutterwave: transaction_id, tx_ref, status
 * Our own param: paymentId (the DB row UUID we appended to the redirect URL)
 *
 * This route verifies the transaction with Flutterwave's API, updates the DB,
 * upgrades the user to Pro if paid, then redirects the browser to the upgrade page.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyFlutterwavePayment } from '@/lib/flutterwave'
import { PLANS, type PlanId } from '@/lib/paynow'

export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const params = req.nextUrl.searchParams

  const transactionId = params.get('transaction_id')
  const flwStatus     = params.get('status')          // 'successful' | 'cancelled' | 'failed'
  const paymentId     = params.get('paymentId')       // our DB UUID

  if (!paymentId) {
    return NextResponse.redirect(`${base}/student/upgrade?flw=error`)
  }

  const supabase = createClient()

  // Cancelled by user
  if (flwStatus === 'cancelled') {
    await supabase
      .from('payments')
      .update({ status: 'cancelled' })
      .eq('id', paymentId)

    return NextResponse.redirect(`${base}/student/upgrade?flw=cancelled`)
  }

  if (!transactionId) {
    return NextResponse.redirect(`${base}/student/upgrade?flw=error`)
  }

  // Verify with Flutterwave API
  const verification = await verifyFlutterwavePayment(transactionId)

  if (!verification.success || !verification.paid) {
    console.error('[flutterwave/verify] Verification failed:', verification.error)
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('id', paymentId)

    return NextResponse.redirect(`${base}/student/upgrade?flw=failed`)
  }

  // Look up payment row
  const { data: payment } = await supabase
    .from('payments')
    .select('plan_id, status, user_id')
    .eq('id', paymentId)
    .single()

  if (!payment) {
    return NextResponse.redirect(`${base}/student/upgrade?flw=error`)
  }

  // Idempotency — already processed
  if (payment.status === 'paid') {
    return NextResponse.redirect(`${base}/student/upgrade?flw=paid`)
  }

  // Mark payment as paid
  await supabase
    .from('payments')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      paynow_reference: verification.txRef ?? null,
    })
    .eq('id', paymentId)

  // Upgrade user to the correct plan tier based on what they purchased
  const plan = PLANS[payment.plan_id as PlanId]
  const days = plan?.days ?? 30
  const tierName = plan?.tier ?? 'pro'   // 'starter' | 'pro' | 'elite'
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + days)

  await supabase
    .from('profiles')
    .update({
      plan: tierName,
      pro_expires_at: expiresAt.toISOString(),
    })
    .eq('id', payment.user_id)

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

      const { data: referrer } = await supabase
        .from('profiles')
        .select('referral_credits, email, full_name')
        .eq('id', referral.referrer_id)
        .single()

      if (referrer) {
        await supabase.from('profiles')
          .update({ referral_credits: (referrer.referral_credits ?? 0) + 1 })
          .eq('id', referral.referrer_id)

        if (referrer.email) {
          const { sendEmail } = await import('@/lib/email')
          const name = referrer.full_name?.split(' ')[0] ?? 'there'
          await sendEmail(
            referrer.email,
            '🎉 You earned a free month on ZimLearn!',
            `<div style="font-family:sans-serif;max-width:500px;margin:0 auto"><div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px;text-align:center;border-radius:12px 12px 0 0"><h1 style="color:#fff;margin:0">You earned a free month! 🎉</h1></div><div style="padding:32px;background:#fff"><p style="font-size:16px;color:#374151">Hi ${name}, someone you referred just upgraded! <strong>1 free month</strong> has been credited to your account.</p><div style="text-align:center;margin:24px 0"><a href="https://zim-elearningai.co.zw/student/referral" style="background:#16a34a;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block">View My Referrals</a></div></div></div>`
          ).catch(() => {})
        }
      }
    }
  } catch {
    // Referral reward must never break payment flow
  }

  // Redirect to success screen
  return NextResponse.redirect(`${base}/student/upgrade?flw=paid`)
}
