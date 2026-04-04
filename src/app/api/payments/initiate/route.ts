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

    let body: { planId: PlanId; method?: 'web' | MobileMethod; phone?: string; couponCode?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { planId, method = 'ecocash', phone, couponCode } = body

    const plan = PLANS[planId]
    if (!plan) {
      return NextResponse.json({ error: `Invalid plan: "${planId}"` }, { status: 400 })
    }

    // Prevent buying a lower or equal tier (allow upgrades e.g. starter → pro/elite)
    const currentPlan = profile?.plan ?? 'free'
    const targetTier = plan.tier
    const tierRank: Record<string, number> = { free: 0, starter: 1, pro: 2, elite: 3 }
    if (currentPlan !== 'free' && (tierRank[currentPlan] ?? 0) >= (tierRank[targetTier] ?? 0)) {
      return NextResponse.json({ error: `You are already on the ${currentPlan} plan or higher` }, { status: 400 })
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

    // Validate coupon if provided
    let finalAmountUsd = plan.amountUsd
    let couponId: string | null = null
    let couponSavings = 0

    if (couponCode) {
      const couponValidateRes = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/coupons/validate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
          body: JSON.stringify({ code: couponCode, planId, amountUsd: plan.amountUsd }),
        }
      )
      const couponData = await couponValidateRes.json()
      if (couponData.valid) {
        finalAmountUsd = couponData.discountedAmount
        couponId = couponData.couponId
        couponSavings = couponData.savings
      }
      // If coupon is invalid we proceed with full price (client-side already validated)
    }

    const reference = `zimlearn-${planId}-${user.id.slice(0, 8)}-${Date.now()}`

    // Create payment row in DB (status: pending)
    const { data: payment, error: dbErr } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        plan_id: planId,
        amount_usd: finalAmountUsd,
        method,
        phone: phone ?? null,
        status: 'pending',
        coupon_id: couponId,
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
      amountUsd: finalAmountUsd,
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

    // Record coupon use and increment uses_count
    if (couponId) {
      // Insert use record (ignore duplicate — unique constraint handles repeated attempts)
      await supabase.from('coupon_uses').upsert({
        coupon_id: couponId,
        user_id: user.id,
        plan_id: planId,
        amount_saved_usd: couponSavings,
      }, { onConflict: 'coupon_id,user_id', ignoreDuplicates: true })

      // Increment uses_count via raw SQL so there's no race condition
      await supabase.rpc('increment_coupon_uses_count', { p_coupon_id: couponId })
        .then(({ error }) => {
          if (error) {
            // RPC may not exist yet — fall back to a safe read-then-write
            return supabase
              .from('coupons')
              .select('uses_count')
              .eq('id', couponId)
              .single()
              .then(({ data }) => {
                if (data) {
                  return supabase
                    .from('coupons')
                    .update({ uses_count: (data as { uses_count: number }).uses_count + 1 })
                    .eq('id', couponId)
                }
              })
          }
        })
    }

    return NextResponse.json({
      paymentId: payment.id,
      method,
      planId,
      amountUsd: finalAmountUsd,
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
