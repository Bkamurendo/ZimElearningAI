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

    type TrialRow = { full_name: string | null; phone: string | null }

    const { data: trialUsers, error: trialErr } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('role', 'student')
      .eq('suspended', false)
      .gte('trial_ends_at', windowStart)
      .lte('trial_ends_at', windowEnd)
      .not('phone', 'is', null) as { data: TrialRow[] | null; error: unknown }

    if (trialErr) {
      summary.errors.push(`Trial query failed: ${String(trialErr)}`)
    } else if (trialUsers) {
      for (const u of trialUsers) {
        if (!u.phone) continue
        const name = u.full_name ?? 'Student'
        const msg  = SMS_TEMPLATES.trialEnding(name, 1)
        const ok   = await trySend(u.phone, msg, summary.errors)
        if (ok) summary.trialReminders.sent++
        else    summary.trialReminders.failed++
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
        } | null
      } | null
    }

    const { data: exams, error: examErr } = await supabase
      .from('exam_timetable')
      .select(`
        student_id,
        subject:subjects(name),
        student_profile:student_profiles(
          user:profiles(full_name, phone)
        )
      `)
      .eq('exam_date', targetDate) as { data: ExamRow[] | null; error: unknown }

    if (examErr) {
      summary.errors.push(`Exam timetable query failed: ${String(examErr)}`)
    } else if (exams) {
      for (const exam of exams) {
        const phone    = exam.student_profile?.user?.phone
        const name     = exam.student_profile?.user?.full_name ?? 'Student'
        const subject  = exam.subject?.name ?? 'your'

        if (!phone) continue

        const msg = SMS_TEMPLATES.examReminder(name, subject, 7)
        const ok  = await trySend(phone, msg, summary.errors)
        if (ok) summary.examReminders.sent++
        else    summary.examReminders.failed++
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
