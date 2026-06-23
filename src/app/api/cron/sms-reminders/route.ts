export const dynamic = 'force-dynamic';
/**
 * GET /api/cron/sms-reminders
 *
 * Vercel Cron — runs daily at 08:00 Zimbabwe time (UTC+2 → cron 0 6 * * *).
 *
 * 5-stage trial reminder sequence:
 *   Stage 1: 7 days before expiry  — friendly heads-up
 *   Stage 2: 3 days before expiry  — urgency + what they'll lose
 *   Stage 3: 1 day before expiry   — final warning
 *   Stage 4: Day of expiry         — last chance
 *   Stage 5: 1 day after expiry    — win-back offer
 *
 * Each stage is sent only ONCE per user (tracked in trial_reminder_log).
 * Also sends ZIMSEC exam reminders 7 days before exam date.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/sms'
import { SMS_TEMPLATES } from '@/lib/sms-templates'
import { sendEmail } from '@/lib/email'

// ── Types ─────────────────────────────────────────────────────────────────────

type ReminderStage = '7_day' | '3_day' | '1_day' | 'expiry_day' | 'post_expiry'

interface CronSummary {
  stages: Record<ReminderStage, { sent: number; failed: number; skipped: number }>
  examReminders: { sent: number; failed: number }
  errors: string[]
}

interface TrialUser {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  trial_ends_at: string
}

// ── Email Templates ───────────────────────────────────────────────────────────

function emailLayout(content: string): string {
  return `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px 40px;text-align:center">
        <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700">ZimLearn AI</h1>
        <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">AI E-Learning Platform Zimbabwe</p>
      </div>
      <div style="padding:36px 40px">
        ${content}
      </div>
      <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center">
        <p style="color:#9ca3af;font-size:12px;margin:0">© 2025 Zim E-Learning AI · <a href="https://zim-elearningai.co.zw" style="color:#16a34a;text-decoration:none">zim-elearningai.co.zw</a></p>
        <p style="color:#9ca3af;font-size:11px;margin:6px 0 0">You received this because you have an active trial on ZimLearn.</p>
      </div>
    </div>
  `
}

function upgradeButton(label = 'Upgrade My Plan Now'): string {
  return `<div style="text-align:center;margin:28px 0"><a href="https://zim-elearningai.co.zw/pricing" style="background-color:#16a34a;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;font-size:16px;letter-spacing:0.3px">${label}</a></div>`
}

function featureList(): string {
  return `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="font-weight:700;color:#15803d;margin:0 0 10px;font-size:14px">✨ What you'll keep with a paid plan:</p>
      <ul style="margin:0;padding:0 0 0 20px;color:#374151;font-size:14px;line-height:2">
        <li>Unlimited AI Tutoring sessions</li>
        <li>Full ZIMSEC past papers & solutions</li>
        <li>AI Exam Predictions & Grade Forecasting</li>
        <li>Offline lessons & video courses</li>
        <li>Study planner & streak tracking</li>
      </ul>
    </div>
  `
}

// Stage-specific email builders
const EMAIL_TEMPLATES: Record<ReminderStage, (name: string) => { subject: string; html: string }> = {
  '7_day': (name) => ({
    subject: `${name}, your ZimLearn trial ends in 7 days`,
    html: emailLayout(`
      <h2 style="color:#1f2937;font-size:22px;margin:0 0 8px">Hi ${name} 👋</h2>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px">
        Great news — you still have <strong>7 full days</strong> on your ZimLearn AI trial! 
        You've been making amazing progress on your studies.
      </p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px">
        After your trial, features like unlimited AI tutoring and ZIMSEC past papers 
        require a paid plan. The good news? You can lock in access from just <strong>$2/month</strong>.
      </p>
      ${featureList()}
      ${upgradeButton('Explore Plans')}
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:16px 0 0">No commitment needed — cancel anytime.</p>
    `),
  }),

  '3_day': (name) => ({
    subject: `⚠️ ${name} — 3 days left on your ZimLearn trial`,
    html: emailLayout(`
      <h2 style="color:#b45309;font-size:22px;margin:0 0 8px">Hi ${name}, your trial ends in 3 days</h2>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px">
        Time is running short! Your ZimLearn AI free trial expires in <strong>3 days</strong>.
        Don't lose access to the tools you've been studying with.
      </p>
      ${featureList()}
      <div style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:16px 20px;margin:20px 0">
        <p style="font-weight:700;color:#92400e;margin:0 0 6px;font-size:14px">🔒 What changes after your trial:</p>
        <ul style="margin:0;padding:0 0 0 20px;color:#374151;font-size:14px;line-height:2">
          <li>AI tutoring limited to 3 questions/day</li>
          <li>No access to ZIMSEC past papers</li>
          <li>Grade predictions & AI workspace disabled</li>
        </ul>
      </div>
      ${upgradeButton('Upgrade Before It Expires')}
    `),
  }),

  '1_day': (name) => ({
    subject: `🚨 Last chance — ${name}'s trial ends tomorrow`,
    html: emailLayout(`
      <h2 style="color:#dc2626;font-size:22px;margin:0 0 8px">Hi ${name} — your trial ends tomorrow</h2>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px">
        This is your final reminder. Your ZimLearn AI trial expires <strong>tomorrow</strong>. 
        After that, your access to premium features will be reduced.
      </p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px">
        Thousands of Zimbabwean students are already using ZimLearn to nail their ZIMSEC exams. 
        Don't fall behind — upgrade today for just <strong>$2/month</strong>.
      </p>
      ${featureList()}
      ${upgradeButton('🔓 Upgrade Now — $2/month')}
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:16px 0 0">Secure checkout · Cancel anytime</p>
    `),
  }),

  'expiry_day': (name) => ({
    subject: `🔔 ${name}, your ZimLearn trial ends today`,
    html: emailLayout(`
      <h2 style="color:#dc2626;font-size:22px;margin:0 0 8px">Hi ${name} — today is your last day</h2>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px">
        <strong>Your trial ends today.</strong> After midnight, your premium features will be reduced.
        Upgrade right now to keep learning without any interruption.
      </p>
      ${featureList()}
      ${upgradeButton('🚀 Upgrade Right Now')}
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:16px 0 0">Takes less than 2 minutes to upgrade</p>
    `),
  }),

  'post_expiry': (name) => ({
    subject: `We miss you, ${name} — special offer inside`,
    html: emailLayout(`
      <h2 style="color:#1f2937;font-size:22px;margin:0 0 8px">We miss you, ${name} 💚</h2>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px">
        Your ZimLearn AI trial has ended, but your learning journey doesn't have to stop here.
      </p>
      <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #16a34a;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <p style="font-size:13px;color:#15803d;font-weight:600;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px">Limited Time Offer</p>
        <p style="font-size:36px;font-weight:800;color:#15803d;margin:0">20% OFF</p>
        <p style="font-size:14px;color:#374151;margin:8px 0 16px">Use code <strong style="background:#ffffff;padding:4px 10px;border-radius:6px;border:1px solid #bbf7d0;font-family:monospace;font-size:16px">ZIMBACK20</strong> at checkout</p>
        <a href="https://zim-elearningai.co.zw/pricing" style="background-color:#16a34a;color:#ffffff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;font-size:15px">Claim My Discount</a>
      </div>
      <p style="color:#6b7280;font-size:14px;text-align:center">This offer expires in 48 hours. Don't miss it!</p>
      ${featureList()}
    `),
  }),
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function windowFor(stage: ReminderStage): { start: Date; end: Date } {
  const now = Date.now()
  const h = 60 * 60 * 1000
  const d = 24 * h
  switch (stage) {
    case '7_day':      return { start: new Date(now + 7 * d - h), end: new Date(now + 7 * d + h) }
    case '3_day':      return { start: new Date(now + 3 * d - h), end: new Date(now + 3 * d + h) }
    case '1_day':      return { start: new Date(now + d - h),     end: new Date(now + d + h) }
    case 'expiry_day': return { start: new Date(now - h),          end: new Date(now + h) }
    case 'post_expiry':return { start: new Date(now - d - h),      end: new Date(now - d + h) }
  }
}

async function sendReminder(
  user: TrialUser,
  stage: ReminderStage,
  summary: CronSummary,
  supabase: ReturnType<typeof createClient>
) {
  const name = user.full_name?.split(' ')[0] || 'Student'
  const stageSummary = summary.stages[stage]

  // Check if already sent
  const { data: existing } = await supabase
    .from('trial_reminder_log')
    .select('id')
    .eq('user_id', user.id)
    .eq('stage', stage)
    .single()

  if (existing) {
    stageSummary.skipped++
    return
  }

  let success = false
  let method: 'sms' | 'email' = 'email'

  if (user.phone) {
    // SMS
    method = 'sms'
    const daysMap: Record<ReminderStage, number> = {
      '7_day': 7, '3_day': 3, '1_day': 1, 'expiry_day': 0, 'post_expiry': -1
    }
    const days = daysMap[stage]
    const msg = days >= 0
      ? SMS_TEMPLATES.trialEnding(name, days)
      : `Hi ${name}, your ZimLearn trial has ended. Come back with code ZIMBACK20 for 20% off: https://zim-elearningai.co.zw/pricing`
    const result = await sendSMS(user.phone, msg)
    success = result.success
    if (!success && result.error) summary.errors.push(`SMS ${user.phone}: ${result.error}`)

  } else if (user.email) {
    // Email
    const template = EMAIL_TEMPLATES[stage](name)
    const result = await sendEmail(user.email, template.subject, template.html)
    success = result.success
    if (!success && result.error) summary.errors.push(`Email ${user.email}: ${result.error}`)
  }

  if (success) {
    // Record that this stage was sent (dedupe future cron runs)
    await supabase.from('trial_reminder_log').insert({
      user_id: user.id,
      stage,
      method,
    }).then(({ error }) => {
      if (error) console.error('[CRON] Failed to log reminder stage:', error)
    })
    stageSummary.sent++
  } else {
    stageSummary.failed++
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createClient()

  const summary: CronSummary = {
    stages: {
      '7_day':      { sent: 0, failed: 0, skipped: 0 },
      '3_day':      { sent: 0, failed: 0, skipped: 0 },
      '1_day':      { sent: 0, failed: 0, skipped: 0 },
      'expiry_day': { sent: 0, failed: 0, skipped: 0 },
      'post_expiry':{ sent: 0, failed: 0, skipped: 0 },
    },
    examReminders: { sent: 0, failed: 0 },
    errors: [],
  }

  // ── Process all 5 trial reminder stages ──────────────────────────────────
  const stages: ReminderStage[] = ['7_day', '3_day', '1_day', 'expiry_day', 'post_expiry']

  for (const stage of stages) {
    try {
      const { start, end } = windowFor(stage)
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email, trial_ends_at')
        .eq('plan', 'free')
        .neq('suspended', true)
        .gte('trial_ends_at', start.toISOString())
        .lte('trial_ends_at', end.toISOString()) as { data: TrialUser[] | null; error: unknown }

      if (error) {
        summary.errors.push(`[${stage}] Query failed: ${String(error)}`)
        continue
      }

      console.log(`[CRON] Stage ${stage}: ${users?.length ?? 0} users in window`)

      for (const user of users ?? []) {
        if (!user.phone && !user.email) continue
        await sendReminder(user, stage, summary, supabase)
      }
    } catch (err) {
      summary.errors.push(`[${stage}] Unexpected: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // ── Exam reminders (7 days before) ───────────────────────────────────────
  try {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 7)
    const targetDateStr = targetDate.toISOString().split('T')[0]

    type ExamRow = {
      student_id: string
      subject: { name: string } | null
      student_profile: { user: { full_name: string | null; phone: string | null; email: string | null } | null } | null
    }

    const { data: exams, error: examErr } = await supabase
      .from('exam_timetable')
      .select(`student_id, subject:subjects(name), student_profile:student_profiles(user:profiles(full_name, phone, email))`)
      .eq('exam_date', targetDateStr) as { data: ExamRow[] | null; error: unknown }

    if (examErr) {
      summary.errors.push(`Exam query failed: ${String(examErr)}`)
    } else {
      for (const exam of exams ?? []) {
        const phone   = exam.student_profile?.user?.phone
        const email   = exam.student_profile?.user?.email
        const name    = exam.student_profile?.user?.full_name?.split(' ')[0] ?? 'Student'
        const subject = exam.subject?.name ?? 'your upcoming'
        if (!phone && !email) continue

        if (phone) {
          const result = await sendSMS(phone, SMS_TEMPLATES.examReminder(name, subject, 7))
          if (result.success) { summary.examReminders.sent++ } else { summary.examReminders.failed++ }
        } else if (email) {
          const html = emailLayout(`
            <h2 style="color:#0284c7;font-size:22px;margin:0 0 8px">Hi ${name} — Exam in 7 days!</h2>
            <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px">
              Your <strong>${subject}</strong> exam is coming up in exactly 7 days. 
              Log in to ZimLearn to review past papers and practice tests.
            </p>
            <div style="text-align:center;margin:28px 0">
              <a href="https://zim-elearningai.co.zw/student/dashboard" style="background-color:#0284c7;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;font-size:16px">Go to Dashboard</a>
            </div>
          `)
          const result = await sendEmail(email, `Exam Reminder: ${subject} in 7 days`, html)
          if (result.success) { summary.examReminders.sent++ } else { summary.examReminders.failed++ }
        }
      }
    }
  } catch (err) {
    summary.errors.push(`Exam reminders: ${err instanceof Error ? err.message : String(err)}`)
  }

  console.log('[cron/sms-reminders] Summary:', JSON.stringify(summary, null, 2))

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), ...summary })
}
