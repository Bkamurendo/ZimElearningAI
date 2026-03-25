import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  GraduationCap,
  ArrowLeft,
  UserPlus,
  Upload,
  Users,
} from 'lucide-react'

export const metadata = { title: 'Teachers — School Admin' }

export default async function SchoolAdminTeachersPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, school_id, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'school_admin') redirect('/login')
  if (!profile?.school_id) redirect('/login')

  const schoolId = profile.school_id as string

  // Fetch all teachers in this school
  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at')
    .eq('school_id', schoolId)
    .eq('role', 'teacher')
    .order('created_at', { ascending: false })

  // Try to fetch teacher_profiles for qualification/bio/subjects
  const teacherIds = (teachers ?? []).map((t) => t.id)
  let teacherProfileMap: Record<
    string,
    { qualification: string | null; bio: string | null; subjects: string[] }
  > = {}

  if (teacherIds.length > 0) {
    const { data: teacherProfiles } = await supabase
      .from('teacher_profiles')
      .select(
        'user_id, qualification, bio, teacher_subjects(subjects(name))'
      )
      .in('user_id', teacherIds)

    for (const tp of teacherProfiles ?? []) {
      const subjects =
        (
          tp.teacher_subjects as unknown as {
            subjects: { name: string } | null
          }[]
        )
          ?.map((ts) => ts.subjects?.name)
          .filter(Boolean) as string[]
      teacherProfileMap[tp.user_id as string] = {
        qualification: tp.qualification ?? null,
        bio: tp.bio ?? null,
        subjects: subjects ?? [],
      }
    }
  }

  const all = teachers ?? []

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/school-admin/dashboard"
            className="inline-flex items-center gap-1.5 text-emerald-200 hover:text-white text-sm mb-4 transition"
          >
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <GraduationCap size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Teachers</h1>
                <p className="text-emerald-200 text-sm">
                  {all.length} teacher{all.length !== 1 ? 's' : ''} in your
                  school
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              <Link
                href="/school-admin/import"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-xl transition border border-white/20"
              >
                <Upload size={15} /> Import CSV
              </Link>
              <Link
                href="/school-admin/import?tab=teachers"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-50 transition shadow-sm"
              >
                <UserPlus size={15} /> Add Teacher
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {all.length === 0 ? (
          /* ── Empty state ── */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              No teachers yet
            </h2>
            <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
              Add teachers individually or import them in bulk using a CSV
              file.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/school-admin/import?tab=teachers"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
              >
                <UserPlus size={15} /> Add Teacher
              </Link>
              <Link
                href="/school-admin/import"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
              >
                <Upload size={15} /> Import CSV
              </Link>
            </div>
          </div>
        ) : (
          /* ── Teachers table ── */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">All Teachers</h2>
              <span className="text-xs text-slate-400 font-medium">
                {all.length} total
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Email
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Qualification
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Subjects
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {all.map((teacher) => {
                    const tp = teacherProfileMap[teacher.id]
                    const initials = (teacher.full_name ?? 'T')
                      .split(' ')
                      .map((n: string) => n[0] ?? '')
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                    return (
                      <tr
                        key={teacher.id}
                        className="hover:bg-slate-50 transition"
                      >
                        {/* Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0">
                              {initials || 'T'}
                            </div>
                            <span className="font-medium text-slate-800">
                              {teacher.full_name ?? '—'}
                            </span>
                          </div>
                        </td>
                        {/* Email */}
                        <td className="px-6 py-4 text-slate-500">
                          {teacher.email ?? '—'}
                        </td>
                        {/* Qualification */}
                        <td className="px-6 py-4 text-slate-600">
                          {tp?.qualification ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
                              {tp.qualification}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                        {/* Subjects */}
                        <td className="px-6 py-4">
                          {tp?.subjects && tp.subjects.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {tp.subjects.slice(0, 3).map((s) => (
                                <span
                                  key={s}
                                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700"
                                >
                                  {s}
                                </span>
                              ))}
                              {tp.subjects.length > 3 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                  +{tp.subjects.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                        {/* Joined */}
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {teacher.created_at
                            ? new Date(
                                teacher.created_at as string
                              ).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
