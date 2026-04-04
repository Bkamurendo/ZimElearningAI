import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FileText, Upload, Trash2, Edit, Eye, ArrowLeft, Search, Filter, Download, CheckSquare, Square, MoreVertical, AlertTriangle } from 'lucide-react'

export const metadata = { title: 'Content Management — Admin' }

export default async function AdminContentPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  // Fetch content data
  const [
    { data: documents },
    { data: subjects },
    { data: pendingApproval },
    { data: flaggedContent },
  ] = await Promise.all([
    supabase.from('uploaded_documents').select('*, subjects(name), uploader:profiles(full_name, email)').order('created_at', { ascending: false }).limit(50),
    supabase.from('subjects').select('id, name').order('name'),
    supabase.from('uploaded_documents').select('*').eq('moderation_status', 'pending'),
    supabase.from('uploaded_documents').select('*').eq('moderation_status', 'flagged'),
  ])

  const totalDocuments = documents?.length || 0
  const pendingCount = pendingApproval?.length || 0
  const flaggedCount = flaggedContent?.length || 0
  const approvedCount = documents?.filter(d => d.moderation_status === 'approved')?.length || 0

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-emerald-200 hover:text-white text-sm mb-4 transition">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Content Management</h1>
              <p className="text-emerald-200 text-sm">Manage documents, media, and educational content</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Content Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <FileText size={20} className="text-emerald-600" />
              </div>
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                Total
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalDocuments}</p>
            <p className="text-sm text-gray-500 mt-1">Total Documents</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckSquare size={20} className="text-green-600" />
              </div>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Approved
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
            <p className="text-sm text-gray-500 mt-1">Approved Content</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Eye size={20} className="text-amber-600" />
              </div>
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                Pending
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            <p className="text-sm text-gray-500 mt-1">Awaiting Review</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                Flagged
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{flaggedCount}</p>
            <p className="text-sm text-gray-500 mt-1">Flagged Content</p>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Bulk Operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center gap-3 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition">
              <CheckSquare size={20} className="text-emerald-600" />
              <div className="text-left">
                <p className="font-medium text-emerald-900">Bulk Approve</p>
                <p className="text-sm text-emerald-600">Approve selected content</p>
              </div>
            </button>
            
            <button className="flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition">
              <Trash2 size={20} className="text-red-600" />
              <div className="text-left">
                <p className="font-medium text-red-900">Bulk Delete</p>
                <p className="text-sm text-red-600">Remove selected content</p>
              </div>
            </button>
            
            <button className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition">
              <Download size={20} className="text-blue-600" />
              <div className="text-left">
                <p className="font-medium text-blue-900">Export Content</p>
                <p className="text-sm text-blue-600">Download content list</p>
              </div>
            </button>
            
            <button className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition">
              <Filter size={20} className="text-purple-600" />
              <div className="text-left">
                <p className="font-medium text-purple-900">Advanced Filter</p>
                <p className="text-sm text-purple-600">Filter by criteria</p>
              </div>
            </button>
          </div>
        </div>

        {/* Content Management */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-900">Content Library</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search content..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition">
                <Upload size={16} />
                Upload Content
              </button>
            </div>
          </div>

          {/* Content Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">
                    <Square size={16} className="text-gray-400" />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Title</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Subject</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Uploader</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents?.map((doc) => (
                  <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Square size={16} className="text-gray-400" />
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{doc.title}</p>
                        <p className="text-sm text-gray-500">{doc.file_type}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{doc.subjects?.name || 'Uncategorized'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm text-gray-900">{doc.uploader?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{doc.uploader?.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        doc.moderation_status === 'approved' ? 'bg-green-100 text-green-600' :
                        doc.moderation_status === 'pending' ? 'bg-amber-100 text-amber-600' :
                        doc.moderation_status === 'flagged' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {doc.moderation_status || 'pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600 transition">
                          <Eye size={16} />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 transition">
                          <Edit size={16} />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600 transition">
                          <Trash2 size={16} />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 transition">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!documents || documents.length === 0) && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      <FileText size={40} className="mx-auto mb-3" />
                      <p className="font-medium">No content found</p>
                      <p className="text-sm mt-1">Upload your first document to get started</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Review */}
        {pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-amber-900">Content Awaiting Review</h2>
              <Link href="/admin/content/pending" className="text-sm text-amber-600 hover:text-amber-700 transition">
                View All ({pendingCount})
              </Link>
            </div>
            <div className="space-y-3">
              {pendingApproval?.slice(0, 3).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{doc.title}</p>
                    <p className="text-sm text-gray-500">Uploaded by {doc.uploader?.full_name || 'Unknown'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition">
                      Approve
                    </button>
                    <button className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
