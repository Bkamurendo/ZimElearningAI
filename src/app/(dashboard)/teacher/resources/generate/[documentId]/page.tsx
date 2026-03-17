import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronRight, GraduationCap } from 'lucide-react'
import TeacherMaterialsClient from './TeacherMaterialsClient'

type DocumentData = {
  id: string
  title: string
  description: string | null
  document_type: string
  zimsec_level: string | null
  year: number | null
  paper_number: number | null
  ai_summary: string | null
  topics: string[] | null
  moderation_status: string
  uploaded_by: string
  file_path: string
  file_name: string
  file_size: number | null
  created_at: string
  subject: {
    id: string
    name: string
    code: string
    zimsec_level: string
  } | null
}

const DOC_TYPE_LABELS: Record<string, string> = {
  past_paper:     'Past Exam Paper',
  marking_scheme: 'Marking Scheme',
  notes:          'Study Notes',
  textbook:       'Textbook / Chapter',
  syllabus:       'ZIMSEC Syllabus',
  other:          'Resource',
}

const DOC_TYPE_ICONS: Record<string, string> = {
  past_paper: '📝', marking_scheme: '✅', notes: '📖',
  textbook: '📚', syllabus: '🗂️', other: '📄',
}

export default async function TeacherGeneratePage({
  params,
}: {
  params: { documentId: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify teacher role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher') redirect(`/${profile?.role}/dashboard`)

  // Fetch document — teacher can access if they uploaded it or it's published
  const { data: doc } = await supabase
    .from('uploaded_documents')
    .select('*, subject:subjects(id, name, code, zimsec_level)')
    .eq('id', params.documentId)
    .or(`uploaded_by.eq.${user.id},moderation_status.eq.published`)
    .single() as { data: DocumentData | null; error: unknown }

  if (!doc) redirect('/teacher/resources')

  // Load cached study content
  const { data: cachedRows } = await supabase
    .from('document_study_content')
    .select('content_type, content')
    .eq('document_id', doc.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const preloaded: Record<string, any> = {}
  for (const row of cachedRows ?? []) {
    const jsonTypes = ['snap_notes', 'glossary', 'practice_questions']
    if (jsonTypes.includes(row.content_type)) {
      try { preloaded[row.content_type] = JSON.parse(row.content) } catch { /* skip */ }
    } else {
      preloaded[row.content_type] = row.content
    }
  }

  // Signed URL for PDF preview
  const { data: signedData } = await supabase.storage
    .from('platform-documents')
    .createSignedUrl(doc.file_path, 3600)
  const signedUrl = signedData?.signedUrl ?? null

  const levelLabel = doc.zimsec_level === 'primary' ? 'Primary'
    : doc.zimsec_level === 'olevel' ? 'O-Level' : 'A-Level'

  function formatSize(bytes: number | null) {
    if (!bytes) return null
    return bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${Math.round(bytes / 1024)} KB`
  }

  const docTypeLabel = DOC_TYPE_LABELS[doc.document_type] ?? 'Resource'
  const docTypeIcon  = DOC_TYPE_ICONS[doc.document_type] ?? '📄'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Link href="/teacher/dashboard" className="text-gray-400 hover:text-gray-600 transition">Dashboard</Link>
          <ChevronRight size={14} className="text-gray-300" />
          <Link href="/teacher/resources" className="text-gray-400 hover:text-gray-600 transition">My Resources</Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="font-semibold text-gray-900 truncate max-w-[200px]">Generate Materials</span>
        </div>

        {/* Page header */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-2xl p-5 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0">
              <GraduationCap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Generate Teaching Materials</h1>
              <p className="text-blue-200 text-sm mt-0.5">
                AI-powered lesson content — teaching guide, snap notes, glossary &amp; practice questions
              </p>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* LEFT: Document metadata + PDF preview */}
          <div className="space-y-4">

            {/* Meta card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {docTypeIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 leading-snug">{doc.title}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {docTypeLabel}
                    </span>
                    {doc.zimsec_level && <span className="text-xs text-gray-500">{levelLabel}</span>}
                    {doc.year && <span className="text-xs text-gray-500">· {doc.year}</span>}
                    {doc.paper_number && <span className="text-xs text-gray-500">· Paper {doc.paper_number}</span>}
                  </div>
                </div>
              </div>

              {doc.description && (
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{doc.description}</p>
              )}

              {/* AI Summary */}
              {doc.ai_summary && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mb-4">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">✨ AI Summary</p>
                  <p className="text-sm text-blue-900 leading-relaxed">{doc.ai_summary}</p>
                </div>
              )}

              {/* Topics */}
              {doc.topics && doc.topics.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Key Topics</p>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.topics.map((topic) => (
                      <span key={topic} className="text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* What gets generated */}
              <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-start gap-3 mb-4">
                <span className="text-lg flex-shrink-0">🎓</span>
                <div>
                  <p className="text-xs font-semibold text-green-800">4 material types available →</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Teaching Guide (lesson plan + activities), Snap Notes (classroom display),
                    Glossary (student handout), and Practice Questions (classwork/homework).
                    All cached — generate once, access forever.
                  </p>
                </div>
              </div>

              {/* File meta */}
              <div className="flex items-center gap-4 pt-3 border-t border-gray-100 text-xs text-gray-400 flex-wrap">
                <span>{doc.file_name}</span>
                {formatSize(doc.file_size) && <span>· {formatSize(doc.file_size)}</span>}
                <span>· {new Date(doc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">📄 Document Preview</p>
                {signedUrl && (
                  <a
                    href={signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition"
                  >
                    Open full screen ↗
                  </a>
                )}
              </div>
              {signedUrl ? (
                <iframe
                  src={signedUrl}
                  className="w-full"
                  style={{ height: '580px' }}
                  title={doc.title}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <span className="text-4xl mb-3">📎</span>
                  <p className="text-sm text-gray-500 font-medium">Preview unavailable</p>
                  <p className="text-xs text-gray-400 mt-1">The signed URL could not be generated</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Teacher Materials Generator */}
          <TeacherMaterialsClient
            documentId={doc.id}
            documentTitle={doc.title}
            documentType={doc.document_type}
            preloaded={preloaded}
          />
        </div>
      </div>
    </div>
  )
}
