/**
 * POST /api/gift/redeem
 * Requires authentication (the student must be logged in).
 * Body: { code: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'You must be logged in to redeem a gift code.' }, { status: 401 })

    const { code } = await req.json() as { code?: string }
    if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 })

    // Look up the gift code
    const { data: gift } = await supabase
      .from('gift_codes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (!gift) return NextResponse.json({ error: 'Invalid gift code. Please check and try again.' }, { status: 404 })
    if (!gift.paid) return NextResponse.json({ error: 'This gift code has not been paid for yet.' }, { status: 400 })
    if (gift.redeemed) return NextResponse.json({ error: 'This gift code has already been redeemed.' }, { status: 400 })
    if (gift.expires_at && new Date(gift.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This gift code has expired.' }, { status: 400 })
    }

    // Activate the plan on the student's profile
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + gift.days)

    await supabase.from('profiles').update({
      plan: gift.plan_tier,
      pro_expires_at: expiresAt.toISOString(),
    }).eq('id', user.id)

    // Mark the gift code as redeemed
    await supabase.from('gift_codes').update({
      redeemed: true,
      redeemed_at: new Date().toISOString(),
      redeemed_by: user.id,
      recipient_user_id: user.id,
    }).eq('id', gift.id)

    return NextResponse.json({ ok: true, tier: gift.plan_tier, days: gift.days })
  } catch (err) {
    console.error('[gift/redeem] Error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
