export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  if (!studentId) return NextResponse.json({ error: 'studentId is required' }, { status: 400 })

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Auth check: student can view own report, parent can view their child's report
  const { data: requestorProfile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null; error: unknown }

  if (requestorProfile?.role === 'student') {
    // Must be their own student_profile
    const { data: sp } = await supabase
      .from('student_profiles').select('id').eq('id', studentId).eq('user_id', user.id).single()
    if (!sp) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } else if (requestorProfile?.role === 'parent') {
    // Must be one of their children
    const { data: sp } = await supabase
      .from('student_profiles').select('id').eq('id', studentId).eq('parent_id', user.id).single()
    if (!sp) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch student_profile base info
  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('id, grade, zimsec_level, user_id')
    .eq('id', studentId)
    .single() as { data: { id: string; grade: string; zimsec_level: string; user_id: string } | null; error: unknown }

  if (!studentProfile) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  // Fetch student's name via service client (bypass profiles RLS)
  const { data: studentUser } = await serviceClient
    .from('profiles').select('full_name, email').eq('id', studentProfile.user_id).single() as { data: { full_name: string; email: string } | null; error: unknown }

  // Subject enrolments with mastery
  type EnrolRow = { subject: { name: string; code: string } | null }
  const { data: enrolments } = await supabase
    .from('student_subjects')
    .select('subject:subjects(name, code)')
    .eq('student_id', studentId) as { data: EnrolRow[] | null; error: unknown }

  // Topic mastery aggregated per subject
  type MasteryRow = { topic: string; mastery_level: string; subject: { name: string } | null }
  const { data: masteries } = await supabase
    .from('topic_mastery')
    .select('topic, mastery_level, subject:subjects(name)')
    .eq('student_id', studentId)
    .order('mastery_level', { ascending: false }) as { data: MasteryRow[] | null; error: unknown }

  // Aggregate mastery per subject
  type SubjectMasteryAgg = {
    name: string
    mastered: number
    learning: number
    notStarted: number
    total: number
  }
  const subjectMasteryMap = new Map<string, SubjectMasteryAgg>()
  for (const m of masteries ?? []) {
    const sName = m.subject?.name ?? 'General'
    const existing = subjectMasteryMap.get(sName) ?? { name: sName, mastered: 0, learning: 0, notStarted: 0, total: 0 }
    existing.total++
    if (m.mastery_level === 'mastered') existing.mastered++
    else if (m.mastery_level === 'learning') existing.learning++
    else existing.notStarted++
    subjectMasteryMap.set(sName, existing)
  }
  // Fill in enrolled subjects not in mastery
  for (const e of enrolments ?? []) {
    const sName = e.subject?.name ?? 'Unknown'
    if (!subjectMasteryMap.has(sName)) {
      subjectMasteryMap.set(sName, { name: sName, mastered: 0, learning: 0, notStarted: 0, total: 0 })
    }
  }
  const subjectMastery = Array.from(subjectMasteryMap.values())

  // Quiz attempts — last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  type QuizRow = { id: string; score: number | null; max_score: number | null; created_at: string }
  const { data: quizAttempts } = await supabase
    .from('quiz_attempts')
    .select('id, score, max_score, created_at')
    .eq('student_id', studentId)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(20) as { data: QuizRow[] | null; error: unknown }

  const quizScores = (quizAttempts ?? []).map(q => {
    const pct = q.max_score && q.max_score > 0 ? Math.round(((q.score ?? 0) / q.max_score) * 100) : null
    return { date: q.created_at, score: q.score ?? 0, maxScore: q.max_score ?? 0, pct }
  })

  const avgScore = quizScores.length > 0 && quizScores.some(q => q.pct !== null)
    ? Math.round(quizScores.filter(q => q.pct !== null).reduce((s, q) => s + (q.pct ?? 0), 0) / quizScores.filter(q => q.pct !== null).length)
    : null

  // Lesson progress count
  const { count: lessonsCompleted } = await supabase
    .from('lesson_progress')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)

  // Streaks & XP
  const { data: streakData } = await supabase
    .from('student_streaks')
    .select('current_streak, longest_streak, total_xp')
    .eq('student_id', studentId)
    .single() as { data: { current_streak: number; longest_streak: number; total_xp: number } | null; error: unknown }

  // Badges
  type BadgeRow = { badge_name: string; earned_at: string }
  const { data: badges } = await supabase
    .from('student_badges')
    .select('badge_name, earned_at')
    .eq('student_id', studentId)
    .order('earned_at', { ascending: false }) as { data: BadgeRow[] | null; error: unknown }

  // Build HTML
  const levelLabel: Record<string, string> = { primary: 'Primary', olevel: 'O-Level', alevel: 'A-Level' }
  const studentName = studentUser?.full_name ?? 'Student'
  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const subjectMasteryRows = subjectMastery.map(s => {
    const pct = s.total > 0 ? Math.round((s.mastered / s.total) * 100) : 0
    return `
      <tr>
        <td><strong>${escHtml(s.name)}</strong></td>
        <td style="text-align:center;">${s.mastered}</td>
        <td style="text-align:center;">${s.learning}</td>
        <td style="text-align:center;">${s.total}</td>
        <td>
          <div class="mastery-bar">
            <div class="mastery-fill" style="width:${pct}%"></div>
          </div>
          <p style="font-size:11px;margin:4px 0 0;color:#64748b;">${pct}%</p>
        </td>
      </tr>`
  }).join('')

  const quizRows = quizScores.slice(0, 10).map((q, i) => {
    const color = q.pct !== null && q.pct >= 60 ? '#16a34a' : '#d97706'
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${new Date(q.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
        <td>${q.score} / ${q.maxScore}</td>
        <td style="color:${color};font-weight:bold;">${q.pct !== null ? q.pct + '%' : '—'}</td>
      </tr>`
  }).join('')

  const badgesHtml = (badges ?? []).length > 0
    ? (badges ?? []).map(b => `<span class="badge">🏅 ${escHtml(b.badge_name)}</span>`).join('')
    : '<p style="color:#94a3b8;font-size:13px;">No badges earned yet.</p>'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Progress Report — ${escHtml(studentName)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #1e293b; padding: 40px; max-width: 800px; margin: 0 auto; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
    .school-name { font-size: 24px; font-weight: bold; color: #10b981; }
    .school-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
    .report-label { font-size: 13px; color: #64748b; text-align: right; }
    .report-label strong { display: block; font-size: 18px; color: #1e293b; margin-bottom: 4px; }
    .student-info { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px; display: flex; gap: 40px; flex-wrap: wrap; }
    .student-info div { }
    .student-info label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: bold; }
    .student-info p { font-size: 15px; font-weight: 600; color: #1e293b; margin-top: 3px; }
    h2 { color: #1e293b; border-left: 4px solid #10b981; padding-left: 10px; margin: 30px 0 16px; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 0 0 20px; }
    th { background: #0f172a; color: white; padding: 10px 12px; text-align: left; font-size: 13px; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; vertical-align: middle; }
    tr:nth-child(even) td { background: #f8fafc; }
    .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 9999px; font-size: 12px; margin: 3px; border: 1px solid #fde68a; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 0 0 30px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center; }
    .stat-num { font-size: 28px; font-weight: bold; color: #10b981; }
    .stat-label { font-size: 11px; color: #94a3b8; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .mastery-bar { height: 8px; background: #e2e8f0; border-radius: 4px; margin-top: 6px; }
    .mastery-fill { height: 8px; background: #10b981; border-radius: 4px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .footer p { font-size: 11px; color: #94a3b8; }
    .badges-section { margin: 0 0 20px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="school-name">ZimLearn</div>
      <div class="school-sub">Zimbabwe E-Learning Platform</div>
    </div>
    <div class="report-label">
      <strong>Student Progress Report</strong>
      Generated: ${escHtml(generatedDate)}
    </div>
  </div>

  <!-- Student Info -->
  <div class="student-info">
    <div>
      <label>Student Name</label>
      <p>${escHtml(studentName)}</p>
    </div>
    <div>
      <label>Level</label>
      <p>${escHtml(levelLabel[studentProfile.zimsec_level] ?? studentProfile.zimsec_level)}</p>
    </div>
    <div>
      <label>Grade / Form</label>
      <p>${escHtml(studentProfile.grade)}</p>
    </div>
    <div>
      <label>Subjects Enrolled</label>
      <p>${(enrolments ?? []).length}</p>
    </div>
  </div>

  <!-- Summary Stats -->
  <h2>Summary</h2>
  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-num">${streakData?.total_xp?.toLocaleString() ?? 0}</div>
      <div class="stat-label">Total XP</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${streakData?.current_streak ?? 0}</div>
      <div class="stat-label">Day Streak</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${lessonsCompleted ?? 0}</div>
      <div class="stat-label">Lessons Done</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${avgScore !== null ? avgScore + '%' : '—'}</div>
      <div class="stat-label">Avg Quiz Score</div>
    </div>
  </div>

  <!-- Subject Mastery Table -->
  ${subjectMastery.length > 0 ? `
  <h2>Subject Mastery</h2>
  <table>
    <thead>
      <tr>
        <th>Subject</th>
        <th style="text-align:center;">Mastered</th>
        <th style="text-align:center;">In Progress</th>
        <th style="text-align:center;">Total Topics</th>
        <th>Progress</th>
      </tr>
    </thead>
    <tbody>
      ${subjectMasteryRows}
    </tbody>
  </table>
  ` : ''}

  <!-- Recent Quiz Scores -->
  ${quizScores.length > 0 ? `
  <h2>Recent Quiz Scores (Last 30 Days)</h2>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Date</th>
        <th>Score</th>
        <th>Percentage</th>
      </tr>
    </thead>
    <tbody>
      ${quizRows}
    </tbody>
  </table>
  ` : ''}

  <!-- Badges -->
  <h2>Achievements</h2>
  <div class="badges-section">
    ${badgesHtml}
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>ZimLearn — Empowering Zimbabwe&apos;s learners</p>
    <p>Report generated on ${escHtml(generatedDate)} &bull; Confidential</p>
  </div>

  <script>
    // Auto print dialog when opened in a new tab
    window.onload = function() {
      // Small delay so the page renders first
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function escHtml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
