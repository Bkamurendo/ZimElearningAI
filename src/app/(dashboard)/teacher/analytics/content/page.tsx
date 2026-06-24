export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FileText, BookOpen, Users, TrendingUp, Clock, CheckCircle2, AlertTriangle, ChevronLeft, BarChart3, BookMarked } from 'lucide-react'
import Link from 'next/link'

function ScoreRing({ pct, size = 40 }: { pct: number; size?: number }) {
  const r = 14
  const circ = 2 * Math.PI * r
  const stroke = (pct / 100) * circ
  const color = pct >= 70 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#ef4444'
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" className="flex-shrink-0">
      <circle cx="18" cy="18" r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
      <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${stroke} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 18 18)" />
      <text x="18" y="22" textAnchor="middle" fontSize="8" fontWeight="700" fill={color}>{pct}%</text>
    </svg>
  )
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Pending',    cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  processing: { label: 'Processing', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  ai_reviewed:{ label: 'Reviewed',  cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  published:  { label: 'Published', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected:   { label: 'Rejected',  cls: 'bg-red-50 text-red-700 border-red-200' },
}

export default async function ContentAnalyticsPage() {
  const supabase = createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role?.toLowerCase() !== 'teacher') redirect('/teacher/dashboard')

  const { data: teacher } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const teacherId = teacher?.id ?? ''

  // Parallel data fetching
  const [
    { data: myDocs },
    { data: myCourses },
    { data: teacherSubjectsRaw },
  ] = await Promise.all([
    // Teacher's uploaded documents
    supabase
      .from('uploaded_documents')
      .select('id, title, document_type, subject_id, moderation_status, topics, created_at, subjects(name)')
      .eq('uploaded_by', user.id)
      .order('created_at', { ascending: false })
      .limit(50),

    // Teacher's courses with lesson counts
    supabase
      .from('courses')
      .select('id, title, subject_id, published, subjects(name), lessons(id)')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false }),

    // Teacher's subjects
    supabase
      .from('teacher_subjects')
      .select('subject:subjects(id, name)')
      .eq('teacher_id', teacherId),
  ])

  const subjectIds = (teacherSubjectsRaw ?? [])
    .map((ts: any) => ts.subject?.id)
    .filter(Boolean) as string[]

  // Get students enrolled in teacher's subjects
  const { data: enrolments } = await supabase
    .from('student_subjects')
    .select('student_id, subject_id')
    .in('subject_id', subjectIds.length > 0 ? subjectIds : ['none'])

  const studentIds = Array.from(new Set((enrolments ?? []).map((e: any) => e.student_id)))

  // Get lesson IDs for teacher's courses
  const courseIds = (myCourses ?? []).map((c: any) => c.id)
  const allLessonIds = (myCourses ?? []).flatMap((c: any) => (c.lessons ?? []).map((l: any) => l.id))

  // Lesson progress for teacher's lessons
  const { data: lessonProgress } = allLessonIds.length > 0
    ? await supabase
        .from('lesson_progress')
        .select('student_id, lesson_id')
        .in('lesson_id', allLessonIds)
    : { data: [] }

  // Quiz attempts for students on teacher's subjects (to match topics from docs)
  const { data: quizAttempts } = studentIds.length > 0
    ? await supabase
        .from('quiz_attempts')
        .select('student_id, subject_id, topic, score, total, created_at')
        .in('student_id', studentIds)
        .in('subject_id', subjectIds.length > 0 ? subjectIds : ['none'])
        .order('created_at', { ascending: false })
        .limit(500)
    : { data: [] }

  // --- Compute stats ---
  const docs = (myDocs ?? []) as any[]
  const courses = (myCourses ?? []) as any[]

  const publishedDocs = docs.filter(d => d.moderation_status === 'published')
  const pendingDocs   = docs.filter(d => ['pending', 'processing', 'ai_reviewed'].includes(d.moderation_status))
  const rejectedDocs  = docs.filter(d => d.moderation_status === 'rejected')

  // All topics from published docs (deduplicated)
  const allTopics: string[] = Array.from(new Set(
    publishedDocs.flatMap(d => (d.topics as string[] | null) ?? [])
  ))

  // For each topic, find matching quiz attempts (case-insensitive substring match)
  const topicStats = allTopics.slice(0, 20).map(topic => {
    const lower = topic.toLowerCase()
    const matching = (quizAttempts ?? []).filter((q: any) =>
      q.topic?.toLowerCase().includes(lower) || lower.includes(q.topic?.toLowerCase() ?? '')
    )
    const avg = matching.length > 0
      ? Math.round(matching.reduce((s: number, q: any) => s + (q.score / q.total * 100), 0) / matching.length)
      : null
    return { topic, attempts: matching.length, avg }
  }).filter(t => t.attempts > 0).sort((a, b) => (a.avg ?? 100) - (b.avg ?? 100))

  // Lesson completion per course
  const courseStats = courses.map((c: any) => {
    const lessonIds = (c.lessons ?? []).map((l: any) => l.id)
    const completions = (lessonProgress ?? []).filter((lp: any) => lessonIds.includes(lp.lesson_id))
    const uniqueStudents = new Set(completions.map((lp: any) => lp.student_id)).size
    const totalLessons = lessonIds.length
    return { ...c, lessonCount: totalLessons, uniqueStudents }
  })

  const totalLessonCompletions = new Set((lessonProgress ?? []).map((lp: any) => lp.student_id)).size

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div>
          <Link href="/teacher/analytics" className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm mb-3 transition">
            <ChevronLeft size={14} /> Student Analytics
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 uppercase">My Content Analytics</h1>
          <p className="text-sm text-gray-500 mt-1 uppercase">How students interact with your documents, courses &amp; lessons</p>
        </div>

        {/* Summary stat tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Documents',  value: docs.length,           icon: FileText,    color: 'text-blue-600',    bg: 'bg-blue-50' },
            { label: 'Published',  value: publishedDocs.length,  icon: CheckCircle2,color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Courses',    value: courses.length,         icon: BookOpen,    color: 'text-violet-600',  bg: 'bg-violet-50' },
            { label: 'Learners reached', value: totalLessonCompletions, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-2`}>
                <Icon size={17} className={color} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium uppercase">{label}</p>
            </div>
          ))}
        </div>

        {/* My Documents */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
                <FileText size={13} className="text-white" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 uppercase">Uploaded Documents</h2>
            </div>
            <div className="flex gap-2 text-xs">
              {pendingDocs.length > 0 && (
                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                  {pendingDocs.length} pending
                </span>
              )}
              {rejectedDocs.length > 0 && (
                <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                  {rejectedDocs.length} rejected
                </span>
              )}
            </div>
          </div>

          {docs.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500 uppercase">No documents uploaded yet</p>
              <Link href="/teacher/resources/upload" className="inline-block mt-3 text-xs font-semibold text-blue-600 hover:underline uppercase">
                Upload your first document →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {docs.slice(0, 15).map((doc: any) => {
                const badge = STATUS_BADGE[doc.moderation_status] ?? { label: doc.moderation_status, cls: 'bg-gray-50 text-gray-600 border-gray-200' }
                const topicCount = (doc.topics as string[] | null)?.length ?? 0
                return (
                  <div key={doc.id} className="flex items-start gap-3 px-5 py-3.5">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText size={14} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate uppercase">{doc.title}</p>
                      <p className="text-xs text-gray-400 uppercase mt-0.5">
                        {(doc.subjects as any)?.name ?? 'No subject'} · {doc.document_type}
                        {topicCount > 0 && ` · ${topicCount} topic${topicCount !== 1 ? 's' : ''} identified`}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badge.cls} whitespace-nowrap flex-shrink-0`}>
                      {badge.label}
                    </span>
                  </div>
                )
              })}
              {docs.length > 15 && (
                <div className="px-5 py-3 text-xs text-gray-400 text-center uppercase">
                  + {docs.length - 15} more documents
                </div>
              )}
            </div>
          )}
        </div>

        {/* Topic engagement */}
        {topicStats.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
              <div className="w-7 h-7 bg-violet-500 rounded-lg flex items-center justify-center">
                <TrendingUp size={13} className="text-white" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 uppercase">Student Quiz Performance — Your Topics</h2>
            </div>
            <div className="px-5 py-3 text-xs text-gray-400 uppercase border-b border-gray-50">
              Topics extracted from your published documents, sorted by student score (lowest first)
            </div>
            <div className="divide-y divide-gray-50">
              {topicStats.slice(0, 12).map(({ topic, attempts, avg }) => (
                <div key={topic} className="flex items-center gap-3 px-5 py-3">
                  {avg !== null && <ScoreRing pct={avg} size={36} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 uppercase truncate">{topic}</p>
                    <p className="text-xs text-gray-400 uppercase">{attempts} quiz attempt{attempts !== 1 ? 's' : ''}</p>
                  </div>
                  {avg !== null && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      avg >= 70 ? 'bg-emerald-50 text-emerald-700' :
                      avg >= 50 ? 'bg-blue-50 text-blue-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {avg >= 70 ? 'Strong' : avg >= 50 ? 'Fair' : 'Weak'}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {topicStats.filter(t => t.avg !== null && t.avg < 60).length > 0 && (
              <div className="px-5 py-3 bg-amber-50/50 border-t border-amber-100 flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  <span className="font-bold">{topicStats.filter(t => t.avg !== null && t.avg < 60).length} topic{topicStats.filter(t => t.avg !== null && t.avg < 60).length !== 1 ? 's' : ''}</span> from your content need reinforcement — students are scoring below 60%.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Courses & lesson engagement */}
        {courseStats.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
              <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                <BookOpen size={13} className="text-white" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 uppercase">Courses &amp; Lesson Engagement</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {courseStats.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookMarked size={14} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate uppercase">{c.title}</p>
                    <p className="text-xs text-gray-400 uppercase mt-0.5">
                      {(c.subjects as any)?.name} · {c.lessonCount} lesson{c.lessonCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-800">{c.uniqueStudents}</p>
                    <p className="text-xs text-gray-400 uppercase">learners</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {c.published ? (
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">Live</span>
                    ) : (
                      <span className="text-xs bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full font-semibold">Draft</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for courses */}
        {courseStats.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-12">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <BookOpen size={24} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-600 uppercase">No courses yet</p>
            <p className="text-sm text-gray-400 mt-1 uppercase">Create your first course to track lesson engagement</p>
            <Link href="/teacher/courses/new" className="inline-block mt-3 text-xs font-semibold text-emerald-600 hover:underline uppercase">
              Create a course →
            </Link>
          </div>
        )}

        {/* Pending documents alert */}
        {pendingDocs.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Clock size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 uppercase">
                {pendingDocs.length} document{pendingDocs.length !== 1 ? 's' : ''} awaiting review
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                These won't appear in student search or MaFundi's knowledge base until an admin publishes them.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
