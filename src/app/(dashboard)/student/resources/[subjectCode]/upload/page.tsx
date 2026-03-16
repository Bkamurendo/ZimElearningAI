'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

const DOC_TYPES = [
  { value: 'past_paper',     label: 'Past Exam Paper' },
  { value: 'marking_scheme', label: 'Marking Scheme' },
  { value: 'notes',          label: 'Study Notes' },
  { value: 'textbook',       label: 'Textbook / Chapter' },
  { value: 'other',          label: 'Other Resource' },
]

export default function StudentResourceUploadPage() {
  const router = useRouter()
  const params = useParams()
  const subjectCode = params.subjectCode as string

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [stage, setStage] = useState<'idle' | 'uploading' | 'saving' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [subjectId, setSubjectId] = useState<string | null>(null)
  const [subjectName, setSubjectName] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    document_type: 'notes',
    year: '',
    paper_number: '',
  })

  useEffect(() => {
    async function loadSubject() {
      const supabase = createClient()
      const { data } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('code', subjectCode)
        .single()
      if (data) {
        setSubjectId(data.id)
        setSubjectName(data.name)
      }
    }
    loadSubject()
  }, [subjectCode])

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

      setStage('uploading')
      const filePath = `${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
      const { error: uploadError } = await supabase.storage
        .from('platform-documents')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

      setStage('saving')
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          document_type: form.document_type,
          subject_id: subjectId,
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

      setStage('done')
      setTimeout(() => router.push(`/student/resources/${subjectCode}`), 2000)
    } catch (err) {
      setStage('error')
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        <div className="flex items-center gap-2 text-sm">
          <Link href={`/student/resources/${subjectCode}`} className="text-gray-400 hover:text-gray-600 transition">
            ← {subjectName || 'Resources'}
          </Link>
          <span className="text-gray-200">/</span>
          <span className="font-bold text-gray-900">Upload Resource</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <h1 className="text-lg font-bold text-gray-900 mb-6">Share a Resource</h1>

          {stage === 'done' ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Resource Uploaded!</h2>
              <p className="text-sm text-gray-500 mt-1">Your document is being reviewed by AI.</p>
              <p className="text-xs text-gray-400 mt-3">It will be shared with classmates after approval. Redirecting…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* File Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                  file ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
                    <FileText size={24} className="text-indigo-600" />
                    <div className="text-left">
                      <p className="font-semibold text-indigo-700 text-sm">{file.name}</p>
                      <p className="text-xs text-indigo-500">{(file.size / 1024 / 1024).toFixed(1)} MB · Click to change</p>
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

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Document Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Mathematics Past Paper 2022 Paper 1"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Document Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.document_type}
                  onChange={(e) => setForm(prev => ({ ...prev, document_type: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {DOC_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

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
                      placeholder="e.g. 2022"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Paper Number
                    </label>
                    <select
                      value={form.paper_number}
                      onChange={(e) => setForm(prev => ({ ...prev, paper_number: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">Select…</option>
                      {[1, 2, 3, 4].map(n => (
                        <option key={n} value={n}>Paper {n}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What is this document about?"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3">
                <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold">Moderation Required</p>
                  <p className="mt-0.5">
                    Your document will be stored in your account. It will only be visible to other students
                    after AI review and admin approval.
                  </p>
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
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {stage === 'uploading' ? 'Uploading PDF…' : 'Saving…'}
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Share Resource
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
