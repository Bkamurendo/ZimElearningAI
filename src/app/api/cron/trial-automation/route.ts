import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTrialEndingSMS, sendTrialExpiredSMS } from '@/lib/sms'
import { sendEmail } from '@/lib/email'

export async function POST(): Promise<NextResponse> {
  try {
    const supabase = createClient()
    const now = new Date()
    
    // Fetch all users with trial periods
    const { data: trialUsers, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, trial_ends_at, plan')
      .eq('role', 'student')
      .not('trial_ends_at', 'is', null)

    if (error) {
      console.error('[TRIAL AUTOMATION] Error fetching trial users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const results = {
      threeDayReminders: 0,
      oneDayReminders: 0,
      expiredNotifications: 0,
      errors: [] as string[]
    }

    for (const user of trialUsers || []) {
      try {
        const daysLeft = Math.ceil((new Date(user.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        const name = user.full_name || 'Student'

        // 3-day reminder
        if (daysLeft === 3 && user.plan === 'free') {
          // SMS
          if (user.phone) {
            await sendTrialEndingSMS(user.phone, name, 3)
            results.threeDayReminders++
          }
          
          // Email
          if (user.email) {
            const subject = 'Your ZimLearn Pro Trial Expires in 3 Days'
            const html = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
                <h1 style="color: #0d9488;">Almost there, ${name}!</h1>
                <p>Your 7-day free trial of <strong>ZimLearn Pro</strong> is coming to an end in 3 days.</p>
                <p>Don't lose your access to unlimited AI tutoring, mock exams, and personalized revision paths.</p>
                <div style="margin: 30px 0;">
                  <a href="https://zimlearn.ai/student/upgrade" style="background-color: #0d9488; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold;">Upgrade to Pro Now</a>
                </div>
                <p style="font-size: 14px; color: #64748b;">If you need help or have questions about our plans (starting at just $2/mo), just reply to this email!</p>
              </div>
            `
            await sendEmail(user.email, subject, html)
          }
        }

        // 1-day reminder
        if (daysLeft === 1 && user.plan === 'free') {
          // SMS
          if (user.phone) {
            await sendTrialEndingSMS(user.phone, name, 1)
            results.oneDayReminders++
          }
          
          // Email
          if (user.email) {
            const subject = 'Action Required: Your ZimLearn Pro Trial Expires Tomorrow!'
            const html = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
                <h1 style="color: #0d9488;">Final Day!</h1>
                <p>Hi ${name}, this is your final reminder that your <strong>ZimLearn Pro</strong> trial expires tomorrow.</p>
                <p>Once your trial ends, your AI daily limit will drop to 25 requests. Don't let that happen!</p>
                <div style="margin: 30px 0;">
                  <a href="https://zimlearn.ai/student/upgrade" style="background-color: #0d9488; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold;">Keep My Pro Access</a>
                </div>
                <p>Join the thousands of Zimbabwean students and MaFundi experts preparing for ZIMSEC success.</p>
              </div>
            `
            await sendEmail(user.email, subject, html)
          }
        }

        // Expired notification
        if (daysLeft < 0 && user.plan === 'free') {
          // SMS
          if (user.phone) {
            await sendTrialExpiredSMS(user.phone, name)
            results.expiredNotifications++
          }
          
          // Email
          if (user.email) {
            const subject = 'Your ZimLearn Pro Trial Has Expired'
            const html = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
                <h1 style="color: #64748b;">Trial Expired</h1>
                <p>Hi ${name}, your Pro trial has ended and your account is now on the Free tier.</p>
                <p>You can still use ZimLearn, but with limited daily AI requests. To continue with unlimited access, you can upgrade at any time.</p>
                <div style="margin: 30px 0;">
                  <a href="https://zimlearn.ai/student/upgrade" style="background-color: #0d9488; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold;">Upgrade to Pro - From $2</a>
                </div>
                <p>We'd love to have you back on Pro!</p>
              </div>
            `
            await sendEmail(user.email, subject, html)
          }
        }

      } catch (err) {
        results.errors.push(`Error processing ${user.email}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    // Log automation results
    await supabase.from('automation_logs').insert({
      type: 'trial_reminders',
      results,
      executed_at: now.toISOString()
    })

    console.log('[TRIAL AUTOMATION] Completed:', results)

    return NextResponse.json({
      success: true,
      results,
      totalProcessed: trialUsers?.length || 0
    })

  } catch (err) {
    console.error('[TRIAL AUTOMATION]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
