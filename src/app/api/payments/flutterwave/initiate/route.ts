/**
 * POST /api/payments/flutterwave/initiate
 *
 * Creates a Flutterwave hosted payment link and returns it to the client.
 * The client then redirects the browser to that link.
 * Supports: Visa, Mastercard, Google Pay, Apple Pay (international clients).
 *
 * Body: { planId: 'pro_monthly' | 'pro_quarterly' | 'pro_yearly' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createFlutterwavePayment } from '@/lib/flutterwave'
import { PLANS, type PlanId } from '@/lib/paynow'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, plan')
      .eq('id', user.id)
      .single()

    if (profile?.plan === 'pro') {
      return NextResponse.json({ error: 'You are already on the Pro plan' }, { status: 400 })
    }

    let body: { planId: PlanId }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { planId } = body
    const plan = PLANS[planId]
    if (!plan) {
      return NextResponse.json({ error: `Invalid plan: "${planId}"` }, { status: 400 })
    }

    // Create pending payment record in DB
    const { data: payment, error: dbErr } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        plan_id: planId,
        amount_usd: plan.amountUsd,
        method: 'card',
        status: 'pending',
        gateway: 'flutterwave',
      })
      .select('id')
      .single()

    if (dbErr || !payment) {
      console.error('[flutterwave/initiate] DB error:', JSON.stringify(dbErr))
      return NextResponse.json(
        { error: `Failed to create payment record: ${dbErr?.message ?? 'unknown'}` },
        { status: 500 }
      )
    }

    const txRef = `zimlearn-${planId}-${user.id.slice(0, 8)}-${Date.now()}-${payment.id}`
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    const result = await createFlutterwavePayment({
      txRef,
      amount: plan.amountUsd,
      email: user.email ?? 'student@zimlearn.co.zw',
      name: (profile?.full_name as string) ?? 'Student',
      planId,
      redirectUrl: `${base}/api/payments/flutterwave/verify?paymentId=${payment.id}`,
      description: plan.description,
    })

    if (!result.success) {
      console.error('[flutterwave/initiate] Flutterwave error:', result.error)
      await supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id)
      return NextResponse.json({ error: result.error ?? 'Failed to create payment link' }, { status: 502 })
    }

    // Store tx_ref in paynow_reference column (reusing for cross-gateway)
    await supabase
      .from('payments')
      .update({ paynow_reference: txRef })
      .eq('id', payment.id)

    return NextResponse.json({
      paymentLink: result.paymentLink,
      paymentId: payment.id,
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[flutterwave/initiate] Unhandled error:', msg)
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 })
  }
}
