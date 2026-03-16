import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FileText, Upload, CheckCircle, Clock, XCircle, AlertCircle, Plus, BookOpen, Globe } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:     { label: 'Pending',     color: 'bg-gray-100 text-gray-600',   icon: Clock },
  processing:  { label: 'Processing',  color: 'bg-blue-100 text-blue-700',   icon: Clock },
  ai_reviewed: { label: 'Needs Review',color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  published:   { label: 'Published',   color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected:    { label: 'Rejected',    color: 'bg-red-100 text-red-700',     icon: XCircle },
}

const TYPE_LABELS: Record<string, string> = {
  past_paper: 'Past Paper', notes: 'Notes', textbook: 'Textbook',
  syllabus: 'Syllabus', marking_scheme: 'Marking Scheme', other: 'Other',
}

export default async function AdminDocumentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  type DocRow = {
    id: string; title: string; document_type: string; moderation_status: string
    visibility: string; uploader_role: string; created_at: string
    subject: { name: string; code: string } | null
    ai_summary: string | null; topics: string[] | null
  }

  const { data: docs } = await supabase
    .from('uploaded_documents')
    .select('id, title, document_type, moderation_status, visibility, uploader_role, created_at, ai_summary, topics, subject:subjects(name, code)')
    .order('created_at', { ascending: false })
    .limit(100) as { data: DocRow[] | null; error: unknown }

  const allDocs = docs ?? []

  // Stats
  const counts = {
    total: allDocs.length,
    pending: allDocs.filter(d => d.moderation_status === 'pending').length,
    processing: allDocs.filter(d => d.moderation_status === 'processing').length,
    needs_review: allDocs.filter(d => d.moderation_status === 'ai_reviewed').length,
    published: allDocs.filter(d => d.moderation_status === 'published').length,
    rejected: allDocs.filter(d => d.moderation_status === 'rejected').length,
  }

  const needsReview = allDocs.filter(d => d.moderation_status === 'ai_reviewed')

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Document Library</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage and moderate uploaded ZIMSEC content</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/admin/documents/fetch-web"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
            >
              <Globe size={16} /> Fetch from Web
            </Link>
            <Link
              href="/admin/documents/upload"
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition shadow-sm"
            >
              <Plus size={16} /> Upload Document
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: counts.total, color: 'text-gray-700', bg: 'bg-gray-50', icon: FileText },
            { label: 'Pending', value: counts.pending, color: 'text-gray-600', bg: 'bg-gray-50', icon: Clock },
            { label: 'Needs Review', value: counts.needs_review, color: 'text-amber-700', bg: 'bg-amber-50', icon: AlertCircle },
            { label: 'Published', value: counts.published, color: 'text-green-700', bg: 'bg-green-50', icon: CheckCircle },
            { label: 'Rejected', value: counts.rejected, color: 'text-red-700', bg: 'bg-red-50', icon: XCircle },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-2`}>
                <Icon size={18} className={color} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Moderation Queue */}
        {needsReview.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={18} className="text-amber-600" />
              <h2 className="text-sm font-semibold text-amber-800">
                Moderation Queue ({needsReview.length} document{needsReview.length !== 1 ? 's' : ''} awaiting review)
              </h2>
            </div>
            <div className="space-y-2">
              {needsReview.map((doc) => (
                <div key={doc.id} className="bg-white rounded-xl border border-amber-100 p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{doc.title}</p>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        {TYPE_LABELS[doc.document_type] ?? doc.document_type}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">{doc.uploader_role}</span>
                    </div>
                    {doc.subject && (
                      <p className="text-xs text-gray-500 mt-0.5">{doc.subject.name}</p>
                    )}
                    {doc.ai_summary && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{doc.ai_summary}</p>
                    )}
                    {doc.topics && doc.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {doc.topics.slice(0, 4).map((t) => (
                          <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <ModerationActions docId={doc.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Documents */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">All Documents</h2>
            <span className="text-xs text-gray-400">{allDocs.length} total</span>
          </div>

          {allDocs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Upload size={24} className="text-gray-400" />
              </div>
              <p className="font-semibold text-gray-600 text-sm">No documents yet</p>
              <p className="text-xs text-gray-400 mt-1">Upload ZIMSEC past papers, notes, or textbooks</p>
              <Link
                href="/admin/documents/upload"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl transition hover:bg-gray-800"
              >
                <Plus size={15} /> Upload First Document
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {allDocs.map((doc) => {
                const status = STATUS_CONFIG[doc.moderation_status] ?? STATUS_CONFIG.pending
                const StatusIcon = status.icon
                return (
                  <div key={doc.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      {doc.document_type === 'past_paper' ? (
                        <FileText size={18} className="text-indigo-500" />
                      ) : doc.document_type === 'textbook' ? (
                        <BookOpen size={18} className="text-green-500" />
                      ) : (
                        <FileText size={18} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm truncate">{doc.title}</p>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                          <StatusIcon size={11} />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {TYPE_LABELS[doc.document_type]} · {doc.uploader_role}
                        {doc.subject ? ` · ${doc.subject.name}` : ''}
                        {' · '}{new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {doc.moderation_status === 'ai_reviewed' && (
                      <ModerationActions docId={doc.id} compact />
                    )}
                    {doc.moderation_status === 'published' && (
                      <span className="text-xs text-green-600 font-medium flex-shrink-0">Live</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Server-compatible moderation action buttons (links to separate action pages)
function ModerationActions({ docId, compact = false }: { docId: string; compact?: boolean }) {
  return (
    <div className={`flex gap-2 ${compact ? '' : 'flex-col sm:flex-row'}`}>
      <Link
        href={`/admin/documents/${docId}/approve`}
        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition"
      >
        Approve
      </Link>
      <Link
        href={`/admin/documents/${docId}/reject`}
        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition"
      >
        Reject
      </Link>
    </div>
  )
}
