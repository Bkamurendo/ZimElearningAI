export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/referrals/track
 * Called after a new user signs up via a referral link.
 * Body: { referralCode: string }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { referralCode } = await req.json() as { referralCode?: string }
    if (!referralCode) return NextResponse.json({ error: 'No referral code' }, { status: 400 })

    // Find the referrer
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode.toUpperCase())
      .single()

    if (!referrer || referrer.id === user.id) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
    }

    // Check user wasn't already referred
    const { data: existing } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', user.id)
      .single()

    if (existing) return NextResponse.json({ ok: true, message: 'Already tracked' })

    // Record the referral
    await supabase.from('referrals').insert({
      referrer_id: referrer.id,
      referred_id: user.id,
    })

    // Link referred_by on their profile
    await supabase.from('profiles').update({ referred_by: referrer.id }).eq('id', user.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[referrals/track]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/**
 * POST /api/referrals/convert
 * Called by the payment webhook when a referred user upgrades to paid.
 * Body: { userId: string }
 */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient()
    const { userId } = await req.json() as { userId?: string }
    if (!userId) return NextResponse.json({ error: 'No userId' }, { status: 400 })

    // Find the referral record for this user
    const { data: referral } = await supabase
      .from('referrals')
      .select('id, referrer_id, reward_granted')
      .eq('referred_id', userId)
      .single()

    if (!referral || referral.reward_granted) {
      return NextResponse.json({ ok: true, message: 'No pending referral or already rewarded' })
    }

    const now = new Date().toISOString()

    // Mark referral as converted
    await supabase.from('referrals').update({
      converted_at: now,
      reward_granted: true,
      reward_granted_at: now,
    }).eq('id', referral.id)

    // Grant 1 free month credit to the referrer
    await supabase.from('profiles')
      .update({ referral_credits: supabase.rpc('increment', { x: 1 }) as unknown as number })
      .eq('id', referral.referrer_id)

    // Send a thank-you email to the referrer
    try {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', referral.referrer_id)
        .single()

      if (referrer?.email) {
        const { sendEmail } = await import('@/lib/email')
        const name = referrer.full_name?.split(' ')[0] ?? 'there'
        await sendEmail(
          referrer.email,
          '🎉 You earned a free month on ZimLearn!',
          `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
            <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px;text-align:center;border-radius:12px 12px 0 0">
              <h1 style="color:#fff;margin:0;font-size:24px">You earned a free month! 🎉</h1>
            </div>
            <div style="padding:32px;background:#fff">
              <p style="font-size:16px;color:#374151">Hi ${name},</p>
              <p style="font-size:16px;color:#374151">Great news! Someone you referred just upgraded to a paid ZimLearn plan. As promised, <strong>1 free month</strong> has been added to your account.</p>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;text-align:center">
                <p style="font-size:28px;font-weight:900;color:#15803d;margin:0">+1 Month FREE</p>
                <p style="font-size:13px;color:#374151;margin:6px 0 0">Applied to your next renewal</p>
              </div>
              <p style="font-size:15px;color:#374151">Keep sharing your referral link to earn more!</p>
              <div style="text-align:center;margin:24px 0">
                <a href="https://zim-elearningai.co.zw/student/referral" style="background:#16a34a;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block">View My Referrals</a>
              </div>
            </div>
          </div>
          `
        )
      }
    } catch (emailErr) {
      console.error('[referrals/convert] Email failed:', emailErr)
    }

    return NextResponse.json({ ok: true, credited: referral.referrer_id })
  } catch (err) {
    console.error('[referrals/convert]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
