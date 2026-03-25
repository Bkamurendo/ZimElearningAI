'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, ArrowLeft, Send, Users, Phone } from 'lucide-react'

type RecipientType = 'all_students' | 'all_parents' | 'all_teachers' | 'specific_phones'

const RECIPIENT_OPTIONS: { value: RecipientType; label: string; description: string }[] = [
  { value: 'all_students', label: 'All Students', description: 'Every student account' },
  { value: 'all_parents', label: 'All Parents', description: 'All parent accounts' },
  { value: 'all_teachers', label: 'All Teachers', description: 'All teacher accounts' },
  { value: 'specific_phones', label: 'Specific Phones', description: 'Enter numbers manually' },
]

const MAX_SMS_CHARS = 160

export default function BulkSMSPage() {
  const [recipientType, setRecipientType] = useState<RecipientType>('all_parents')
  const [specificPhones, setSpecificPhones] = useState('')
  const [message, setMessage] = useState('')
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)
  const [error, setError] = useState('')

  const charsLeft = MAX_SMS_CHARS - message.length
  const isOverLimit = charsLeft < 0

  function parsePhones(): string[] {
    return specificPhones
      .split(/[\n,;]+/)
      .map(p => p.trim())
      .filter(Boolean)
  }

  async function handleSend() {
    setSending(true)
    setError('')

    const phones =
      recipientType === 'specific_phones' ? parsePhones() : undefined

    const body: Record<string, unknown> = { message, type: 'sms' }

    if (recipientType === 'specific_phones') {
      if (!phones || phones.length === 0) {
        setError('Please enter at least one phone number.')
        setSending(false)
        return
      }
      body.phones = phones
    } else {
      // Pass the audience tag; the API resolves it via Supabase
      body.audience = recipientType
    }

    try {
      const res = await fetch('/api/notifications/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = (await res.json()) as { sent?: number; failed?: number; error?: string }

      if (!res.ok) {
        setError(json.error ?? 'Something went wrong.')
        setSending(false)
        return
      }

      setResult({ sent: json.sent ?? 0, failed: json.failed ?? 0 })
      setStep('done')
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSending(false)
    }
  }

  function handleReset() {
    setStep('form')
    setMessage('')
    setSpecificPhones('')
    setRecipientType('all_parents')
    setResult(null)
    setError('')
  }

  const recipientLabel =
    RECIPIENT_OPTIONS.find(o => o.value === recipientType)?.label ?? ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-emerald-100 hover:text-white text-sm mb-4 transition"
          >
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageSquare size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Bulk SMS</h1>
              <p className="text-emerald-100 text-sm">Send SMS to users via Africa&apos;s Talking</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* ── Done state ──────────────────────────────────────────────────── */}
        {step === 'done' && result && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send size={24} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">SMS Sent!</h2>
            <div className="flex items-center justify-center gap-6 mb-6">
              <div>
                <p className="text-3xl font-bold text-emerald-600">{result.sent.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">Delivered</p>
              </div>
              {result.failed > 0 && (
                <div>
                  <p className="text-3xl font-bold text-red-500">{result.failed.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Failed</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleReset}
                className="bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-700 transition"
              >
                Send Another
              </button>
              <Link
                href="/admin/dashboard"
                className="px-5 py-2.5 text-gray-500 rounded-xl text-sm hover:bg-gray-100 transition"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* ── Confirm state ────────────────────────────────────────────────── */}
        {step === 'confirm' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg mb-1">Confirm SMS</h2>
              <p className="text-gray-500 text-sm">Review before sending — this cannot be undone.</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Recipients</span>
                <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                  <Users size={13} />
                  {recipientType === 'specific_phones'
                    ? `${parsePhones().length} phone number(s)`
                    : recipientLabel}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Characters</span>
                <span className="font-semibold text-gray-800">{message.length} / {MAX_SMS_CHARS}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500 block mb-1">Message</span>
                <p className="text-gray-800 bg-white rounded-lg p-3 border border-gray-100 text-xs leading-relaxed whitespace-pre-wrap">
                  {message}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center gap-2 bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                <Send size={14} />
                {sending ? 'Sending…' : 'Confirm & Send'}
              </button>
              <button
                onClick={() => setStep('form')}
                className="px-6 py-2.5 text-gray-500 text-sm rounded-xl hover:bg-gray-100 transition"
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {/* ── Form state ───────────────────────────────────────────────────── */}
        {step === 'form' && (
          <form
            onSubmit={e => {
              e.preventDefault()
              if (!isOverLimit) setStep('confirm')
            }}
            className="space-y-6"
          >
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              {/* Recipient type */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">
                  Recipients *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RECIPIENT_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        recipientType === opt.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="recipientType"
                        value={opt.value}
                        checked={recipientType === opt.value}
                        onChange={() => setRecipientType(opt.value)}
                        className="mt-0.5 accent-emerald-600"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                        <p className="text-xs text-gray-400">{opt.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Specific phones input */}
              {recipientType === 'specific_phones' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">
                    Phone Numbers *
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-3 text-gray-400" />
                    <textarea
                      value={specificPhones}
                      onChange={e => setSpecificPhones(e.target.value)}
                      required={recipientType === 'specific_phones'}
                      rows={4}
                      placeholder="0771234567&#10;0712345678&#10;+2637xxxxxxxx"
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none font-mono"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    One per line, or separate with commas. Zimbabwe numbers are auto-formatted.
                  </p>
                </div>
              )}

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Message *
                  </label>
                  <span
                    className={`text-xs font-mono font-semibold ${
                      isOverLimit
                        ? 'text-red-500'
                        : charsLeft <= 20
                        ? 'text-amber-500'
                        : 'text-gray-400'
                    }`}
                  >
                    {message.length} / {MAX_SMS_CHARS}
                  </span>
                </div>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  maxLength={MAX_SMS_CHARS + 50} // allow over-limit so user sees feedback
                  rows={5}
                  placeholder="Write your SMS message here…"
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none transition ${
                    isOverLimit
                      ? 'border-red-300 focus:ring-red-400 bg-red-50'
                      : 'border-gray-200 focus:ring-emerald-400'
                  }`}
                />
                {isOverLimit && (
                  <p className="text-xs text-red-500 mt-1">
                    Message is {Math.abs(charsLeft)} character(s) over the 160-character SMS limit.
                    Shorten it to continue.
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Staying within 160 characters avoids split messages and extra charges.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isOverLimit || message.trim().length === 0}
              className="flex items-center gap-2 bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Send size={14} /> Preview &amp; Send
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
