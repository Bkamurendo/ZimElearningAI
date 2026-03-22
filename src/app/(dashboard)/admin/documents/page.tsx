import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  FileText, Upload, CheckCircle, Clock, XCircle, AlertCircle,
  Plus, BookOpen, Globe, Zap, Pencil, AlertTriangle,
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:     { label: 'Pending',      color: 'bg-gray-100 text-gray-600',   icon: Clock },
  processing:  { label: 'Processing',  color: 'bg-blue-100 text-blue-700',   icon: Clock },
  ai_reviewed: { label: 'Needs Review',color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  published:   { label: 'Published',   color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected:    { label: 'Rejected',    color: 'bg-red-100 text-red-700',     icon: XCircle },
}

const TYPE_LABELS: Record<string, string> = {
  past_paper: 'Past Paper', notes: 'Notes', textbook: 'Textbook',
  syllabus: 'Syllabus', marking_scheme: 'Marking Scheme', other: 'Other',
}

const LEVEL_LABELS: Record<string, string> = {
  primary: 'Primary', olevel: 'O-Level', alevel: 'A-Level',
}

type DocRow = {
  id: string
  title: string
  document_type: string
  zimsec_level: string | null
  moderation_status: string
  visibility: string
  uploader_role: string
  created_at: string
  subject: { name: string; code: string; zimsec_level: string } | null
  ai_summary: string | null
  topics: string[] | null
}

export default async function AdminDocumentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  const { data: docs } = await supabase
    .from('uploaded_documents')
    .select('id, title, document_type, zimsec_level, moderation_status, visibility, uploader_role, created_at, ai_summary, topics, subject:subjects(name, code, zimsec_level)')
    .order('created_at', { ascending: false })
    .limit(200) as { data: DocRow[] | null; error: unknown }

  const allDocs = docs ?? []

  // Detect mislabeled: doc's zimsec_level doesn't match its subject's zimsec_level
  function isMislabeled(doc: DocRow): boolean {
    if (!doc.subject || !doc.zimsec_level) return false
    return doc.zimsec_level !== doc.subject.zimsec_level
  }

  // Stats
  const counts = {
    total:        allDocs.length,
    pending:      allDocs.filter(d => d.moderation_status === 'pending').length,
    processing:   allDocs.filter(d => d.moderation_status === 'processing').length,
    needs_review: allDocs.filter(d => d.moderation_status === 'ai_reviewed').length,
    published:    allDocs.filter(d => d.moderation_status === 'published').length,
    rejected:     allDocs.filter(d => d.moderation_status === 'rejected').length,
    mislabeled:   allDocs.filter(isMislabeled).length,
  }

  const needsReview = allDocs.filter(d => d.moderation_status === 'ai_reviewed')
  const mislabeled  = allDocs.filter(isMislabeled)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Document Library</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage and moderate uploaded ZIMSEC content</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <Link href="/admin/documents/enrich"
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
              <Zap size={16} /> Bulk Enrich
            </Link>
            <Link href="/admin/documents/fetch-web"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
              <Globe size={16} /> Fetch from Web
            </Link>
            <Link href="/admin/documents/upload"
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition shadow-sm">
              <Plus size={16} /> Upload Document
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {[
            { label: 'Total',        value: counts.total,        color: 'text-gray-700',   bg: 'bg-gray-50',   icon: FileText      },
            { label: 'Pending',      value: counts.pending,      color: 'text-gray-600',   bg: 'bg-gray-50',   icon: Clock         },
            { label: 'Needs Review', value: counts.needs_review, color: 'text-amber-700',  bg: 'bg-amber-50',  icon: AlertCircle   },
            { label: 'Published',    value: counts.published,    color: 'text-green-700',  bg: 'bg-green-50',  icon: CheckCircle   },
            { label: 'Rejected',     value: counts.rejected,     color: 'text-red-700',    bg: 'bg-red-50',    icon: XCircle       },
            { label: 'Mislabeled',   value: counts.mislabeled,   color: 'text-orange-700', bg: 'bg-orange-50', icon: AlertTriangle },
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

        {/* ── Mislabeled Documents Panel ── */}
        {mislabeled.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={18} className="text-orange-600" />
              <h2 className="text-sm font-bold text-orange-800">
                Mislabeled Documents — {mislabeled.length} need fixing
              </h2>
            </div>
            <p className="text-xs text-orange-700 mb-4 ml-6">
              These documents are tagged with a level that does not match their assigned subject.
              For example, a document tagged as &quot;O-Level&quot; but assigned to a Primary subject, or
              an English document appearing in a Ndebele subject folder.
              Click &quot;Fix&quot; on each row to correct them.
            </p>
            <div className="space-y-2">
              {mislabeled.map(doc => (
                <div key={doc.id}
                  className="bg-white rounded-xl border border-orange-100 p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                      <span className="text-gray-500">
                        Tagged: <strong className="text-orange-700">{LEVEL_LABELS[doc.zimsec_level ?? ''] ?? doc.zimsec_level ?? '—'}</strong>
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-500">
                        Subject: <strong className="text-gray-800">{doc.subject?.name ?? '—'}</strong>
                        {' '}(<span className="text-blue-600">{LEVEL_LABELS[doc.subject?.zimsec_level ?? ''] ?? doc.subject?.zimsec_level}</span>)
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-400">{TYPE_LABELS[doc.document_type]}</span>
                    </div>
                  </div>
                  <Link
                    href={`/admin/documents/${doc.id}/edit`}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition"
                  >
                    <Pencil size={11} /> Fix
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Moderation Queue ── */}
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
                <div key={doc.id}
                  className="bg-white rounded-xl border border-amber-100 p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{doc.title}</p>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        {TYPE_LABELS[doc.document_type] ?? doc.document_type}
                      </span>
                      {doc.zimsec_level && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                          {LEVEL_LABELS[doc.zimsec_level] ?? doc.zimsec_level}
                        </span>
                      )}
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
                  <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                    <Link href={`/admin/documents/${doc.id}/approve`}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition text-center">
                      Approve
                    </Link>
                    <Link href={`/admin/documents/${doc.id}/reject`}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition text-center">
                      Reject
                    </Link>
                    <Link href={`/admin/documents/${doc.id}/edit`}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition text-center flex items-center gap-1">
                      <Pencil size={10} /> Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── All Documents ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">All Documents</h2>
            <span className="text-xs text-gray-400">{allDocs.length} total (showing up to 200)</span>
          </div>

          {allDocs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Upload size={24} className="text-gray-400" />
              </div>
              <p className="font-semibold text-gray-600 text-sm">No documents yet</p>
              <p className="text-xs text-gray-400 mt-1">Upload ZIMSEC past papers, notes, or textbooks</p>
              <Link href="/admin/documents/upload"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl transition hover:bg-gray-800">
                <Plus size={15} /> Upload First Document
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {allDocs.map((doc) => {
                const status = STATUS_CONFIG[doc.moderation_status] ?? STATUS_CONFIG.pending
                const StatusIcon = status.icon
                const mislabel = isMislabeled(doc)

                return (
                  <div key={doc.id}
                    className={`px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition ${mislabel ? 'bg-orange-50/40' : ''}`}>
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
                        {mislabel && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">
                            <AlertTriangle size={10} /> Mislabeled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {TYPE_LABELS[doc.document_type]}
                        {doc.zimsec_level ? ` · ${LEVEL_LABELS[doc.zimsec_level]}` : ''}
                        {doc.subject ? ` · ${doc.subject.name}` : ' · No subject'}
                        {' · '}{doc.uploader_role}
                        {' · '}{new Date(doc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex gap-2 flex-shrink-0 items-center">
                      {doc.moderation_status === 'ai_reviewed' && (
                        <>
                          <Link href={`/admin/documents/${doc.id}/approve`}
                            className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition">
                            Approve
                          </Link>
                          <Link href={`/admin/documents/${doc.id}/reject`}
                            className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition">
                            Reject
                          </Link>
                        </>
                      )}
                      <Link
                        href={`/admin/documents/${doc.id}/edit`}
                        className={`p-1.5 rounded-lg transition flex items-center ${
                          mislabel
                            ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                        }`}
                        title="Edit document metadata"
                      >
                        <Pencil size={13} />
                      </Link>
                    </div>
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
