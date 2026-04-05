'use client'

import { useState, useEffect } from 'react'
import { X, Search, Check, Loader2, Library } from 'lucide-react'

interface Resource {
  id: string
  title: string
  document_type: string
  zimsec_level?: string
  year?: number
  subject?: { name: string; code: string } | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect: (resources: Resource[]) => void
}

const DOC_TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  past_paper: { label: 'Past Paper', icon: '📝' },
  marking_scheme: { label: 'Mark Scheme', icon: '✅' },
  notes: { label: 'Study Notes', icon: '📖' },
  textbook: { label: 'Textbook', icon: '📚' },
  syllabus: { label: 'Syllabus', icon: '🗂️' },
  other: { label: 'Resource', icon: '📄' },
}

export function ResourcePickerModal({ isOpen, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [level, setLevel] = useState('all')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Resource[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(search, 300)
    return () => clearTimeout(timer)
  }, [query, type, level, isOpen])

  async function search() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: query,
        type: type !== 'all' ? type : '',
        level: level !== 'all' ? level : '',
      })
      const res = await fetch(`/api/resources/search?${params.toString()}`)
      const data = await res.json()
      setResults(data.resources || [])
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelection = (resource: Resource) => {
    const next = new Set(selectedIds)
    if (next.has(resource.id)) {
      next.delete(resource.id)
    } else {
      if (next.size >= 5) return // Limit to 5
      next.add(resource.id)
    }
    setSelectedIds(next)
  }

  const handleConfirm = () => {
    const selected = results.filter(r => selectedIds.has(r.id))
    onSelect(selected)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Library size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Platform Resources</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Select 1-5 materials to guide MaFundi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 bg-white border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by title, subject, or year..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" size={18} />}
          </div>
          
          <div className="flex gap-2">
            <select 
              value={level} 
              onChange={e => setLevel(e.target.value)}
              className="px-3 py-1.5 bg-slate-100/50 border-none rounded-lg text-xs font-semibold text-slate-600 outline-none hover:bg-slate-100 transition-colors"
            >
              <option value="all">All Levels</option>
              <option value="primary">Primary</option>
              <option value="olevel">O-Level</option>
              <option value="alevel">A-Level</option>
            </select>
            <select 
              value={type} 
              onChange={e => setType(e.target.value)}
              className="px-3 py-1.5 bg-slate-100/50 border-none rounded-lg text-xs font-semibold text-slate-600 outline-none hover:bg-slate-100 transition-colors"
            >
              <option value="all">All Types</option>
              {Object.entries(DOC_TYPE_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/30">
          {results.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                <Search size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium text-sm">No documents match your query.</p>
              <p className="text-slate-400 text-xs mt-1">Try broadening your search or switching filters.</p>
            </div>
          ) : (
            results.map(doc => {
              const config = DOC_TYPE_CONFIG[doc.document_type] || DOC_TYPE_CONFIG.other
              const isSelected = selectedIds.has(doc.id)
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleSelection(doc)}
                  className={`group flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl border ${
                    isSelected ? 'bg-white border-indigo-100' : 'bg-slate-50 border-slate-100'
                  }`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{doc.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      {doc.subject?.name || 'Standard'} · {doc.zimsec_level || 'HBC'} {doc.year ? `· ${doc.year}` : ''}
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'border-slate-200 bg-white opacity-0 group-hover:opacity-100'
                  }`}>
                    <Check size={14} className={isSelected ? '' : 'text-slate-300'} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            {selectedIds.size} resource{selectedIds.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 hover:bg-slate-100 rounded-xl transition text-sm font-bold text-slate-600">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition text-sm font-bold shadow-lg shadow-indigo-100"
            >
              Attach {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
