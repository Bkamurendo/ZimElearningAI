export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, Upload, Plus, UserPlus, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'

function _formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB')
}

function levelLabel(level: string | null | undefined): string {
  switch (level?.toLowerCase()) {
    case 'olevel':  return 'O-Level'
    case 'alevel':  return 'A-Level'
    case 'primary': return 'Primary'
    default:        return '—'
  }
}

function levelBadge(level: string | null | undefined): string {
  switch (level?.toLowerCase()) {
    case 'olevel':  return 'bg-indigo-100 text-indigo-700'
    case 'alevel':  return 'bg-emerald-100 text-emerald-700'
    case 'primary': return 'bg-amber-100 text-amber-700'
    default:        return 'bg-gray-100 text-gray-500'
  }
}

function statusBadge(suspended: boolean | null | undefined): {
  label: string
  className: string
} {
  if (suspended) {
    return { label: 'Suspended', className: 'bg-red-100 text-red-700' }
  }
  return { label: 'Active', className: 'bg-emerald-100 text-emerald-700' }
}

export default async function SchoolAdminStudents() {
  const supabase = createClient()
  
  // Safely check for user without crashing on null data
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user
  
  if (authError || !user) redirect('/login')

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role, school_id')
      .eq('id', user.id)
      .single()

    if (profile?.role?.toLowerCase() !== 'school_admin' || !profile?.school_id) {
      const safeRole = profile?.role?.toLowerCase() || 'student'
      redirect(`/${safeRole === 'school_admin' ? 'school-admin' : safeRole}/dashboard`)
    }

    const { data: school } = await supabase
      .from('schools')
      .select('name, max_students, subscription_plan')
      .eq('id', profile.school_id)
      .single()

    const maxStudents = school?.max_students ?? 50

    const { data: studentProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at, ai_requests_today, suspended')
      .eq('school_id', profile.school_id)
      .eq('role', 'student')
      .order('created_at', { ascending: false })

    const students = studentProfiles ?? []
    const ids = students.map(s => s.id)
    let spMap = new Map<string, any>()

    if (ids.length > 0) {
      const { data: spRows } = await supabase
        .from('student_profiles')
        .select('user_id, zimsec_level, grade')
        .in('user_id', ids)

      spMap = new Map((spRows ?? []).map(sp => [sp.user_id, sp]))
    }

    const usedCount = students.length
    const capacityPct = maxStudents > 0 ? (usedCount / maxStudents) * 100 : 0
    const capacityBarColor =
      capacityPct >= 90
        ? 'bg-red-500'
        : capacityPct >= 70
        ? 'bg-amber-500'
        : 'bg-emerald-500'

    return (
      <div className="min-h-screen bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 uppercase">
                Student Body
                <span className="ml-2 text-base font-bold text-indigo-600">
                  ({usedCount})
                </span>
              </h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{school?.name ?? 'Institutional Portal'}</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/school-admin/import"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 text-[10px] font-bold rounded-xl border border-gray-200 shadow-sm transition uppercase"
              >
                <Upload size={15} />
                Import Records
              </Link>
              <Link
                href="/school-admin/import"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl transition shadow-lg uppercase"
              >
                <Plus size={15} />
                New Student
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-indigo-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">Institutional Capacity</span>
              </div>
              <span className="text-[10px] font-bold text-gray-700 uppercase">
                {usedCount}{' '}
                <span className="text-gray-400 font-medium">/ {maxStudents} Seats</span>
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner font-bold uppercase">
              <div
                className={`h-full rounded-full transition-all duration-700 ${capacityBarColor}`}
                style={{ width: `${Math.min(100, capacityPct)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase italic">
              {Math.max(0, maxStudents - usedCount)} Seats remaining on {school?.subscription_plan ?? 'Basic'} Tier
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {students.length === 0 ? (
              <div className="px-6 py-16 text-center uppercase">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus size={26} className="text-indigo-400" />
                </div>
                <p className="text-gray-700 font-bold text-sm">Empty enrollment</p>
                <p className="text-gray-400 text-[10px] mt-1.5 max-w-xs mx-auto font-medium">
                  Upload records or add students individually to begin.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto uppercase">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50 uppercase font-bold text-gray-400">
                      <th className="text-left px-6 py-4 text-[10px]">Student Name</th>
                      <th className="text-left px-4 py-4 text-[10px] hidden sm:table-cell">Identity</th>
                      <th className="text-left px-4 py-4 text-[10px]">Level</th>
                      <th className="text-left px-4 py-4 text-[10px] hidden md:table-cell">Grade</th>
                      <th className="text-right px-6 py-4 text-[10px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-bold">
                    {students.map((student) => {
                      const sp = spMap.get(student.id)
                      const { label: statusLabel, className: statusClass } = statusBadge(student.suspended)
                      const initials = (student.full_name ?? 'S')
                        .split(' ')
                        .filter(Boolean)
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'S'

                      return (
                        <tr key={student.id} className="hover:bg-slate-50 transition-colors uppercase">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
                                <span className="text-indigo-700 text-[10px] font-bold">{initials}</span>
                              </div>
                              <span className="font-bold text-slate-800 text-[11px] truncate">{student.full_name ?? 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-400 text-[10px] hidden sm:table-cell truncate">{student.email ?? '-'}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${levelBadge(sp?.zimsec_level)}`}>
                              {levelLabel(sp?.zimsec_level)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-gray-500 text-[10px] hidden md:table-cell">{sp?.grade ?? '-'}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold shadow-sm border ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  } catch (err) {
    console.error('[SchoolAdminStudents] Runtime error:', err)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center bg-gray-50">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
          <Users size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 uppercase">Institutional Error</h2>
        <p className="text-slate-500 max-w-xs uppercase">We encountered an error while loading the student directory. Please try again.</p>
        <Link href="/login">
          <Button variant="outline">Back to Login</Button>
        </Link>
      </div>
    )
  }
}
