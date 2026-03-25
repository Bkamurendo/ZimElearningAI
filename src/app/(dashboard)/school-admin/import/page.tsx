'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Upload,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  GraduationCap,
  AlertTriangle,
  X,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type ImportType = 'students' | 'teachers'

interface StudentRow {
  full_name: string
  email: string
  password: string
  zimsec_level: string
  grade: string
  [key: string]: string
}

interface TeacherRow {
  full_name: string
  email: string
  password: string
  qualification: string
  [key: string]: string
}

type ImportRow = StudentRow | TeacherRow

interface ImportResult {
  success: number
  failed: { row: number; email: string; error: string }[]
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = parseCSVLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/\s+/g, '_')
  )
  const rows = lines.slice(1).map((l) => parseCSVLine(l))
  return { headers, rows }
}

function rowsToObjects(
  headers: string[],
  rows: string[][]
): Record<string, string>[] {
  return rows.map((r) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => {
      obj[h] = r[i] ?? ''
    })
    return obj
  })
}

// ── Template generators ───────────────────────────────────────────────────────

function downloadTemplate(type: ImportType) {
  const headers =
    type === 'students'
      ? 'full_name,email,password,zimsec_level,grade'
      : 'full_name,email,password,qualification'

  const example =
    type === 'students'
      ? 'Tendai Moyo,tendai@school.ac.zw,Pass@1234,olevel,Form 4'
      : 'Mrs Chipo Dube,chipo@school.ac.zw,Pass@1234,B.Ed Mathematics'

  const csv = `${headers}\n${example}\n`
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `import_${type}_template.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Column definitions per type ───────────────────────────────────────────────

const STUDENT_COLS = ['full_name', 'email', 'password', 'zimsec_level', 'grade']
const TEACHER_COLS = ['full_name', 'email', 'password', 'qualification']

// ── Main Component ────────────────────────────────────────────────────────────

export default function SchoolAdminImportPage() {
  const [tab, setTab] = useState<ImportType>('students')
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([])
  const [parseError, setParseError] = useState('')
  const [fileName, setFileName] = useState('')
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const expectedCols = tab === 'students' ? STUDENT_COLS : TEACHER_COLS

  function reset() {
    setParsedRows([])
    setParseError('')
    setFileName('')
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function switchTab(t: ImportType) {
    setTab(t)
    reset()
  }

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      setParseError('Please upload a .csv file.')
      return
    }
    setFileName(file.name)
    setParseError('')
    setResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers, rows } = parseCSV(text)

      // Validate required columns
      const missing = expectedCols.filter((c) => !headers.includes(c))
      if (missing.length > 0) {
        setParseError(
          `Missing required columns: ${missing.join(', ')}. Please use the template.`
        )
        setParsedRows([])
        return
      }

      const objects = rowsToObjects(headers, rows) as ImportRow[]
      setParsedRows(objects)
    }
    reader.readAsText(file)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab]
  )

  async function handleImport() {
    if (parsedRows.length === 0) return
    setImporting(true)
    setResult(null)

    try {
      const res = await fetch('/api/school-admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: tab, rows: parsedRows }),
      })
      const json = await res.json()
      if (!res.ok) {
        setParseError(json.error ?? 'Import failed. Please try again.')
      } else {
        setResult({
          success: json.success ?? 0,
          failed: json.failed ?? [],
        })
        setParsedRows([])
        setFileName('')
        if (fileRef.current) fileRef.current.value = ''
      }
    } catch {
      setParseError('Network error. Please check your connection and try again.')
    } finally {
      setImporting(false)
    }
  }

  const previewRows = parsedRows.slice(0, 10)
  const totalRows = parsedRows.length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/school-admin/dashboard"
            className="inline-flex items-center gap-1.5 text-emerald-200 hover:text-white text-sm mb-4 transition"
          >
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Upload size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Bulk Import</h1>
              <p className="text-emerald-200 text-sm">
                Import students or teachers via CSV
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* ── Tab switcher ── */}
        <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-slate-200 p-1 w-fit">
          {(
            [
              { key: 'students', label: 'Import Students', icon: Users },
              {
                key: 'teachers',
                label: 'Import Teachers',
                icon: GraduationCap,
              },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                tab === key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Format instructions ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-emerald-500" />
              <h2 className="font-bold text-slate-800">CSV Format</h2>
            </div>
            <button
              onClick={() => downloadTemplate(tab)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              <Download size={13} /> Download Template
            </button>
          </div>

          <p className="text-sm text-slate-500 mb-3">
            Your CSV must include the following columns (first row = header):
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {expectedCols.map((col) => (
              <span
                key={col}
                className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-mono font-semibold rounded-lg border border-emerald-100"
              >
                {col}
              </span>
            ))}
          </div>

          {tab === 'students' && (
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1 font-mono">
              <p className="font-semibold text-slate-600 not-italic font-sans">
                Example row:
              </p>
              <p>
                Tendai Moyo, tendai@school.ac.zw, Pass@1234, olevel, Form 4
              </p>
              <p className="not-italic font-sans text-slate-400 mt-1">
                zimsec_level must be <strong>olevel</strong> or{' '}
                <strong>alevel</strong>
              </p>
            </div>
          )}
          {tab === 'teachers' && (
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 font-mono">
              <p className="font-semibold text-slate-600 not-italic font-sans mb-1">
                Example row:
              </p>
              <p>Mrs Chipo Dube, chipo@school.ac.zw, Pass@1234, B.Ed Mathematics</p>
            </div>
          )}
        </div>

        {/* ── File upload area ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 mb-4">Upload CSV File</h2>

          {/* Drag/drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${
              dragging
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
            }`}
          >
            <Upload
              size={32}
              className={`mx-auto mb-3 ${
                dragging ? 'text-emerald-500' : 'text-slate-300'
              }`}
            />
            <p className="text-sm font-semibold text-slate-600 mb-1">
              {fileName
                ? fileName
                : 'Drop your CSV here, or click to browse'}
            </p>
            <p className="text-xs text-slate-400">
              Accepts .csv files only
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={onFileChange}
              className="hidden"
            />
          </div>

          {/* Parse error */}
          {parseError && (
            <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{parseError}</span>
              <button
                onClick={() => setParseError('')}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ── Preview table ── */}
        {parsedRows.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">
                Preview
                <span className="ml-2 text-sm font-normal text-slate-400">
                  (showing {previewRows.length} of {totalRows})
                </span>
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 font-medium">
                  {totalRows}{' '}
                  {tab === 'students' ? 'student' : 'teacher'}
                  {totalRows !== 1 ? 's' : ''} ready to import
                </span>
                <button
                  onClick={reset}
                  className="text-xs text-slate-400 hover:text-slate-600 transition"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      #
                    </th>
                    {expectedCols.map((col) => (
                      <th
                        key={col}
                        className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {previewRows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {i + 1}
                      </td>
                      {expectedCols.map((col) => (
                        <td
                          key={col}
                          className="px-4 py-3 text-slate-700 max-w-[160px] truncate"
                        >
                          {col === 'password' ? (
                            <span className="text-slate-300 tracking-widest text-xs">
                              ••••••••
                            </span>
                          ) : (
                            (row as Record<string, string>)[col] || (
                              <span className="text-slate-300">—</span>
                            )
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Import button */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleImport}
                disabled={importing}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition shadow-sm"
              >
                {importing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <Upload size={15} />
                    Import {totalRows}{' '}
                    {tab === 'students' ? 'Student' : 'Teacher'}
                    {totalRows !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Import results ── */}
        {result && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Import Results</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Success count */}
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-800">
                    {result.success} account
                    {result.success !== 1 ? 's' : ''} created successfully
                  </p>
                  {result.failed.length > 0 && (
                    <p className="text-xs text-emerald-600 mt-0.5">
                      {result.failed.length} row
                      {result.failed.length !== 1 ? 's' : ''} failed — see
                      below
                    </p>
                  )}
                </div>
              </div>

              {/* Failed rows */}
              {result.failed.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <XCircle size={15} className="text-red-400" />
                    Failed Rows
                  </p>
                  <div className="space-y-2">
                    {result.failed.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm"
                      >
                        <XCircle
                          size={14}
                          className="text-red-400 flex-shrink-0 mt-0.5"
                        />
                        <div>
                          <p className="font-medium text-slate-700">
                            Row {f.row}
                            {f.email ? ` — ${f.email}` : ''}
                          </p>
                          <p className="text-red-600 text-xs mt-0.5">
                            {f.error}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setResult(null)}
                className="text-sm text-slate-400 hover:text-slate-600 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
