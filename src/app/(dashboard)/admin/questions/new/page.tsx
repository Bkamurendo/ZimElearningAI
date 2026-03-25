'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus } from 'lucide-react'

type Subject = { id: string; name: string; zimsec_level: string }

export default function NewQuestionPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [form, setForm] = useState({
    subject_id: '', topic: '', difficulty: 'medium',
    question_type: 'mcq', question_text: '',
    options: [{ label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }],
    correct_answer: 'A', open_answer: '', explanation: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [addAnother, setAddAnother] = useState(false)

  useEffect(() => {
    fetch('/api/admin/subjects').then(r => r.json()).then(d => {
      setSubjects(d.subjects ?? [])
      if (d.subjects?.length > 0) setForm(f => ({ ...f, subject_id: d.subjects[0].id }))
    })
  }, [])

  async function handleSubmit(e: React.FormEvent, saveAndAdd = false) {
    e.preventDefault()
    setSaving(true); setError('')

    const payload = {
      subject_id: form.subject_id,
      topic: form.topic,
      difficulty: form.difficulty,
      question_text: form.question_text,
      options: form.question_type === 'mcq' ? form.options : null,
      correct_answer: form.question_type === 'mcq' ? form.correct_answer : form.open_answer,
      explanation: form.explanation || undefined,
    }

    const res = await fetch('/api/admin/questions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error); setSaving(false); return }

    if (saveAndAdd) {
      setForm(f => ({ ...f, question_text: '', options: [{ label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }], correct_answer: 'A', open_answer: '', explanation: '' }))
      setSaving(false)
    } else {
      router.push('/admin/questions')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/admin/questions" className="inline-flex items-center gap-1.5 text-purple-200 hover:text-white text-sm mb-4 transition">
            <ArrowLeft size={14} /> Question Bank
          </Link>
          <h1 className="text-2xl font-bold text-white">Create Question</h1>
          <p className="text-purple-200 text-sm">Add a new question to the bank</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={e => handleSubmit(e, addAnother)} className="space-y-6">
          {error && <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            {/* Subject + Topic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Subject *</label>
                <select value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))} required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Topic *</label>
                <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} required
                  placeholder="e.g. Quadratic Equations" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Difficulty</label>
              <div className="flex gap-2">
                {['easy', 'medium', 'hard'].map(d => (
                  <button key={d} type="button" onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${form.difficulty === d
                      ? d === 'easy' ? 'bg-emerald-500 text-white' : d === 'medium' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Question type */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Question Type</label>
              <div className="flex gap-2">
                {[{ value: 'mcq', label: 'Multiple Choice (MCQ)' }, { value: 'open', label: 'Open-ended' }].map(({ value, label }) => (
                  <button key={value} type="button" onClick={() => setForm(f => ({ ...f, question_type: value }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${form.question_type === value ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question text */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Question *</label>
              <textarea value={form.question_text} onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))} required
                rows={3} placeholder="Enter the question text…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
            </div>

            {/* MCQ Options */}
            {form.question_type === 'mcq' && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">Answer Options *</label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={opt.label} className="flex items-center gap-3">
                      <input type="radio" name="correct" value={opt.label} checked={form.correct_answer === opt.label}
                        onChange={() => setForm(f => ({ ...f, correct_answer: opt.label }))}
                        className="accent-purple-600 w-4 h-4 flex-shrink-0" />
                      <span className="font-bold text-gray-400 text-sm w-4">{opt.label}</span>
                      <input value={opt.text}
                        onChange={e => { const opts = [...form.options]; opts[i] = { ...opts[i], text: e.target.value }; setForm(f => ({ ...f, options: opts })) }}
                        required={form.question_type === 'mcq'} placeholder={`Option ${opt.label}`}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                  ))}
                  <p className="text-xs text-gray-400">Select the radio button next to the correct answer</p>
                </div>
              </div>
            )}

            {/* Open-ended answer */}
            {form.question_type === 'open' && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Correct Answer / Model Answer *</label>
                <textarea value={form.open_answer} onChange={e => setForm(f => ({ ...f, open_answer: e.target.value }))} required
                  rows={3} placeholder="Enter the expected answer or marking guide…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>
            )}

            {/* Explanation */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Explanation <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
              <textarea value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                rows={2} placeholder="Explain why the correct answer is correct…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} onClick={() => setAddAnother(false)}
              className="bg-purple-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-purple-700 disabled:opacity-50 transition">
              {saving && !addAnother ? 'Saving…' : 'Save Question'}
            </button>
            <button type="submit" disabled={saving} onClick={() => setAddAnother(true)}
              className="flex items-center gap-1.5 bg-purple-100 text-purple-700 font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-purple-200 disabled:opacity-50 transition">
              <Plus size={14} /> {saving && addAnother ? 'Saving…' : 'Save & Add Another'}
            </button>
            <Link href="/admin/questions" className="px-6 py-2.5 text-gray-500 text-sm rounded-xl hover:bg-gray-100 transition">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
