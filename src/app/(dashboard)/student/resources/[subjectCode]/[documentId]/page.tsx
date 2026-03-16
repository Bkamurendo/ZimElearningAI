import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronRight } from 'lucide-react'
import DocumentViewerClient from './DocumentViewerClient'

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
  past_paper: 'Past Exam Paper',
  marking_scheme: 'Marking Scheme',
  notes: 'Study Notes',
  textbook: 'Textbook / Chapter',
  syllabus: 'ZIMSEC Syllabus',
  other: 'Resource',
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

  // Access check: must be published or owner
  const isOwner = doc.uploaded_by === user.id
  if (!isOwner && doc.moderation_status !== 'published') {
    redirect(`/student/resources/${params.subjectCode}`)
  }

  // Generate a signed URL for the PDF viewer
  const { data: signedData } = await supabase.storage
    .from('platform-documents')
    .createSignedUrl(doc.file_path, 3600) // 1 hour

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

  // Quick prompts based on doc type
  const quickPrompts = doc.document_type === 'past_paper' ? [
    'Summarise this paper',
    'What are the key topics tested?',
    'Solve Question 1 step by step',
    'What ZIMSEC mark allocation is used?',
    'What topics should I revise for this?',
  ] : doc.document_type === 'marking_scheme' ? [
    'Explain how marks are awarded',
    'What does a full-mark answer look like?',
    'What are common mistakes to avoid?',
  ] : doc.document_type === 'notes' ? [
    'Summarise the key points',
    'What are the most important concepts?',
    'Create a mind map from this',
    'What exam questions could come from this?',
  ] : doc.document_type === 'textbook' ? [
    'Summarise this chapter',
    'List the key definitions',
    'What are the worked examples?',
    'What might ZIMSEC test from this?',
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
          <Link href="/student/dashboard" className="text-gray-400 hover:text-gray-600 transition">
            Dashboard
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <Link href={`/student/subjects/${params.subjectCode}`} className="text-gray-400 hover:text-gray-600 transition">
            {doc.subject?.name ?? params.subjectCode}
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <Link href={`/student/resources/${params.subjectCode}`} className="text-gray-400 hover:text-gray-600 transition">
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
                  {doc.document_type === 'past_paper' ? '📝'
                    : doc.document_type === 'marking_scheme' ? '✅'
                    : doc.document_type === 'notes' ? '📖'
                    : doc.document_type === 'textbook' ? '📚'
                    : doc.document_type === 'syllabus' ? '🗂️' : '📄'}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-gray-900 leading-snug">{doc.title}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      {docTypeLabel}
                    </span>
                    <span className="text-xs text-gray-500">{levelLabel}</span>
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
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">✨ AI Summary</span>
                  </div>
                  <p className="text-sm text-indigo-900 leading-relaxed">{doc.ai_summary}</p>
                </div>
              )}

              {/* Topics */}
              {doc.topics && doc.topics.length > 0 && (
                <div>
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

              {/* File meta */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                <span>{doc.file_name}</span>
                {formatSize(doc.file_size) && <span>· {formatSize(doc.file_size)}</span>}
                <span>· {new Date(doc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">Document Preview</p>
                {signedUrl && (
                  <a
                    href={signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition"
                  >
                    Open in new tab ↗
                  </a>
                )}
              </div>
              {signedUrl ? (
                <iframe
                  src={signedUrl}
                  className="w-full"
                  style={{ height: '600px' }}
                  title={doc.title}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-4xl mb-3">📎</span>
                  <p className="text-sm text-gray-500 font-medium">Preview unavailable</p>
                  <p className="text-xs text-gray-400 mt-1">The document URL could not be generated</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: AI Chat */}
          <DocumentViewerClient
            documentId={doc.id}
            documentTitle={doc.title}
            documentType={doc.document_type}
            subjectCode={params.subjectCode}
            quickPrompts={quickPrompts}
          />
        </div>
      </div>
    </div>
  )
}
