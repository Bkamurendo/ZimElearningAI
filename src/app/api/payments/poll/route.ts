export const dynamic = 'force-dynamic';
/**
 * GET /api/payments/poll?paymentId=xxx
 *
 * Client-side polling endpoint.
 * The upgrade page polls this every 5s while waiting for EcoCash confirmation.
 *
 * Returns:
 *   { status: 'pending' | 'paid' | 'failed' | 'cancelled', plan?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pollPaynowStatus, PLANS, type PlanId } from '@/lib/paynow'

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
    .select('id, user_id, status, poll_url, plan_id, item_type, item_id, amount_usd')
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

      // Determine the correct plan tier and duration from the PLANS config
      const plan = PLANS[payment.plan_id as PlanId]
      const tierName = plan?.tier ?? 'pro'
      const days = plan?.days ?? 30

      // Handle different payment types
      const itemType = payment.item_type ?? 'subscription'

      if (itemType === 'ai_grade_report' || itemType === 'subject_pack') {
        // One-time purchase — record it
        await supabase.from('one_time_purchases').insert({
          user_id: payment.user_id,
          item_type: itemType,
          item_id: payment.item_id,
          amount_usd: payment.amount_usd,
          status: 'completed',
          payment_id: payment.id,
        })

        if (itemType === 'subject_pack' && payment.item_id) {
          await supabase.from('subject_access').upsert({
            user_id: payment.user_id,
            subject_id: payment.item_id,
            expires_at: new Date(new Date().getFullYear(), 11, 31).toISOString(),
          })
        }

        return NextResponse.json({ status: 'paid', plan: tierName })
      }

      if (itemType === 'monitoring') {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)
        await supabase
          .from('profiles')
          .update({ monitoring_expires_at: expiresAt.toISOString() })
          .eq('id', payment.user_id)

        return NextResponse.json({ status: 'paid', plan: 'monitoring' })
      }

      // Main subscription upgrade — use the actual tier from the plan
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + days)

      await supabase
        .from('profiles')
        .update({
          plan: tierName,
          pro_expires_at: expiresAt.toISOString(),
        })
        .eq('id', user.id)

      return NextResponse.json({ status: 'paid', plan: tierName })
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
