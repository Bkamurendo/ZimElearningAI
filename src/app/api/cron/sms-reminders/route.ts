/**
 * GET /api/cron/sms-reminders
 *
 * Vercel Cron job — runs daily at 08:00 Zimbabwe time (UTC+2 → cron 0 6 * * *).
 *
 * Actions:
 *   1. Trial ending in exactly 1 day → trialEnding SMS
 *   2. ZIMSEC exams in exactly 7 days → examReminder SMS
 *
 * Protected by the CRON_SECRET environment variable, which Vercel sets
 * automatically on the Authorization: Bearer header for cron invocations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/sms'
import { SMS_TEMPLATES } from '@/lib/sms-templates'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CronSummary {
  trialReminders: { sent: number; failed: number }
  examReminders:  { sent: number; failed: number }
  errors: string[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return the ISO date string for today + N days (YYYY-MM-DD). */
function dateInDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

/** Fire-and-forget SMS with error capturing into the errors array. */
async function trySend(
  phone: string,
  message: string,
  errors: string[]
): Promise<boolean> {
  const result = await sendSMS(phone, message)
  if (!result.success && result.error) {
    errors.push(`${phone}: ${result.error}`)
  }
  return result.success
}

/** Fire-and-forget Email with error capturing into the errors array. */
async function trySendEmail(
  email: string,
  subject: string,
  html: string,
  errors: string[]
): Promise<boolean> {
  const { sendEmail } = await import('@/lib/email')
  const result = await sendEmail(email, subject, html)
  if (!result.success && result.error) {
    errors.push(`${email}: ${result.error}`)
  }
  return result.success
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  // ── Auth: verify CRON_SECRET ──────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const summary: CronSummary = {
    trialReminders: { sent: 0, failed: 0 },
    examReminders:  { sent: 0, failed: 0 },
    errors: [],
  }

  const supabase = createClient()

  // ── 1. Trial-ending reminders (trial ends in exactly 1 day) ───────────────
  try {
    // Window: between 23 h and 25 h from now (tolerant ±1 h window)
    const windowStart = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString()
    const windowEnd   = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()

    type TrialRow = { full_name: string | null; phone: string | null; email: string | null }

    const { data: trialUsers, error: trialErr } = await supabase
      .from('profiles')
      .select('full_name, phone, email')
      .eq('role', 'student')
      .eq('suspended', false)
      .gte('trial_ends_at', windowStart)
      .lte('trial_ends_at', windowEnd) as { data: TrialRow[] | null; error: unknown }

    if (trialErr) {
      summary.errors.push(`Trial query failed: ${String(trialErr)}`)
    } else if (trialUsers) {
      for (const u of trialUsers) {
        if (!u.phone && !u.email) continue
        const name = u.full_name ?? 'Student'
        
        if (u.phone) {
          const msg  = SMS_TEMPLATES.trialEnding(name, 1)
          const ok   = await trySend(u.phone, msg, summary.errors)
          if (ok) summary.trialReminders.sent++
          else    summary.trialReminders.failed++
        } else if (u.email) {
          const htmlMsg = `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
              <h2 style="color:#d97706">Trial Ending Tomorrow!</h2>
              <p style="font-size:16px;">Hi ${name},</p>
              <p style="font-size:16px;">Your free trial for AI E-Learning Platform ZIM ends in exactly 1 day.</p>
              <p style="font-size:16px;">Don't lose your progress and access to our premium learning materials. Log in now and upgrade your plan to keep studying without interruptions.</p>
              <div style="text-align:center;margin:30px 0">
                <a href="https://zim-elearningai.co.zw/pricing" style="background-color:#16a34a;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;font-size:16px;">Upgrade Now</a>
              </div>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
              <p style="color:#9ca3af;font-size:12px;text-align:center;">Zim E-Learning AI Team</p>
            </div>
          `
          const ok = await trySendEmail(u.email, 'Action Required: Trial expires in 1 day', htmlMsg, summary.errors)
          if (ok) summary.trialReminders.sent++
          else    summary.trialReminders.failed++
        }
      }
    }
  } catch (err) {
    summary.errors.push(`Trial reminders: ${err instanceof Error ? err.message : String(err)}`)
  }

  // ── 2. Exam reminders (exams in exactly 7 days) ───────────────────────────
  try {
    const targetDate = dateInDays(7)

    type ExamRow = {
      student_id: string
      subject: { name: string } | null
      student_profile: {
        user: {
          full_name: string | null
          phone: string | null
          email: string | null
        } | null
      } | null
    }

    const { data: exams, error: examErr } = await supabase
      .from('exam_timetable')
      .select(`
        student_id,
        subject:subjects(name),
        student_profile:student_profiles(
          user:profiles(full_name, phone, email)
        )
      `)
      .eq('exam_date', targetDate) as { data: ExamRow[] | null; error: unknown }

    if (examErr) {
      summary.errors.push(`Exam timetable query failed: ${String(examErr)}`)
    } else if (exams) {
      for (const exam of exams) {
        const phone    = exam.student_profile?.user?.phone
        const email    = exam.student_profile?.user?.email
        const name     = exam.student_profile?.user?.full_name ?? 'Student'
        const subject  = exam.subject?.name ?? 'your'

        if (!phone && !email) continue

        if (phone) {
          const msg = SMS_TEMPLATES.examReminder(name, subject, 7)
          const ok  = await trySend(phone, msg, summary.errors)
          if (ok) summary.examReminders.sent++
          else    summary.examReminders.failed++
        } else if (email) {
          const htmlMsg = `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
              <h2 style="color:#0284c7">Exam Reminder: 7 Days Left!</h2>
              <p style="font-size:16px;">Hi ${name},</p>
              <p style="font-size:16px;">Just a quick reminder that your <strong>${subject}</strong> exam is coming up in exactly 7 days.</p>
              <p style="font-size:16px;">Log in to AI E-Learning Platform ZIM to review your study materials and practice tests before the big day.</p>
              <div style="text-align:center;margin:30px 0">
                <a href="https://zim-elearningai.co.zw/student/dashboard" style="background-color:#0284c7;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;font-size:16px;">Go to Dashboard</a>
              </div>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
              <p style="color:#9ca3af;font-size:12px;text-align:center;">Zim E-Learning AI Team</p>
            </div>
          `
          const ok = await trySendEmail(email, `Exam Reminder: ${subject} in 7 days`, htmlMsg, summary.errors)
          if (ok) summary.examReminders.sent++
          else    summary.examReminders.failed++
        }
      }
    }
  } catch (err) {
    summary.errors.push(`Exam reminders: ${err instanceof Error ? err.message : String(err)}`)
  }

  // ── Log summary ───────────────────────────────────────────────────────────
  console.log('[cron/sms-reminders]', JSON.stringify(summary))

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    ...summary,
  })
}
