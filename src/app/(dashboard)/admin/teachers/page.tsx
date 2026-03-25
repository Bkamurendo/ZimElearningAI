import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { GraduationCap, ArrowLeft } from 'lucide-react'
import { TeacherApprovalActions } from './TeacherApprovalActions'

export const metadata = { title: 'Teacher Approvals — ZimLearn Admin' }

export default async function AdminTeachersPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  const tab = searchParams.tab ?? 'pending'

  // Fetch teachers with profiles
  const { data: teachers } = await supabase
    .from('teacher_profiles')
    .select(`
      id, user_id, qualification, bio, is_approved, approval_notes, approved_at,
      profiles!teacher_profiles_user_id_fkey(full_name, email, created_at),
      teacher_subjects(subjects(name))
    `)
    .order('created_at', { referencedTable: 'profiles', ascending: false })

  const all = teachers ?? []
  const pending = all.filter(t => t.is_approved === false || t.is_approved === null)
  const approved = all.filter(t => t.is_approved === true)
  const tabData: Record<string, typeof all> = { pending, approved }
  const current = tabData[tab] ?? pending

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-4 transition">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Teacher Approvals</h1>
              <p className="text-blue-200 text-sm">Review and approve teacher registrations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1 w-fit">
          {[
            { key: 'pending', label: 'Pending', count: pending.length },
            { key: 'approved', label: 'Approved', count: approved.length },
          ].map(({ key, label, count }) => (
            <Link
              key={key}
              href={`/admin/teachers?tab=${key}`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition ${tab === key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>{count}</span>
            </Link>
          ))}
        </div>

        {current.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
            <GraduationCap size={32} className="mx-auto mb-3 opacity-30" />
            <p>No {tab} teacher applications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {current.map(teacher => {
              const prof = teacher.profiles as unknown as { full_name: string | null; email: string; created_at: string } | null
              const subjects = (teacher.teacher_subjects as unknown as { subjects: { name: string } | null }[] | null) ?? []
              return (
                <div key={teacher.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                          {prof?.full_name?.[0]?.toUpperCase() ?? 'T'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{prof?.full_name ?? 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{prof?.email}</p>
                        </div>
                        {teacher.is_approved === true && (
                          <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">Approved</span>
                        )}
                        {(teacher.is_approved === false || teacher.is_approved === null) && !teacher.approval_notes && (
                          <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">Pending Review</span>
                        )}
                      </div>
                      {teacher.qualification && (
                        <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Qualification:</span> {teacher.qualification}</p>
                      )}
                      {teacher.bio && (
                        <p className="text-sm text-gray-500 mb-2">{teacher.bio}</p>
                      )}
                      {subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {subjects.map((ts, i) => ts.subjects && (
                            <span key={i} className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{ts.subjects.name}</span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Registered {prof?.created_at ? new Date(prof.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </p>
                      {teacher.approval_notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">Notes: {teacher.approval_notes}</p>
                      )}
                    </div>
                    {tab === 'pending' && (
                      <TeacherApprovalActions teacherId={teacher.user_id} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
