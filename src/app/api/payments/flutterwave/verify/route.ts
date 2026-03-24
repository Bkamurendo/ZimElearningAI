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

  // Redirect to success screen
  return NextResponse.redirect(`${base}/student/upgrade?flw=paid`)
}
