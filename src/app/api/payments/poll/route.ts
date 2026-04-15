/**
 * GET /api/payments/poll?paymentId=xxx
 *
 * Client-side polling endpoint.
 * The upgrade page polls this every 5s while waiting for EcoCash confirmation.
 *
 * Returns:
 *   { status: 'pending' | 'paid' | 'failed' | 'cancelled', plan?: 'pro' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pollPaynowStatus, PLANS } from '@/lib/paynow'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const paymentId = req.nextUrl.searchParams.get('paymentId')
  if (!paymentId) {
    return NextResponse.json({ error: 'paymentId required' }, { status: 400 })
  }

  // Fetch payment — must belong to the requesting user
  const { data: payment } = await supabase
    .from('payments')
    .select('id, user_id, status, poll_url, plan_id')
    .eq('id', paymentId)
    .eq('user_id', user.id)   // ownership check
    .single()

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  // If already resolved in DB, return immediately
  if (payment.status === 'paid') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, pro_expires_at')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      status: 'paid',
      plan: profile?.plan ?? 'pro',
      proExpiresAt: profile?.pro_expires_at,
    })
  }

  if (payment.status === 'failed' || payment.status === 'cancelled') {
    return NextResponse.json({ status: payment.status })
  }

  // Status still pending in DB — proactively poll Paynow for real-time status
  if (payment.poll_url) {
    const live = await pollPaynowStatus(payment.poll_url)

    if (live.paid) {
      // Callback may not have fired yet — update DB proactively
      await supabase
        .from('payments')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', payment.id)

      // Activate the correct plan tier based on what was purchased
      const planMeta = PLANS[payment.plan_id as keyof typeof PLANS]
      const tierToActivate = planMeta?.tier ?? 'pro'
      const daysToGrant = planMeta?.days ?? 30
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + daysToGrant)

      await supabase
        .from('profiles')
        .update({ plan: tierToActivate, pro_expires_at: expiresAt.toISOString() })
        .eq('id', user.id)

      return NextResponse.json({ status: 'paid', plan: tierToActivate })
    }

    if (live.status.toLowerCase() === 'cancelled' || live.status.toLowerCase() === 'failed') {
      await supabase
        .from('payments')
        .update({ status: live.status.toLowerCase() })
        .eq('id', payment.id)

      return NextResponse.json({ status: live.status.toLowerCase() })
    }
  }

  return NextResponse.json({ status: 'pending' })
}
