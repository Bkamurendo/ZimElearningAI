'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

const DOC_TYPES = [
  { value: 'past_paper', label: 'Past Exam Paper' },
  { value: 'marking_scheme', label: 'Marking Scheme' },
  { value: 'notes', label: 'Study Notes' },
  { value: 'textbook', label: 'Textbook / Chapter' },
  { value: 'syllabus', label: 'ZIMSEC Syllabus' },
  { value: 'other', label: 'Other Resource' },
]

const LEVELS = [
  { value: 'primary', label: 'Primary' },
  { value: 'olevel', label: 'O-Level' },
  { value: 'alevel', label: 'A-Level' },
]

export default function AdminDocumentUploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [stage, setStage] = useState<'idle' | 'uploading' | 'saving' | 'processing' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    document_type: 'past_paper',
    zimsec_level: 'olevel',
    year: '',
    paper_number: '',
  })

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported')
      return
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('File must be under 50MB')
      return
    }
    setFile(f)
    setError('')
    // Auto-fill title from filename
    if (!form.title) {
      setForm(prev => ({ ...prev, title: f.name.replace(/\.pdf$/i, '') }))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !form.title || !form.document_type) return

    setUploading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 1. Upload file to Supabase Storage
      setStage('uploading')
      const filePath = `${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
      const { error: uploadError } = await supabase.storage
        .from('platform-documents')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

      // 2. Save metadata + trigger processing
      setStage('saving')
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          document_type: form.document_type,
          zimsec_level: form.zimsec_level,
          year: form.year || null,
          paper_number: form.paper_number || null,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save document')
      }

      setStage('processing')
      // Give a moment for the user to see the processing state
      await new Promise(r => setTimeout(r, 1500))
      setStage('done')

      setTimeout(() => router.push('/admin/documents'), 1500)
    } catch (err) {
      setStage('error')
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/admin/documents" className="text-gray-400 hover:text-gray-600 transition">← Documents</Link>
          <span className="text-gray-200">/</span>
          <span className="font-bold text-gray-900">Upload Document</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <h1 className="text-lg font-bold text-gray-900 mb-6">Upload ZIMSEC Document</h1>

          {stage === 'done' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Document Uploaded!</h2>
              <p className="text-sm text-gray-500 mt-1">AI is processing and moderating the content…</p>
              <p className="text-xs text-gray-400 mt-3">Redirecting to documents list…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* File Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                  file ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                  }}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText size={24} className="text-green-600" />
                    <div className="text-left">
                      <p className="font-semibold text-green-700 text-sm">{file.name}</p>
                      <p className="text-xs text-green-600">{(file.size / 1024 / 1024).toFixed(1)} MB · Click to change</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload size={28} className="text-gray-400 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700 text-sm">Drop PDF here or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">PDF only · Max 50MB</p>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Document Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. O-Level Mathematics 2023 Paper 1"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
              </div>

              {/* Two-column: Type + Level */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Document Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.document_type}
                    onChange={(e) => setForm(prev => ({ ...prev, document_type: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 outline-none"
                  >
                    {DOC_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    ZIMSEC Level
                  </label>
                  <select
                    value={form.zimsec_level}
                    onChange={(e) => setForm(prev => ({ ...prev, zimsec_level: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 outline-none"
                  >
                    {LEVELS.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Year + Paper (for past papers) */}
              {['past_paper', 'marking_scheme'].includes(form.document_type) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Examination Year
                    </label>
                    <input
                      type="number"
                      min="2000"
                      max="2030"
                      value={form.year}
                      onChange={(e) => setForm(prev => ({ ...prev, year: e.target.value }))}
                      placeholder="e.g. 2023"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Paper Number
                    </label>
                    <select
                      value={form.paper_number}
                      onChange={(e) => setForm(prev => ({ ...prev, paper_number: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 outline-none"
                    >
                      <option value="">Select…</option>
                      {[1, 2, 3, 4].map(n => (
                        <option key={n} value={n}>Paper {n}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this document…"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 outline-none resize-none"
                />
              </div>

              {/* AI Processing note */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-3">
                <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700">
                  <p className="font-semibold">AI Processing Included</p>
                  <p className="mt-0.5">After upload, AI will automatically extract text, generate a summary, identify topics, and moderate the content. Admin-uploaded documents are auto-published if AI approves.</p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!file || uploading || !form.title}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {stage === 'uploading' ? 'Uploading PDF…'
                      : stage === 'saving' ? 'Saving metadata…'
                        : 'Starting AI processing…'}
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload & Process with AI
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
