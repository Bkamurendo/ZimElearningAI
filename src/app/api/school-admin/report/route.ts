export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, school_id, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'school_admin' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const schoolId = req.nextUrl.searchParams.get('schoolId') ?? profile?.school_id
  if (!schoolId) return NextResponse.json({ error: 'No school ID' }, { status: 400 })

  // Fetch school info
  const { data: school } = await supabase
    .from('schools')
    .select('name, province, subscription_plan, max_students')
    .eq('id', schoolId)
    .single()

  // Fetch students
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at, plan, ai_requests_today')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .order('created_at', { ascending: false })

  // Fetch teachers
  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('school_id', schoolId)
    .eq('role', 'teacher')

  // Cohort: students joined by month (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const cohortMap: Record<string, number> = {}
  ;(students ?? []).forEach((s) => {
    const d = new Date(s.created_at)
    if (d >= sixMonthsAgo) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      cohortMap[key] = (cohortMap[key] ?? 0) + 1
    }
  })

  const totalAiToday = (students ?? []).reduce(
    (sum, s) => sum + (Number(s.ai_requests_today) || 0), 0
  )

  const reportDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const cohortRows = Object.entries(cohortMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => {
      const [year, m] = month.split('-')
      const label = new Date(Number(year), Number(m) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
      return `<tr><td>${label}</td><td>${count}</td></tr>`
    })
    .join('')

  const studentRows = (students ?? []).slice(0, 50).map((s) => {
    const joined = new Date(s.created_at).toLocaleDateString('en-GB')
    return `<tr>
      <td>${s.full_name ?? '—'}</td>
      <td>${s.email ?? '—'}</td>
      <td>${joined}</td>
      <td>${Number(s.ai_requests_today) || 0}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ZimLearn School Report — ${school?.name ?? 'School'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; background: #fff; padding: 40px; max-width: 900px; margin: 0 auto; font-size: 14px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #10b981; padding-bottom: 24px; margin-bottom: 32px; }
    .logo { font-size: 26px; font-weight: 900; color: #10b981; letter-spacing: -0.5px; }
    .logo span { color: #0f172a; }
    .school-name { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 4px; }
    .report-meta { text-align: right; font-size: 12px; color: #64748b; }
    .report-meta strong { display: block; font-size: 14px; color: #1e293b; margin-bottom: 4px; }
    h2 { font-size: 15px; font-weight: 700; color: #0f172a; margin: 28px 0 12px; padding-left: 10px; border-left: 4px solid #10b981; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 8px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center; }
    .stat-num { font-size: 28px; font-weight: 900; color: #10b981; line-height: 1; }
    .stat-label { font-size: 11px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 8px; }
    th { background: #0f172a; color: #fff; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; }
    tr:hover td { background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
    .cohort-bar { display: flex; align-items: center; gap: 8px; margin: 6px 0; }
    .cohort-bar-fill { height: 18px; background: #10b981; border-radius: 3px; min-width: 4px; }
    .cohort-bar-label { font-size: 11px; color: #64748b; white-space: nowrap; }
    .cohort-bar-count { font-size: 12px; font-weight: 700; color: #0f172a; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Zim<span>Learn</span></div>
      <div class="school-name">${school?.name ?? 'School'}</div>
      <div style="font-size:12px;color:#64748b;margin-top:4px">${school?.province ?? ''} &bull; Plan: ${school?.subscription_plan ?? 'basic'}</div>
    </div>
    <div class="report-meta">
      <strong>School Analytics Report</strong>
      Generated: ${reportDate}<br/>
      Prepared by ZimLearn Platform
    </div>
  </div>

  <h2>Summary Statistics</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-num">${(students ?? []).length}</div>
      <div class="stat-label">Total Students</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${(teachers ?? []).length}</div>
      <div class="stat-label">Teachers</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${totalAiToday}</div>
      <div class="stat-label">AI Requests Today</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${school?.max_students ?? '∞'}</div>
      <div class="stat-label">Seat Capacity</div>
    </div>
  </div>

  <h2>Student Enrolment by Month (Last 6 Months)</h2>
  <table>
    <thead><tr><th>Month</th><th>New Students</th></tr></thead>
    <tbody>${cohortRows || '<tr><td colspan="2" style="color:#94a3b8;text-align:center">No data in last 6 months</td></tr>'}</tbody>
  </table>

  <h2>Student Roster (First 50)</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Joined</th>
        <th>AI Requests Today</th>
      </tr>
    </thead>
    <tbody>${studentRows || '<tr><td colspan="4" style="color:#94a3b8;text-align:center">No students enrolled</td></tr>'}</tbody>
  </table>

  <h2>Teaching Staff</h2>
  <table>
    <thead><tr><th>Name</th><th>Email</th></tr></thead>
    <tbody>
      ${(teachers ?? []).map(t => `<tr><td>${t.full_name ?? '—'}</td><td>${t.email ?? '—'}</td></tr>`).join('') || '<tr><td colspan="2" style="color:#94a3b8;text-align:center">No teachers added</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    ZimLearn &mdash; AI-Powered ZIMSEC E-Learning Platform &bull; zimlearn.ai &bull; +263 78 517 0918<br/>
    This report is confidential and intended for school administration use only.
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="zimlearn-report-${schoolId}.html"`,
    },
  })
}
