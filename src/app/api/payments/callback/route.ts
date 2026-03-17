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
    .select('id, user_id, plan_id, status')
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
    // Upgrade user plan
    const plan = PLANS[payment.plan_id as PlanId]
    const days = plan?.days ?? 30

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)

    await supabase
      .from('profiles')
      .update({
        plan: 'pro',
        pro_expires_at: expiresAt.toISOString(),
      })
      .eq('id', payment.user_id)
  }

  // Always respond 200 — Paynow retries on non-200
  return new NextResponse('OK', { status: 200 })
}
