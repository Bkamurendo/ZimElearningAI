import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronRight } from 'lucide-react'
import StudyPanel from './StudyPanel'
import BookmarkToggle from '@/app/(dashboard)/student/bookmarks/BookmarkToggle'
import ReprocessButton from './ReprocessButton'

// Helper: resolve the real subject code. When the user arrives via a bookmark or search
// link that used the "unknown" fallback, we substitute the subject code from the document
// record itself so that breadcrumb links and back-navigation work correctly.
function resolveSubjectCode(paramCode: string, docSubjectCode: string | null | undefined): string {
  if (paramCode && paramCode !== 'unknown') return paramCode
  return docSubjectCode ?? paramCode
}

type DocumentData = {
  id: string
  title: string
  description: string | null
  document_type: string
  zimsec_level: string | null
  year: number | null
  paper_number: number | null
  ai_summary: string | null
  extracted_text: string | null
  topics: string[] | null
  moderation_notes: string | null
  moderation_status: string
  visibility: string
  uploaded_by: string
  uploader_role: string
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

export default async function StudentDocumentDetailPage({
  params,
}: {
  params: { subjectCode: string; documentId: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: doc } = await supabase
    .from('uploaded_documents')
    .select('*, subject:subjects(id, name, code, zimsec_level)')
    .eq('id', params.documentId)
    .single() as { data: DocumentData | null; error: unknown }

  if (!doc) redirect(`/student/resources/${params.subjectCode}`)

  const isOwner = doc.uploaded_by === user.id
  if (!isOwner && doc.moderation_status !== 'published') {
    redirect(`/student/resources/${params.subjectCode}`)
  }

  // Resolve the correct subject code (fixes "unknown" from bookmark/search links)
  const subjectCode = resolveSubjectCode(params.subjectCode, doc.subject?.code)

  // Check bookmark status
  const { data: bookmarkData } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('document_id', doc.id)
    .maybeSingle()
  const isBookmarked = !!bookmarkData

  // Load any already-cached study content so the panel renders instantly
  const { data: cachedRows } = await supabase
    .from('document_study_content')
    .select('content_type, content')
    .eq('document_id', doc.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const preloaded: Record<string, any> = {}
  for (const row of cachedRows ?? []) {
    const jsonTypes = ['snap_notes', 'model_answers', 'glossary', 'practice_questions']
    if (jsonTypes.includes(row.content_type)) {
      try { preloaded[row.content_type] = JSON.parse(row.content) } catch { /* skip malformed */ }
    } else {
      preloaded[row.content_type] = row.content
    }
  }

  // Signed URL for PDF viewer (1 hour)
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

  const quickPrompts = doc.document_type === 'past_paper' ? [
    'Solve Question 1 step by step',
    'What are the key topics tested in this paper?',
    'What does a full-mark answer look like?',
    'Identify the hardest question and explain how to approach it',
    'What ZIMSEC marking criteria apply here?',
  ] : doc.document_type === 'marking_scheme' ? [
    'Explain how marks are allocated in this scheme',
    'What common mistakes cause students to lose marks?',
    'Show me what a perfect answer looks like for Q1',
  ] : doc.document_type === 'notes' ? [
    'Summarise the key points from this document',
    'What are the most important concepts to know?',
    'Create 5 exam questions from this content',
    'What might ZIMSEC test from this topic?',
  ] : doc.document_type === 'textbook' ? [
    'Summarise this chapter',
    'List all key definitions',
    'What worked examples are included?',
    'What exam questions could come from this chapter?',
  ] : [
    'Summarise this document',
    'What are the key points?',
    'How does this relate to the ZIMSEC curriculum?',
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Link href="/student/dashboard" className="text-gray-400 hover:text-gray-600 transition">Dashboard</Link>
          <ChevronRight size={14} className="text-gray-300" />
          <Link href={`/student/subjects/${subjectCode}`} className="text-gray-400 hover:text-gray-600 transition">
            {doc.subject?.name ?? subjectCode}
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <Link href={`/student/resources/${subjectCode}`} className="text-gray-400 hover:text-gray-600 transition">
            Resources
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="font-semibold text-gray-900 truncate max-w-[200px]">{doc.title}</span>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* LEFT: Document metadata + PDF viewer */}
          <div className="space-y-4">

            {/* Meta card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {doc.document_type === 'past_paper'     ? '📝'
                    : doc.document_type === 'marking_scheme' ? '✅'
                    : doc.document_type === 'notes'          ? '📖'
                    : doc.document_type === 'textbook'       ? '📚'
                    : doc.document_type === 'syllabus'       ? '🗂️' : '📄'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h1 className="text-lg font-bold text-gray-900 leading-snug">{doc.title}</h1>
                    <BookmarkToggle documentId={doc.id} isBookmarked={isBookmarked} />
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
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
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 mb-4">
                  <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">✨ AI Summary</p>
                  <p className="text-sm text-indigo-900 leading-relaxed">{doc.ai_summary}</p>
                </div>
              )}

              {/* Topics */}
              {doc.topics && doc.topics.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Key Topics</p>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.topics.map((topic) => (
                      <span key={topic} className="text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Re-process button — shown when text hasn't been extracted yet */}
              {(!doc.extracted_text || doc.extracted_text.trim().length === 0) && isOwner && (
                <ReprocessButton documentId={doc.id} />
              )}

              {/* Study tools hint */}
              <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-start gap-3">
                <span className="text-lg flex-shrink-0">🎓</span>
                <div>
                  <p className="text-xs font-semibold text-green-800">AI Study Tools available →</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Use the panel on the right to generate Snap Notes, detailed Study Notes,
                    {(doc.document_type === 'past_paper' || doc.document_type === 'marking_scheme') && ' Model Answers with full working,'}
                    {' '}a Glossary and Practice Questions — all powered by Claude AI.
                  </p>
                </div>
              </div>

              {/* File meta */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 flex-wrap">
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
                  <a href={signedUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition">
                    Open full screen ↗
                  </a>
                )}
              </div>
              {signedUrl ? (
                <iframe src={signedUrl} className="w-full" style={{ height: '640px' }} title={doc.title} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-4xl mb-3">📎</span>
                  <p className="text-sm text-gray-500 font-medium">Preview unavailable</p>
                  <p className="text-xs text-gray-400 mt-1">The signed URL could not be generated</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Study Panel (AI Chat + all study tools) */}
          <StudyPanel
            documentId={doc.id}
            documentTitle={doc.title}
            documentType={doc.document_type}
            subjectCode={subjectCode}
            quickPrompts={quickPrompts}
            preloaded={preloaded}
          />
        </div>
      </div>
    </div>
  )
}
