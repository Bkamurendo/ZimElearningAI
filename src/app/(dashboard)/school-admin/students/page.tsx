import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, Upload, Plus, UserPlus, TrendingUp } from 'lucide-react'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-ZW', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function levelLabel(level: string | null | undefined): string {
  switch (level) {
    case 'olevel':  return 'O-Level'
    case 'alevel':  return 'A-Level'
    case 'primary': return 'Primary'
    default:        return '—'
  }
}

function levelBadge(level: string | null | undefined): string {
  switch (level) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch admin profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, school_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'school_admin') redirect('/login')
  if (!profile.school_id) redirect('/login')

  // Fetch school for capacity limit
  const { data: school } = await supabase
    .from('schools')
    .select('name, max_students, subscription_plan')
    .eq('id', profile.school_id)
    .single()

  const maxStudents = school?.max_students ?? 50

  // Fetch all students for this school
  const { data: studentProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at, ai_requests_today, suspended')
    .eq('school_id', profile.school_id)
    .eq('role', 'student')
    .order('created_at', { ascending: false })

  const students = studentProfiles ?? []

  // Build a map of student_profile data (zimsec_level, grade) keyed by user_id
  type StudentProfileRow = {
    user_id: string
    zimsec_level: string | null
    grade: string | null
  }
  let spMap = new Map<string, StudentProfileRow>()

  if (students.length > 0) {
    try {
      const ids = students.map(s => s.id)
      const { data: spRows } = await supabase
        .from('student_profiles')
        .select('user_id, zimsec_level, grade')
        .in('user_id', ids)

      spMap = new Map((spRows ?? []).map(sp => [sp.user_id, sp]))
    } catch {
      // student_profiles not yet populated — degrade gracefully
    }
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Students
              <span className="ml-2 text-base font-semibold text-indigo-600">
                ({usedCount})
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{school?.name ?? 'My School'}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/school-admin/import"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 hover:border-gray-300 transition shadow-sm"
            >
              <Upload size={15} />
              Import CSV
            </Link>
            <Link
              href="/school-admin/import"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
            >
              <Plus size={15} />
              Add Student
            </Link>
          </div>
        </div>

        {/* Capacity bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-indigo-500" />
              <span className="text-sm font-semibold text-gray-800">Student Capacity</span>
            </div>
            <span className="text-sm font-bold text-gray-700">
              {usedCount}{' '}
              <span className="text-gray-400 font-normal">/ {maxStudents} students used</span>
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${capacityBarColor}`}
              style={{ width: `${Math.min(100, capacityPct)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {Math.max(0, maxStudents - usedCount)} seats remaining on your{' '}
            <span className="font-medium capitalize">{school?.subscription_plan ?? 'basic'}</span>{' '}
            plan
          </p>
        </div>

        {/* Students table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {students.length === 0 ? (
            /* Empty state */
            <div className="px-6 py-16 text-center">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserPlus size={26} className="text-indigo-400" />
              </div>
              <p className="text-gray-700 font-semibold text-base">No students yet</p>
              <p className="text-gray-400 text-sm mt-1.5 max-w-xs mx-auto">
                Import a CSV or add students individually to get started
              </p>
              <div className="flex items-center justify-center gap-3 mt-5">
                <Link
                  href="/school-admin/import"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
                >
                  <Upload size={14} />
                  Import CSV
                </Link>
                <Link
                  href="/school-admin/import"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 transition"
                >
                  <Plus size={14} />
                  Add Individually
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="px-6 py-3.5 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Users size={15} className="text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {usedCount} student{usedCount !== 1 ? 's' : ''} enrolled
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Email
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Grade
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        AI Used Today
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Joined
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map((student, i) => {
                      const sp = spMap.get(student.id)
                      const { label: statusLabel, className: statusClass } = statusBadge(
                        student.suspended,
                      )
                      return (
                        <tr
                          key={student.id}
                          className={`hover:bg-slate-50 transition ${
                            i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                          }`}
                        >
                          {/* Name + avatar */}
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-indigo-700 text-xs font-bold">
                                  {(student.full_name ?? 'S')
                                    .split(' ')
                                    .map((n: string) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </span>
                              </div>
                              <span className="font-medium text-gray-900 truncate max-w-[140px]">
                                {student.full_name ?? 'Unknown'}
                              </span>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3.5 text-gray-500 hidden sm:table-cell truncate max-w-[180px]">
                            {student.email ?? '—'}
                          </td>

                          {/* Level */}
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${levelBadge(
                                sp?.zimsec_level,
                              )}`}
                            >
                              {levelLabel(sp?.zimsec_level)}
                            </span>
                          </td>

                          {/* Grade */}
                          <td className="px-4 py-3.5 text-gray-600 hidden md:table-cell">
                            {sp?.grade ?? '—'}
                          </td>

                          {/* AI Used Today */}
                          <td className="px-4 py-3.5 hidden lg:table-cell">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-sm font-semibold ${
                                  (student.ai_requests_today ?? 0) > 0
                                    ? 'text-amber-600'
                                    : 'text-gray-400'
                                }`}
                              >
                                {student.ai_requests_today ?? 0}
                              </span>
                              <span className="text-xs text-gray-400">reqs</span>
                            </div>
                          </td>

                          {/* Joined */}
                          <td className="px-4 py-3.5 text-gray-400 text-xs hidden lg:table-cell">
                            {formatDate(student.created_at)}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${statusClass}`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Showing {usedCount} of {maxStudents} max students
                </p>
                <Link
                  href="/school-admin/import"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  <UserPlus size={13} />
                  Add more students
                </Link>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
