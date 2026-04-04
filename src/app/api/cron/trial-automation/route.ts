import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Mock SMS and email functions - replace with actual implementations
const sendSMS = async (phone: string, message: string) => {
  console.log(`SMS to ${phone}: ${message}`)
  return { success: true, messageId: 'mock-id', error: null }
}

const sendEmail = async ({ to, subject, template, data }: {
  to: string
  subject: string
  template: string
  data: Record<string, unknown>
}) => {
  console.log(`Email to ${to}: ${subject} (${template})`)
  return { success: true }
}

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
          const message = `Hi ${name}, your ZimLearn Pro trial expires in 3 days. Upgrade now to keep accessing premium features: zimlearn.ai/student/upgrade`
          
          if (user.phone) {
            const smsResult = await sendSMS(user.phone, message)
            if (smsResult.success) {
              results.threeDayReminders++
            } else {
              results.errors.push(`SMS failed for ${user.email}: ${smsResult.error}`)
            }
          }
          
          if (user.email) {
            await sendEmail({
              to: user.email,
              subject: 'Your ZimLearn Pro Trial Expires in 3 Days',
              template: 'trial_reminder',
              data: { name, daysLeft: 3 }
            })
          }
        }

        // 1-day reminder
        if (daysLeft === 1 && user.plan === 'free') {
          const message = `Hi ${name}, your ZimLearn Pro trial expires tomorrow! Don't lose access - upgrade now: zimlearn.ai/student/upgrade`
          
          if (user.phone) {
            const smsResult = await sendSMS(user.phone, message)
            if (smsResult.success) {
              results.oneDayReminders++
            } else {
              results.errors.push(`SMS failed for ${user.email}: ${smsResult.error}`)
            }
          }
          
          if (user.email) {
            await sendEmail({
              to: user.email,
              subject: 'Final Day: Your ZimLearn Pro Trial Expires Tomorrow!',
              template: 'trial_urgent',
              data: { name, daysLeft: 1 }
            })
          }
        }

        // Expired notification
        if (daysLeft < 0 && user.plan === 'free') {
          const message = `Hi ${name}, your ZimLearn Pro trial has expired. Upgrade now to regain access to premium features: zimlearn.ai/student/upgrade`
          
          if (user.phone) {
            const smsResult = await sendSMS(user.phone, message)
            if (smsResult.success) {
              results.expiredNotifications++
            } else {
              results.errors.push(`SMS failed for ${user.email}: ${smsResult.error}`)
            }
          }
          
          if (user.email) {
            await sendEmail({
              to: user.email,
              subject: 'Your ZimLearn Pro Trial Has Expired',
              template: 'trial_expired',
              data: { name }
            })
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
