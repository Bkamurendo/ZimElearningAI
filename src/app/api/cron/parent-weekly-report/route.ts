/**
 * GET /api/cron/parent-weekly-report
 *
 * Vercel Cron — runs every Sunday at 08:00 UTC (10:00 Zimbabwe time).
 *
 * Sends a weekly progress report to each parent for every linked child.
 * Prefers SMS (Africa's Talking) when the parent has a phone number,
 * falls back to email (Resend) otherwise.
 *
 * Data gathered per child:
 *   - Profile info (name, grade, ZIMSEC level)
 *   - Enrolled subject count
 *   - Current study streak
 *   - Quiz attempts this week (from quiz_attempts if available)
 *   - Days active this week (distinct dates with quiz_attempts)
 *   - Next upcoming exam within 30 days (from exam_timetable)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/sms'
import { SMS_TEMPLATES } from '@/lib/sms-templates'
import { sendEmail } from '@/lib/email'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParentChild {
  parentId: string
  parentName: string
  parentPhone: string | null
  parentEmail: string | null
  childId: string
  childName: string
  grade: string | null
  zimsecLevel: string | null
}

interface ChildReport {
  childName: string
  grade: string | null
  zimsecLevel: string | null
  subjectCount: number
  streak: number
  daysActive: number
  quizCount: number
  nextExamSubject: string | null
  nextExamDays: number | null
}

// ── Email template ────────────────────────────────────────────────────────────

function weeklyReportEmailHtml(parentName: string, reports: ChildReport[]): string {
  const childSections = reports.map((r) => {
    const nextExamLine = r.nextExamSubject
      ? `<tr><td style="padding:8px 12px;color:#6b7280;font-size:14px">Next Exam</td><td style="padding:8px 12px;font-weight:600;color:#1f2937;font-size:14px">${r.nextExamSubject} in ${r.nextExamDays} day${r.nextExamDays !== 1 ? 's' : ''}</td></tr>`
      : `<tr><td style="padding:8px 12px;color:#6b7280;font-size:14px">Next Exam</td><td style="padding:8px 12px;color:#9ca3af;font-size:14px">None in next 30 days</td></tr>`

    return `
      <div style="margin:20px 0;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
        <div style="background:#f0fdf4;padding:14px 20px;border-bottom:1px solid #e5e7eb">
          <h3 style="margin:0;font-size:17px;color:#15803d">${r.childName}</h3>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280">${r.grade ?? ''} ${r.zimsecLevel ? `(${r.zimsecLevel.toUpperCase()})` : ''}</p>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <tr style="border-bottom:1px solid #f3f4f6"><td style="padding:8px 12px;color:#6b7280;font-size:14px">Subjects Enrolled</td><td style="padding:8px 12px;font-weight:600;color:#1f2937;font-size:14px">${r.subjectCount}</td></tr>
          <tr style="border-bottom:1px solid #f3f4f6"><td style="padding:8px 12px;color:#6b7280;font-size:14px">Study Streak</td><td style="padding:8px 12px;font-weight:600;color:#1f2937;font-size:14px">${r.streak} day${r.streak !== 1 ? 's' : ''} ${r.streak >= 7 ? '&#128293;' : ''}</td></tr>
          <tr style="border-bottom:1px solid #f3f4f6"><td style="padding:8px 12px;color:#6b7280;font-size:14px">Active This Week</td><td style="padding:8px 12px;font-weight:600;color:#1f2937;font-size:14px">${r.daysActive}/7 days</td></tr>
          <tr style="border-bottom:1px solid #f3f4f6"><td style="padding:8px 12px;color:#6b7280;font-size:14px">Quizzes This Week</td><td style="padding:8px 12px;font-weight:600;color:#1f2937;font-size:14px">${r.quizCount}</td></tr>
          ${nextExamLine}
        </table>
      </div>
    `
  }).join('')

  return `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px 40px;text-align:center">
        <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700">ZimLearn AI</h1>
        <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">Weekly Parent Report</p>
      </div>
      <div style="padding:36px 40px">
        <h2 style="color:#1f2937;font-size:20px;margin:0 0 8px">Hi ${parentName},</h2>
        <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 16px">
          Here is the weekly progress summary for your child${reports.length > 1 ? 'ren' : ''} on ZimLearn.
        </p>
        ${childSections}
        <div style="text-align:center;margin:28px 0">
          <a href="https://zim-elearningai.co.zw/parent/dashboard" style="background-color:#16a34a;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;font-size:16px">View Full Dashboard</a>
        </div>
        <p style="color:#9ca3af;font-size:13px;text-align:center;margin:16px 0 0">Encourage your child to keep up the streak!</p>
      </div>
      <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center">
        <p style="color:#9ca3af;font-size:12px;margin:0">&copy; 2025 Zim E-Learning AI &middot; <a href="https://zim-elearningai.co.zw" style="color:#16a34a;text-decoration:none">zim-elearningai.co.zw</a></p>
        <p style="color:#9ca3af;font-size:11px;margin:6px 0 0">You received this because your child is registered on ZimLearn.</p>
      </div>
    </div>
  `
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Check if a table exists by attempting a limited query */
async function tableExists(
  supabase: ReturnType<typeof createClient>,
  table: string
): Promise<boolean> {
  const { error } = await supabase.from(table).select('*').limit(0)
  return !error
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Auth check
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createClient()
  const stats = { processed: 0, sent: 0, failed: 0, errors: [] as string[] }

  try {
    // ── 1. Fetch all parent-child pairs ─────────────────────────────────────
    // student_profiles.parent_id references the parent's user id
    const { data: pairs, error: pairsErr } = await supabase
      .from('student_profiles')
      .select(`
        parent_id,
        user_id,
        grade,
        zimsec_level,
        parent:profiles!student_profiles_parent_id_fkey(id, full_name, email, phone_number),
        child:profiles!student_profiles_user_id_fkey(id, full_name, current_streak)
      `)
      .not('parent_id', 'is', null)

    if (pairsErr) {
      stats.errors.push(`Failed to fetch parent-child pairs: ${String(pairsErr)}`)
      return NextResponse.json({ ok: false, ...stats })
    }

    if (!pairs || pairs.length === 0) {
      return NextResponse.json({ ok: true, message: 'No parent-child pairs found', ...stats })
    }

    // Also check parent_profiles for phone numbers as fallback
    const parentIds = Array.from(new Set(pairs.map((p: any) => p.parent_id).filter(Boolean)))
    const { data: parentProfiles } = await supabase
      .from('parent_profiles')
      .select('user_id, phone_number')
      .in('user_id', parentIds)

    const parentPhoneMap = new Map<string, string>()
    for (const pp of parentProfiles ?? []) {
      if (pp.phone_number) parentPhoneMap.set(pp.user_id, pp.phone_number)
    }

    // Check which optional tables exist
    const hasQuizAttempts = await tableExists(supabase, 'quiz_attempts')
    const hasExamTimetable = await tableExists(supabase, 'exam_timetable')

    // ── 2. Group children by parent ─────────────────────────────────────────
    const parentMap = new Map<string, { parent: ParentChild; childIds: string[] }>()

    for (const row of pairs as any[]) {
      const parentProfile = row.parent
      const childProfile = row.child
      if (!parentProfile || !childProfile) continue

      const parentId = row.parent_id as string
      // Phone: prefer parent_profiles.phone_number, then profiles.phone_number
      const phone = parentPhoneMap.get(parentId) || parentProfile.phone_number || null

      if (!parentMap.has(parentId)) {
        parentMap.set(parentId, {
          parent: {
            parentId,
            parentName: parentProfile.full_name ?? 'Parent',
            parentPhone: phone,
            parentEmail: parentProfile.email ?? null,
            childId: childProfile.id,
            childName: childProfile.full_name ?? 'Student',
            grade: row.grade,
            zimsecLevel: row.zimsec_level,
          },
          childIds: [],
        })
      }
      parentMap.get(parentId)!.childIds.push(childProfile.id)
    }

    // ── 3. Process in batches of 50 ─────────────────────────────────────────
    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString()

    const in30Days = new Date(now)
    in30Days.setDate(in30Days.getDate() + 30)
    const todayStr = now.toISOString().split('T')[0]
    const in30Str = in30Days.toISOString().split('T')[0]

    const parentEntries = Array.from(parentMap.entries())
    const BATCH_SIZE = 50

    for (let batchStart = 0; batchStart < parentEntries.length; batchStart += BATCH_SIZE) {
      const batch = parentEntries.slice(batchStart, batchStart + BATCH_SIZE)

      for (const [, entry] of batch) {
        const parentData = entry.parent
        const reports: ChildReport[] = []

        // Build report for each child linked to this parent
        for (const row of pairs as any[]) {
          if (row.parent_id !== parentData.parentId) continue
          const childProfile = row.child
          if (!childProfile) continue

          const childId = childProfile.id as string
          const childName = childProfile.full_name ?? 'Student'
          const streak = childProfile.current_streak ?? 0

          // Subject count
          const { count: subjectCount } = await supabase
            .from('student_subjects')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', childId)

          // Quiz count + days active this week
          let quizCount = 0
          let daysActive = 0

          if (hasQuizAttempts) {
            // Quiz count this week
            const { count: qCount } = await supabase
              .from('quiz_attempts')
              .select('*', { count: 'exact', head: true })
              .eq('student_id', childId)
              .gte('created_at', weekAgoStr)

            quizCount = qCount ?? 0

            // Distinct active days this week
            const { data: activityDays } = await supabase
              .from('quiz_attempts')
              .select('created_at')
              .eq('student_id', childId)
              .gte('created_at', weekAgoStr)

            if (activityDays && activityDays.length > 0) {
              const uniqueDays = new Set(
                activityDays.map((a: any) => new Date(a.created_at).toISOString().split('T')[0])
              )
              daysActive = uniqueDays.size
            }
          } else {
            // Fallback estimate: if streak > 0, assume active at least min(streak, 7) days
            daysActive = Math.min(streak, 7)
          }

          // Next exam within 30 days
          let nextExamSubject: string | null = null
          let nextExamDays: number | null = null

          if (hasExamTimetable) {
            const { data: exams } = await supabase
              .from('exam_timetable')
              .select('exam_date, subject:subjects(name)')
              .eq('student_id', childId)
              .gte('exam_date', todayStr)
              .lte('exam_date', in30Str)
              .order('exam_date', { ascending: true })
              .limit(1)

            if (exams && exams.length > 0) {
              const exam = exams[0] as any
              nextExamSubject = exam.subject?.name ?? null
              if (exam.exam_date) {
                const examDate = new Date(exam.exam_date)
                nextExamDays = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              }
            }
          }

          reports.push({
            childName,
            grade: row.grade,
            zimsecLevel: row.zimsec_level,
            subjectCount: subjectCount ?? 0,
            streak,
            daysActive,
            quizCount,
            nextExamSubject,
            nextExamDays,
          })
        }

        if (reports.length === 0) continue
        stats.processed++

        // ── 4. Send report via SMS or email ───────────────────────────────────
        const parentFirstName = parentData.parentName.split(' ')[0]

        if (parentData.parentPhone) {
          // Send one SMS per child (to keep message under 160 chars)
          let allSent = true
          for (const r of reports) {
            const smsText = SMS_TEMPLATES.parentWeeklyReport(
              parentFirstName,
              r.childName.split(' ')[0],
              r.subjectCount,
              r.streak,
              r.daysActive,
              r.nextExamSubject,
              r.nextExamDays
            )
            const result = await sendSMS(parentData.parentPhone, smsText)
            if (!result.success) {
              allSent = false
              stats.errors.push(`SMS failed for parent ${parentData.parentId}: ${result.error}`)
            }
          }
          if (allSent) stats.sent++
          else stats.failed++
        } else if (parentData.parentEmail) {
          // Send one combined email for all children
          const html = weeklyReportEmailHtml(parentFirstName, reports)
          const childNames = reports.map((r) => r.childName.split(' ')[0]).join(' & ')
          const result = await sendEmail(
            parentData.parentEmail,
            `Weekly Report for ${childNames} - ZimLearn`,
            html
          )
          if (result.success) stats.sent++
          else {
            stats.failed++
            stats.errors.push(`Email failed for parent ${parentData.parentId}: ${result.error}`)
          }
        } else {
          // No contact method
          stats.failed++
          stats.errors.push(`No phone or email for parent ${parentData.parentId}`)
        }
      }
    }
  } catch (err) {
    stats.errors.push(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`)
  }

  console.log('[cron/parent-weekly-report] Summary:', JSON.stringify(stats, null, 2))

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    processed: stats.processed,
    sent: stats.sent,
    failed: stats.failed,
    errors: stats.errors.length > 0 ? stats.errors : undefined,
  })
}
