/**
 * POST /api/payments/initiate
 *
 * Creates a Paynow payment and returns either a redirect URL (web checkout)
 * or confirms that an EcoCash USSD push was sent.
 *
 * Body:
 *   planId    — 'pro_monthly' | 'pro_quarterly' | 'pro_yearly'
 *   method    — 'ecocash' | 'onemoney' | 'innbucks' | 'web'
 *   phone?    — required for mobile money methods
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPaynowPayment, PLANS, type PlanId, type MobileMethod } from '@/lib/paynow'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, plan')
      .eq('id', user.id)
      .single()

    let body: { planId: PlanId; method?: 'web' | MobileMethod; phone?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { planId, method = 'ecocash', phone } = body

    const plan = PLANS[planId]
    if (!plan) {
      return NextResponse.json({ error: `Invalid plan: "${planId}"` }, { status: 400 })
    }

    // Prevent buying the exact same plan tier you already hold
    const purchaseTier = plan.tier
    if (profile?.plan === purchaseTier) {
      return NextResponse.json(
        { error: `You are already on the ${purchaseTier} plan. Your access will auto-renew on expiry.` },
        { status: 400 }
      )
    }

    if (method !== 'web' && !phone) {
      return NextResponse.json({ error: 'Phone number required for mobile money' }, { status: 400 })
    }

    // Validate Zimbabwean phone format (07XXXXXXXX or +2637XXXXXXXX)
    if (phone) {
      const cleaned = phone.replace(/\s+/g, '')
      if (!/^(\+2637[0-9]{8}|07[0-9]{8})$/.test(cleaned)) {
        return NextResponse.json(
          { error: 'Invalid phone number. Use format: 0771234567 or +263771234567' },
          { status: 400 }
        )
      }
    }

    const reference = `zimlearn-${planId}-${user.id.slice(0, 8)}-${Date.now()}`

    // Create payment row in DB (status: pending)
    const { data: payment, error: dbErr } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        plan_id: planId,
        amount_usd: plan.amountUsd,
        method,
        phone: phone ?? null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (dbErr || !payment) {
      console.error('[payments/initiate] DB insert error:', JSON.stringify(dbErr))
      return NextResponse.json(
        { error: `Failed to create payment record: ${dbErr?.message ?? 'unknown DB error'}` },
        { status: 500 }
      )
    }

    // Include payment DB id in reference so callback can look it up
    const fullRef = `${reference}-${payment.id}`

    // Initiate payment with Paynow
    const result = await createPaynowPayment({
      reference: fullRef,
      email: user.email ?? 'customer@zimlearn.co.zw',
      amountUsd: plan.amountUsd,
      description: plan.description,
      method,
      phone,
    })

    if (!result.success) {
      console.error('[payments/initiate] Paynow error:', result.error)
      // Mark as failed in DB
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id)

      return NextResponse.json({ error: result.error ?? 'Paynow rejected the payment' }, { status: 502 })
    }

    // Store poll URL so we can check status later
    if (result.pollUrl) {
      await supabase
        .from('payments')
        .update({ poll_url: result.pollUrl })
        .eq('id', payment.id)
    }

    return NextResponse.json({
      paymentId: payment.id,
      method,
      planId,
      amountUsd: plan.amountUsd,
      redirectUrl: result.redirectUrl,
      pollUrl: result.pollUrl,
      message: method !== 'web'
        ? `A payment request has been sent to ${phone}. Please check your phone and approve the payment.`
        : undefined,
    })

  } catch (err) {
    // Top-level catch — ensures we always return JSON, never crash
    const message = err instanceof Error ? err.message : String(err)
    console.error('[payments/initiate] Unhandled error:', message)
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 })
  }
}
