export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { MessageSquare, ChevronRight, User } from 'lucide-react'

type TeacherInfo = {
  teacherId: string
  teacherName: string
  teacherEmail: string
  childName: string
  subjectNames: string[]
  unreadCount: number
  lastMessage: { content: string; created_at: string } | null
}

export default async function ParentMessagesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'parent') redirect(`/${profile?.role}/dashboard`)

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Fetch parent's children
  const { data: childProfiles } = await serviceClient
    .from('student_profiles')
    .select('id, user_id')
    .eq('parent_id', user.id) as { data: { id: string; user_id: string }[] | null; error: unknown }

  const teachers: TeacherInfo[] = []

  for (const child of childProfiles ?? []) {
    // Get child's name
    const { data: childProfile } = await serviceClient
      .from('profiles').select('full_name').eq('id', child.user_id).single() as { data: { full_name: string } | null; error: unknown }

    // Get subjects child is enrolled in
    type EnrolRow = { subject_id: string; subject: { name: string } | null }
    const { data: enrolments } = await supabase
      .from('student_subjects')
      .select('subject_id, subject:subjects(name)')
      .eq('student_id', child.id) as { data: EnrolRow[] | null; error: unknown }

    const subjectIds = (enrolments ?? []).map(e => e.subject_id)

    if (subjectIds.length === 0) continue

    // Get teachers for those subjects
    type TeacherSubjectRow = {
      teacher_id: string
      subject_id: string
      subject: { name: string } | null
    }
    const { data: teacherSubjects } = await supabase
      .from('teacher_subjects')
      .select('teacher_id, subject_id, subject:subjects(name)')
      .in('subject_id', subjectIds) as { data: TeacherSubjectRow[] | null; error: unknown }

    // Group by teacher_id
    const teacherMap = new Map<string, { subjectNames: string[] }>()
    for (const ts of teacherSubjects ?? []) {
      const existing = teacherMap.get(ts.teacher_id)
      const name = ts.subject?.name ?? 'Unknown'
      if (existing) {
        if (!existing.subjectNames.includes(name)) existing.subjectNames.push(name)
      } else {
        teacherMap.set(ts.teacher_id, { subjectNames: [name] })
      }
    }

    for (const [teacherId, info] of Array.from(teacherMap.entries())) {
      // Skip if already added this teacher
      if (teachers.some(t => t.teacherId === teacherId)) continue

      // Get teacher profile
      const { data: teacherProfile } = await serviceClient
        .from('profiles').select('full_name, email').eq('id', teacherId).single() as { data: { full_name: string; email: string } | null; error: unknown }

      // Count unread messages from this teacher
      const { count: unread } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', teacherId)
        .eq('recipient_id', user.id)
        .eq('read', false)

      // Get last message in thread
      type MsgRow = { content: string; created_at: string }
      const { data: lastMsgs } = await supabase
        .from('messages')
        .select('content, created_at')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${teacherId}),and(sender_id.eq.${teacherId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .limit(1) as { data: MsgRow[] | null; error: unknown }

      teachers.push({
        teacherId,
        teacherName: teacherProfile?.full_name ?? 'Teacher',
        teacherEmail: teacherProfile?.email ?? '',
        childName: childProfile?.full_name ?? 'Your child',
        subjectNames: info.subjectNames,
        unreadCount: unread ?? 0,
        lastMessage: lastMsgs?.[0] ?? null,
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0">
              <MessageSquare size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Messages</h1>
              <p className="text-purple-200 text-sm mt-0.5">
                Communicate with your children&apos;s teachers
              </p>
            </div>
          </div>
        </div>

        {/* Conversations list */}
        {teachers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-14 text-center shadow-sm">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={28} className="text-purple-400" />
            </div>
            <p className="font-semibold text-gray-700 text-lg">No conversations yet</p>
            <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
              Once your children are enrolled in subjects with teachers, you can message those teachers here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
            {teachers.map((t) => (
              <Link
                key={t.teacherId}
                href={`/parent/messages/${t.teacherId}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
              >
                {/* Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={20} className="text-purple-600" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900 truncate">{t.teacherName}</p>
                    {t.lastMessage && (
                      <p className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(t.lastMessage.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short',
                        })}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-purple-600 font-medium mt-0.5">
                    {t.subjectNames.slice(0, 3).join(', ')}
                    {t.subjectNames.length > 3 ? ` +${t.subjectNames.length - 3} more` : ''}
                  </p>
                  {t.lastMessage ? (
                    <p className="text-sm text-gray-500 truncate mt-0.5">{t.lastMessage.content}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic mt-0.5">No messages yet — start a conversation</p>
                  )}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {t.unreadCount > 0 && (
                    <span className="min-w-[22px] h-[22px] bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                      {t.unreadCount > 99 ? '99+' : t.unreadCount}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-purple-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
