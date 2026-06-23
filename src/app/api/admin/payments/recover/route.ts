export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/admin/payments/recover
 * 
 * Manually trigger a recovery email for a specific payment attempt.
 * Body: { paymentId: string }
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()

  // 1. Admin Authorization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { paymentId } = await req.json()
    if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 })

    // 2. Fetch Payment and User Details
    const { data: payment, error: pErr } = await supabase
      .from('payments')
      .select(`
        *,
        user:profiles!payments_user_id_fkey(id, full_name, email)
      `)
      .eq('id', paymentId)
      .single()

    if (pErr || !payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
    }

    if (payment.status === 'paid') {
      return NextResponse.json({ error: 'Payment is already completed' }, { status: 400 })
    }

    const studentName = payment.user?.full_name?.split(' ')[0] || 'Student'
    const studentEmail = payment.user?.email

    if (!studentEmail) {
      return NextResponse.json({ error: 'Student email not found' }, { status: 400 })
    }

    // 3. Send Recovery Email
    // Using a high-conversion, empathetic template
    const recoveryEmailHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #f1f5f9;">
        <div style="background: linear-gradient(135deg, #0d9488, #0f766e); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">ZimLearn AI</h1>
        </div>
        
        <div style="padding: 40px 40px 20px;">
          <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 16px; font-weight: 700;">Hi ${studentName},</h2>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
            We noticed you were trying to upgrade your ZimLearn account to <strong>${payment.plan_id.toUpperCase()}</strong>, but the payment didn't quite go through.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; font-weight: 700; color: #1e293b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Plan Details</p>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 15px;">🚀 ${payment.plan_id.replace('_', ' ').toUpperCase()}</p>
          </div>

          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
            Don't let a technical glitch slow down your ZIMSEC preparation. You're just one step away from unlocking <strong>Unlimited AI Tutoring</strong> and <strong>Full Mock Exams</strong>.
          </p>
          
          <div style="text-align: center;">
            <a href="https://zim-elearningai.co.zw/student/upgrade?plan=${payment.plan_id}" 
               style="background-color: #0d9488; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; display: inline-block; font-size: 16px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.2);">
               Resume My Upgrade →
            </a>
          </div>
        </div>

        <div style="padding: 0 40px 40px; text-align: center;">
          <p style="color: #94a3b8; font-size: 13px; margin: 32px 0 0;">
            Having trouble with mobile money? <br/>
            Reply to this email or WhatsApp us at <strong>+263 78 517 0918</strong> for instant help.
          </p>
        </div>

        <div style="background: #f1f5f9; padding: 20px; text-align: center;">
          <p style="color: #64748b; font-size: 11px; margin: 0;">&copy; ${new Date().getFullYear()} ZimLearn AI · Harare, Zimbabwe</p>
        </div>
      </div>
    `

    const res = await sendEmail(
      studentEmail,
      `Finish your upgrade, ${studentName}! 🚀`,
      recoveryEmailHtml
    )

    if (!res.success) throw new Error(res.error)

    // 4. Log the action
    await supabase.from('user_activity').insert({
      user_id: payment.user_id,
      activity_type: 'payment_recovery_sent',
      description: `Admin sent payment recovery email for ${payment.plan_id}`,
      metadata: { paymentId: payment.id, admin_id: user.id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[ADMIN RECOVER PANEL]', error)
    return NextResponse.json({ error: 'Failed to send recovery email' }, { status: 500 })
  }
}
