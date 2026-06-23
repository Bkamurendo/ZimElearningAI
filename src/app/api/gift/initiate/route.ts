export const dynamic = 'force-dynamic';
/**
 * POST /api/gift/initiate
 *
 * Creates a gift code record and initiates a Flutterwave payment.
 * The gifter (purchaser) pays via international card — no ZimLearn account needed.
 * On payment success, the gift code is emailed to the recipient.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createFlutterwavePayment } from '@/lib/flutterwave'
import { PLANS, type PlanId } from '@/lib/paynow'

function generateGiftCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no confusable chars
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as {
      planId: PlanId
      purchaserName: string
      purchaserEmail: string
      recipientEmail?: string
      giftMessage?: string
    }

    const { planId, purchaserName, purchaserEmail, recipientEmail, giftMessage } = body

    if (!planId || !purchaserName || !purchaserEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const plan = PLANS[planId]
    if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const supabase = createClient()
    const code = generateGiftCode()
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    // Create the gift code record
    const { data: gift, error: dbErr } = await supabase
      .from('gift_codes')
      .insert({
        code,
        plan_tier: plan.tier,
        days: plan.days,
        amount_usd: plan.amountUsd,
        purchaser_email: purchaserEmail,
        purchaser_name: purchaserName,
        recipient_email: recipientEmail ?? null,
        gift_message: giftMessage ?? null,
        paid: false,
      })
      .select('id')
      .single()

    if (dbErr || !gift) {
      console.error('[gift/initiate] DB error:', dbErr)
      return NextResponse.json({ error: 'Failed to create gift record' }, { status: 500 })
    }

    const txRef = `zimlearn-gift-${planId}-${gift.id.slice(0, 8)}-${Date.now()}`

    // Initiate Flutterwave payment (supports international cards)
    const result = await createFlutterwavePayment({
      txRef,
      amount: plan.amountUsd,
      email: purchaserEmail,
      name: purchaserName,
      planId,
      redirectUrl: `${base}/api/gift/verify?giftId=${gift.id}`,
      description: `ZimLearn Gift — ${plan.label}`,
    })

    if (!result.success) {
      console.error('[gift/initiate] Flutterwave error:', result.error)
      return NextResponse.json({ error: result.error ?? 'Payment failed' }, { status: 502 })
    }

    // Store tx_ref
    await supabase.from('gift_codes').update({ payment_id: gift.id }).eq('id', gift.id)

    return NextResponse.json({ paymentLink: result.paymentLink, giftId: gift.id })
  } catch (err) {
    console.error('[gift/initiate] Error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
