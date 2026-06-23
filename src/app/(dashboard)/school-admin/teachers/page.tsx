export const dynamic = 'force-dynamic';
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
import { Button } from '@/components/ui/Button'

export const metadata = { title: 'Teachers — School Admin' }

export default async function SchoolAdminTeachersPage() {
  const supabase = createClient()
  
  // Safely check for user without crashing on null data
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user
  
  if (authError || !user) redirect('/login')

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id, full_name')
      .eq('id', user.id)
      .single()

    if (profile?.role?.toLowerCase() !== 'school_admin' || !profile?.school_id) {
      const safeRole = profile?.role?.toLowerCase() || 'student'
      redirect(`/${safeRole === 'school_admin' ? 'school-admin' : safeRole}/dashboard`)
    }

    const schoolId = profile.school_id as string

    // Fetch all teachers in this school
    const { data: teachers } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('school_id', schoolId)
      .eq('role', 'teacher')
      .order('created_at', { ascending: false })

    const teacherList = teachers ?? []
    const teacherIds = teacherList.map((t) => t.id)
    const teacherProfileMap = new Map<
      string,
      { qualification: string | null; bio: string | null; subjects: string[] }
    >()

    if (teacherIds.length > 0) {
      const { data: tpData } = await supabase
        .from('teacher_profiles')
        .select('user_id, qualification, bio, teacher_subjects(subjects(name))')
        .in('user_id', teacherIds)

      for (const tp of tpData ?? []) {
        const subjects = (tp.teacher_subjects as any)
          ?.map((ts: any) => ts.subjects?.name)
          .filter(Boolean) as string[]
          
        teacherProfileMap.set(tp.user_id as string, {
          qualification: tp.qualification ?? null,
          bio: tp.bio ?? null,
          subjects: subjects ?? [],
        })
      }
    }

    return (
      <div className="min-h-screen bg-slate-50/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <Link
              href="/school-admin/dashboard"
              className="inline-flex items-center gap-1.5 text-emerald-100 hover:text-white text-[10px] mb-4 transition uppercase font-bold"
            >
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/10 shadow-sm">
                  <GraduationCap size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Faculty Management</h1>
                  <p className="text-emerald-100 text-[10px] uppercase font-bold">
                    {teacherList.length} teacher{teacherList.length !== 1 ? 's' : ''} in your institution
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <Link
                  href="/school-admin/import"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold rounded-xl transition border border-white/20 uppercase"
                >
                  <Upload size={15} /> Import CSV
                </Link>
                <Link
                  href="/school-admin/import?tab=teachers"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 text-[10px] font-bold rounded-xl hover:bg-emerald-50 transition shadow-lg uppercase"
                >
                  <UserPlus size={15} /> Add Teacher
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {teacherList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm p-16 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2 uppercase tracking-tight">
                No faculty members found
              </h2>
              <p className="text-slate-400 text-[10px] mb-6 max-w-xs mx-auto uppercase font-bold italic">
                Add teachers individually or import them in bulk using institutional CSV records.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/school-admin/import?tab=teachers"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl transition shadow-md uppercase"
                >
                  <UserPlus size={15} /> New Teacher
                </Link>
                <Link
                  href="/school-admin/import"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-xl transition uppercase"
                >
                  <Upload size={15} /> Bulk Import
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between uppercase">
                <h2 className="font-bold text-slate-800 text-sm tracking-tight">Active Faculty</h2>
                <span className="text-[10px] text-slate-400 font-bold">
                  {teacherList.length} total
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 uppercase">
                      <th className="text-left px-6 py-3 text-[10px] font-bold text-gray-500">Name</th>
                      <th className="text-left px-6 py-3 text-[10px] font-bold text-gray-500">Identity</th>
                      <th className="text-left px-6 py-3 text-[10px] font-bold text-gray-500">Qualification</th>
                      <th className="text-left px-6 py-3 text-[10px] font-bold text-gray-500">Subjects</th>
                      <th className="text-right px-6 py-3 text-[10px] font-bold text-gray-500">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {teacherList.map((teacher) => {
                      const tp = teacherProfileMap.get(teacher.id)
                      const initials = (teacher.full_name ?? 'T')
                        .split(' ')
                        .filter(Boolean)
                        .map((n: string) => n[0] ?? '')
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'T'
                        
                      return (
                        <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors uppercase">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-[10px] flex-shrink-0 shadow-sm border border-emerald-50">
                                {initials}
                              </div>
                              <span className="font-bold text-slate-800 text-[11px]">
                                {teacher.full_name ?? '—'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-[10px] font-bold">
                            {teacher.email ?? '—'}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {tp?.qualification ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                                {tp.qualification}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-[10px] font-bold">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {tp?.subjects && tp.subjects.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {tp.subjects.slice(0, 2).map((s: string) => (
                                  <span key={s} className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    {s}
                                  </span>
                                ))}
                                {tp.subjects.length > 2 && (
                                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-slate-100 text-slate-500">
                                    +{tp.subjects.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300 text-[10px] font-bold">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-400 text-[10px] font-bold">
                            {new Date(teacher.created_at as string).toLocaleDateString()}
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
  } catch (err) {
    console.error('[SchoolAdminTeachers] Runtime error:', err)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center bg-gray-50">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
          <GraduationCap size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 uppercase">Faculty Access Error</h2>
        <p className="text-slate-500 max-w-xs uppercase">We encountered an error while loading the faculty list. Please try again.</p>
        <Link href="/login">
          <Button variant="outline">Back to Login</Button>
        </Link>
      </div>
    )
  }
}
