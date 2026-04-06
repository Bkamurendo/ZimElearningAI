import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSubscriptionExpiredSMS } from '@/lib/sms'
import { sendEmail } from '@/lib/email'

export async function POST(): Promise<NextResponse> {
  try {
    const supabase = createClient()
    const now = new Date()
    
    // Fetch all users whose premium subscription has expired
    const { data: expiredUsers, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, subscription_expires_at, plan')
      .eq('role', 'student')
      .neq('plan', 'free')
      .lt('subscription_expires_at', now.toISOString())

    if (error) {
      console.error('[SUBSCRIPTION SWEEP] Error fetching users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      return NextResponse.json({ message: 'No expired subscriptions found.' })
    }

    const results = {
      reverted: 0,
      smsSent: 0,
      emailsSent: 0,
      errors: [] as string[]
    }

    for (const user of expiredUsers) {
      try {
        // 1. Revert plan to FREE
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ plan: 'free' })
          .eq('id', user.id)

        if (updateError) throw updateError
        results.reverted++

        const name = user.full_name || 'Student'

        // 2. Send SMS Notification
        if (user.phone) {
          try {
            await sendSubscriptionExpiredSMS(user.phone, name)
            results.smsSent++
          } catch (smsErr) {
            results.errors.push(`SMS failed for ${user.phone}: ${smsErr instanceof Error ? smsErr.message : 'Unknown'}`)
          }
        }

        // 3. Send Email Notification
        if (user.email) {
          try {
            const subject = 'Your ZimLearn Premium Subscription Has Expired'
            const html = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155; line-height: 1.6;">
                <div style="background-color: #0d9488; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px;">ZimLearn Premium</h1>
                </div>
                <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                  <h2 style="color: #0f172a; margin-top: 0;">Hi ${name},</h2>
                  <p>Your Premium subscription has come to an end. We've enjoyed providing you with unlimited AI tutoring and premium ZIMSEC materials!</p>
                  <p>Your account has been reverted to the <strong>Free Tier</strong>. You can still use the platform, but your AI limit is now 25 requests per day.</p>
                  
                  <div style="margin: 35px 0; text-align: center;">
                    <a href="https://zimlearn.ai/student/upgrade" style="background-color: #0d9488; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Renew My Subscription</a>
                  </div>

                  <p style="font-size: 14px; color: #64748b; font-style: italic;">Need help choosing a plan? Reply to this email and our team will assist you.</p>
                </div>
                <div style="padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
                  © ${new Date().getFullYear()} ZimLearn AI. Harare, Zimbabwe.
                </div>
              </div>
            `
            await sendEmail(user.email, subject, html)
            results.emailsSent++
          } catch (emailErr) {
            results.errors.push(`Email failed for ${user.email}: ${emailErr instanceof Error ? emailErr.message : 'Unknown'}`)
          }
        }
      } catch (err) {
        results.errors.push(`Error reverting ${user.id}: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }

    // Log automation results
    await supabase.from('automation_logs').insert({
      type: 'subscription_sweep',
      results,
      executed_at: now.toISOString()
    })

    console.log('[SUBSCRIPTION SWEEP] Completed:', results)

    return NextResponse.json({
      success: true,
      results
    })

  } catch (err) {
    console.error('[SUBSCRIPTION SWEEP]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
