import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Bookmark, ChevronRight, Search } from 'lucide-react'
import BookmarkToggle from './BookmarkToggle'

const DOC_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  past_paper:     { label: 'Past Paper',  icon: '📝', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  marking_scheme: { label: 'Mark Scheme', icon: '✅', color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  notes:          { label: 'Study Notes', icon: '📖', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  textbook:       { label: 'Textbook',    icon: '📚', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  syllabus:       { label: 'Syllabus',    icon: '🗂️',  color: 'text-orange-700',bg: 'bg-orange-50 border-orange-200' },
  other:          { label: 'Resource',    icon: '📄', color: 'text-gray-700',   bg: 'bg-gray-50 border-gray-200' },
}

type BookmarkRow = {
  id: string
  created_at: string
  document: {
    id: string
    title: string
    document_type: string
    zimsec_level: string | null
    year: number | null
    paper_number: number | null
    ai_summary: string | null
    topics: string[] | null
    file_size: number | null
    moderation_status: string
    subject: { name: string; code: string } | null
  } | null
}

export default async function BookmarksPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('bookmarks')
    .select(`
      id,
      created_at,
      document:uploaded_documents(
        id, title, document_type, zimsec_level, year, paper_number,
        ai_summary, topics, file_size, moderation_status,
        subject:subjects(name, code)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as { data: BookmarkRow[] | null; error: unknown }

  const bookmarks = (data ?? []).filter((b) => b.document !== null)

  function formatSize(bytes: number | null) {
    if (!bytes) return ''
    return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 text-white rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bookmark size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Bookmarks</h1>
              <p className="text-amber-200 text-sm mt-0.5">
                {bookmarks.length} saved resource{bookmarks.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {bookmarks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bookmark size={28} className="text-amber-300" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">No bookmarks yet</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto mb-5">
              Save documents you want to revisit by clicking the bookmark icon when viewing any resource.
            </p>
            <Link
              href="/student/search"
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              <Search size={15} />
              Browse Resources
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((bookmark) => {
              const doc = bookmark.document!
              const config = DOC_TYPE_CONFIG[doc.document_type] ?? DOC_TYPE_CONFIG.other
              const subjectCode = doc.subject?.code ?? 'unknown'
              return (
                <div
                  key={bookmark.id}
                  className="group relative flex gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-amber-300 hover:shadow-md transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border ${config.bg}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/student/resources/${subjectCode}/${doc.id}`} className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                          {doc.zimsec_level && (
                            <span className="text-xs text-gray-500 font-medium capitalize">
                              {doc.zimsec_level === 'olevel' ? 'O-Level' : doc.zimsec_level === 'alevel' ? 'A-Level' : 'Primary'}
                            </span>
                          )}
                          {doc.year && <span className="text-xs text-gray-500">{doc.year}</span>}
                          {doc.paper_number && <span className="text-xs text-gray-400">· Paper {doc.paper_number}</span>}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-amber-700 transition">
                          {doc.title}
                        </h3>
                        {doc.subject && (
                          <p className="text-xs text-gray-400 mt-0.5">{doc.subject.name}</p>
                        )}
                      </Link>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <BookmarkToggle documentId={doc.id} isBookmarked={true} />
                        <Link
                          href={`/student/resources/${subjectCode}/${doc.id}`}
                          className="p-1.5 text-gray-300 group-hover:text-amber-500 transition"
                        >
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    </div>
                    {doc.ai_summary && (
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{doc.ai_summary}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {(doc.topics ?? []).slice(0, 3).map((t) => (
                        <span key={t} className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                      {doc.file_size && (
                        <span className="text-xs text-gray-400 ml-auto">{formatSize(doc.file_size)}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Hint */}
        {bookmarks.length > 0 && (
          <p className="text-center text-xs text-gray-400 pb-4">
            Click the bookmark icon on any document to add or remove it from your collection.
          </p>
        )}

      </div>
    </div>
  )
}
