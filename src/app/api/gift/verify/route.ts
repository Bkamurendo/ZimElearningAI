export const dynamic = 'force-dynamic';
/**
 * GET /api/gift/verify
 *
 * Flutterwave redirects here after the gifter completes payment.
 * Marks the gift code as paid, emails the recipient (or purchaser) the code.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyFlutterwavePayment } from '@/lib/flutterwave'
import { sendEmail } from '@/lib/email'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const params = req.nextUrl.searchParams
  const giftId = params.get('giftId')
  const transactionId = params.get('transaction_id')
  const flwStatus = params.get('status')

  if (!giftId) return NextResponse.redirect(`${base}/gift?status=error`)

  const supabase = createClient()

  if (flwStatus === 'cancelled') {
    return NextResponse.redirect(`${base}/gift?status=cancelled`)
  }

  if (!transactionId) return NextResponse.redirect(`${base}/gift?status=error`)

  const verification = await verifyFlutterwavePayment(transactionId)
  if (!verification.success || !verification.paid) {
    return NextResponse.redirect(`${base}/gift?status=failed`)
  }

  const { data: gift } = await supabase
    .from('gift_codes')
    .select('*')
    .eq('id', giftId)
    .single()

  if (!gift || gift.paid) {
    return NextResponse.redirect(`${base}/gift?status=error`)
  }

  // Mark gift code as paid
  await supabase.from('gift_codes').update({ paid: true }).eq('id', giftId)

  // Send the gift code email
  const emailTo = gift.recipient_email ?? gift.purchaser_email
  const isForSelf = !gift.recipient_email
  const giftMessage = gift.gift_message
    ? `<div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;margin:20px 0;border-radius:0 8px 8px 0"><p style="font-style:italic;color:#374151;margin:0">"${gift.gift_message}"</p><p style="color:#6b7280;font-size:12px;margin:8px 0 0">— ${gift.purchaser_name}</p></div>`
    : ''

  try {
    await sendEmail(
      emailTo,
      isForSelf
        ? `🎁 ZimLearn Gift Code — ${gift.plan_tier} plan (${gift.days} days)`
        : `🎁 ${gift.purchaser_name} sent you a ZimLearn gift!`,
      `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px;text-align:center;border-radius:16px 16px 0 0">
          <h1 style="color:#fff;margin:0;font-size:26px">You've received a gift! 🎁</h1>
          <p style="color:#e0e7ff;margin:8px 0 0;font-size:15px">${gift.days} days of ZimLearn ${gift.plan_tier} access</p>
        </div>
        <div style="padding:36px;background:#fff;border-radius:0 0 16px 16px">
          ${!isForSelf ? `<p style="font-size:16px;color:#374151">${gift.purchaser_name} has gifted you access to ZimLearn — Zimbabwe's leading ZIMSEC AI learning platform.</p>` : ''}
          ${giftMessage}
          <p style="font-size:14px;color:#374151">Use this code to activate your ${gift.plan_tier} plan:</p>
          <div style="background:#1e1b4b;border-radius:12px;padding:24px;text-align:center;margin:20px 0">
            <p style="color:#a5b4fc;font-size:12px;margin:0 0 8px;font-weight:600;letter-spacing:2px">YOUR GIFT CODE</p>
            <p style="font-family:monospace;font-size:32px;font-weight:900;color:#fff;letter-spacing:4px;margin:0">${gift.code}</p>
          </div>
          <div style="text-align:center;margin:24px 0">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zim-elearningai.co.zw'}/gift/redeem?code=${gift.code}"
               style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 32px;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;display:inline-block">
              Activate My Gift →
            </a>
          </div>
          <div style="background:#f8fafc;border-radius:10px;padding:16px">
            <p style="font-size:13px;color:#374151;margin:0"><strong>How to redeem:</strong></p>
            <ol style="font-size:13px;color:#6b7280;margin:8px 0 0;padding-left:20px;line-height:1.7">
              <li>Click the button above (or go to zim-elearningai.co.zw/gift/redeem)</li>
              <li>Log in or create a free account</li>
              <li>Enter the code above to activate your ${gift.plan_tier} plan</li>
            </ol>
          </div>
          <p style="font-size:12px;color:#9ca3af;margin:20px 0 0;text-align:center">
            This code is valid for 1 year · One-time use · © ZimLearn
          </p>
        </div>
      </div>
      `
    )
  } catch (emailErr) {
    console.error('[gift/verify] Email error:', emailErr)
  }

  // Also send confirmation to the purchaser (if different from recipient)
  if (gift.recipient_email && gift.purchaser_email !== gift.recipient_email) {
    try {
      await sendEmail(
        gift.purchaser_email,
        `✅ Your ZimLearn gift was sent to ${gift.recipient_email}`,
        `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#fff;border-radius:12px">
          <h2 style="color:#374151">Gift sent! 🎉</h2>
          <p style="color:#6b7280">Your ZimLearn gift (${gift.days} days ${gift.plan_tier} access) has been sent to <strong>${gift.recipient_email}</strong>.</p>
          <p style="color:#6b7280">Gift code: <strong style="font-family:monospace;font-size:18px;color:#6366f1">${gift.code}</strong></p>
          <p style="color:#9ca3af;font-size:13px">Thank you for supporting a student's education!</p>
        </div>`
      )
    } catch { /* non-critical */ }
  }

  return NextResponse.redirect(`${base}/gift?status=success&code=${gift.code}&tier=${gift.plan_tier}`)
}
