import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Upload, FileText, Clock, CheckCircle2, XCircle, Eye,
  AlertCircle, BookOpen, Globe, GraduationCap,
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:     { label: 'Pending',       color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',  icon: <Clock size={12} /> },
  processing:  { label: 'Processing',   color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',    icon: <AlertCircle size={12} /> },
  ai_reviewed: { label: 'Needs Review', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200',icon: <Eye size={12} /> },
  published:   { label: 'Published',    color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  icon: <CheckCircle2 size={12} /> },
  rejected:    { label: 'Rejected',     color: 'text-red-700',    bg: 'bg-red-50 border-red-200',      icon: <XCircle size={12} /> },
}

const DOC_TYPE_ICONS: Record<string, string> = {
  past_paper: '📝', marking_scheme: '✅', notes: '📖', textbook: '📚', syllabus: '🗂️', other: '📄',
}

type DocumentRow = {
  id: string
  title: string
  document_type: string
  zimsec_level: string | null
  year: number | null
  paper_number: number | null
  moderation_status: string
  visibility: string
  file_size: number | null
  created_at: string
  subject: { name: string; code: string } | null
}

export default async function TeacherResourcesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher') redirect(`/${profile?.role}/dashboard`)

  // My uploads
  const { data: myDocs } = await supabase
    .from('uploaded_documents')
    .select('id, title, document_type, zimsec_level, year, paper_number, moderation_status, visibility, file_size, created_at, subject:subjects(name, code)')
    .eq('uploaded_by', user.id)
    .order('created_at', { ascending: false }) as { data: DocumentRow[] | null; error: unknown }

  // Published docs for teacher's assigned subjects
  const { data: teacherProfile } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single() as { data: { id: string } | null; error: unknown }

  const { data: teacherSubjects } = await supabase
    .from('teacher_subjects')
    .select('subject_id')
    .eq('teacher_id', teacherProfile?.id ?? '') as { data: { subject_id: string }[] | null; error: unknown }

  const subjectIds = (teacherSubjects ?? []).map((ts) => ts.subject_id)

  const { data: sharedDocs } = subjectIds.length > 0
    ? await supabase
        .from('uploaded_documents')
        .select('id, title, document_type, zimsec_level, year, paper_number, moderation_status, visibility, file_size, created_at, subject:subjects(name, code)')
        .eq('moderation_status', 'published')
        .in('subject_id', subjectIds)
        .neq('uploaded_by', user.id)
        .order('created_at', { ascending: false }) as { data: DocumentRow[] | null; error: unknown }
    : { data: [] }

  const docs = myDocs ?? []
  const shared = sharedDocs ?? []

  // Stats
  const pending = docs.filter(d => d.moderation_status === 'pending').length
  const published = docs.filter(d => d.moderation_status === 'published').length
  const rejected = docs.filter(d => d.moderation_status === 'rejected').length

  function formatSize(bytes: number | null) {
    if (!bytes) return ''
    return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.round(bytes / 1024)}KB`
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">My Resources</h1>
              <p className="text-blue-200 text-sm mt-1">
                Upload and manage ZIMSEC materials for your students
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/teacher/resources/fetch-web"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition border border-white/20"
              >
                <Globe size={16} />
                Fetch from Web
              </Link>
              <Link
                href="/teacher/resources/upload"
                className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-sm"
              >
                <Upload size={16} />
                Upload
              </Link>
            </div>
          </div>

          {/* Quick stats */}
          <div className="relative grid grid-cols-3 gap-3 mt-5">
            {[
              { label: 'My uploads', value: docs.length },
              { label: 'Published',  value: published },
              { label: 'Pending',    value: pending },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-blue-200 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* My Uploads */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-gray-900">My Uploads</h2>
              <p className="text-xs text-gray-500 mt-0.5">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
            </div>
            <Link
              href="/teacher/resources/upload"
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              <Upload size={13} />
              Upload New
            </Link>
          </div>

          {/* Generate materials CTA for teachers */}
          {docs.length > 0 && (
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <GraduationCap size={15} className="text-blue-600" />
                <p className="text-xs text-blue-700 font-medium">
                  Generate AI teaching materials (lesson plans, snap notes, glossaries) for any document.
                </p>
              </div>
            </div>
          )}

          {docs.length === 0 ? (
            <div className="text-center py-14 px-6">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={24} className="text-blue-400" />
              </div>
              <p className="font-semibold text-gray-700 mb-1">No uploads yet</p>
              <p className="text-sm text-gray-400 max-w-xs mx-auto mb-5">
                Upload past papers, study notes, or textbook content. All uploads are reviewed before sharing.
              </p>
              <Link
                href="/teacher/resources/upload"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition"
              >
                <Upload size={14} />
                Upload Your First Resource
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {docs.map((doc) => {
                const status = STATUS_CONFIG[doc.moderation_status] ?? STATUS_CONFIG.pending
                return (
                  <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/80 transition">
                    <div className="text-2xl flex-shrink-0">{DOC_TYPE_ICONS[doc.document_type] ?? '📄'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm truncate">{doc.title}</p>
                        {doc.year && <span className="text-xs text-gray-400">{doc.year}</span>}
                        {doc.paper_number && <span className="text-xs text-gray-400">P{doc.paper_number}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        <span>{doc.subject?.name ?? '—'}</span>
                        {formatSize(doc.file_size) && <span>· {formatSize(doc.file_size)}</span>}
                        <span>· {new Date(doc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {doc.moderation_status === 'published' && (
                        <Link
                          href={`/teacher/resources/generate/${doc.id}`}
                          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition"
                        >
                          <GraduationCap size={11} />
                          Generate
                        </Link>
                      )}
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.bg} ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Shared / Published resources */}
        {shared.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen size={16} className="text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Published Resources for Your Subjects</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {shared.length} document{shared.length !== 1 ? 's' : ''} from other contributors
                </p>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {shared.map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/80 transition">
                  <div className="text-2xl flex-shrink-0">{DOC_TYPE_ICONS[doc.document_type] ?? '📄'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{doc.title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap mt-0.5">
                      <span>{doc.subject?.name ?? '—'}</span>
                      {doc.year && <span>· {doc.year}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/teacher/resources/generate/${doc.id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition"
                    >
                      <GraduationCap size={11} />
                      Generate
                    </Link>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-green-50 border-green-200 text-green-700">
                      <CheckCircle2 size={12} />
                      Published
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {rejected > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                {rejected} upload{rejected !== 1 ? 's were' : ' was'} rejected
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Some of your uploads did not meet content moderation standards.
                Please review the content and re-upload if appropriate.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
