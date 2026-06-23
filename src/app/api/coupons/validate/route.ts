export const dynamic = 'force-dynamic';
/**
 * POST /api/coupons/validate
 *
 * Validates a coupon code and returns the discounted price.
 *
 * Body: { code: string, planId: string, amountUsd: number }
 *
 * Returns: { valid: boolean, discountedAmount: number, savings: number, description: string, error?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ valid: false, error: 'You must be logged in to apply a coupon' }, { status: 401 })
    }

    let body: { code?: string; planId?: string; amountUsd?: number }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ valid: false, error: 'Invalid request body' }, { status: 400 })
    }

    const { code, planId, amountUsd } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Coupon code is required' }, { status: 400 })
    }
    if (!planId || typeof planId !== 'string') {
      return NextResponse.json({ valid: false, error: 'Plan ID is required' }, { status: 400 })
    }
    if (typeof amountUsd !== 'number' || amountUsd <= 0) {
      return NextResponse.json({ valid: false, error: 'Invalid amount' }, { status: 400 })
    }

    // Fetch the coupon (case-insensitive lookup)
    const { data: coupon, error: couponErr } = await supabase
      .from('coupons')
      .select('*')
      .ilike('code', code.trim())
      .single()

    if (couponErr || !coupon) {
      return NextResponse.json({ valid: false, error: 'Coupon code not found' })
    }

    // Check active status
    if (!coupon.is_active) {
      return NextResponse.json({ valid: false, error: 'This coupon is no longer active' })
    }

    // Check validity window
    const now = new Date()
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return NextResponse.json({ valid: false, error: 'This coupon is not yet valid' })
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return NextResponse.json({ valid: false, error: 'This coupon has expired' })
    }

    // Check max uses
    if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
      return NextResponse.json({ valid: false, error: 'This coupon has reached its maximum number of uses' })
    }

    // Check applies_to restriction
    if (coupon.applies_to && coupon.applies_to.length > 0) {
      if (!coupon.applies_to.includes(planId)) {
        return NextResponse.json({
          valid: false,
          error: `This coupon does not apply to the selected plan`,
        })
      }
    }

    // Check minimum amount requirement
    if (coupon.min_amount_usd && amountUsd < coupon.min_amount_usd) {
      return NextResponse.json({
        valid: false,
        error: `This coupon requires a minimum order of $${Number(coupon.min_amount_usd).toFixed(2)} USD`,
      })
    }

    // Check if this user has already used this coupon
    const { data: existingUse } = await supabase
      .from('coupon_uses')
      .select('id')
      .eq('coupon_id', coupon.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingUse) {
      return NextResponse.json({ valid: false, error: 'You have already used this coupon' })
    }

    // Calculate discount
    let savings = 0
    if (coupon.discount_type === 'percent') {
      savings = (amountUsd * Number(coupon.discount_value)) / 100
    } else if (coupon.discount_type === 'fixed_usd') {
      savings = Math.min(Number(coupon.discount_value), amountUsd)
    }

    // Round to 2 decimal places and ensure non-negative result
    savings = Math.round(savings * 100) / 100
    const discountedAmount = Math.max(0, Math.round((amountUsd - savings) * 100) / 100)

    return NextResponse.json({
      valid: true,
      discountedAmount,
      savings,
      description: coupon.description ?? `${coupon.discount_type === 'percent' ? coupon.discount_value + '% off' : '$' + coupon.discount_value + ' off'}`,
      couponId: coupon.id,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[coupons/validate] Unhandled error:', message)
    return NextResponse.json({ valid: false, error: `Server error: ${message}` }, { status: 500 })
  }
}
