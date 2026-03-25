'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const origin = window.location.origin

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    })
    setLoading(false)

    if (resetError) {
      setError(resetError.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-xl">ZimLearn</span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          {sent ? (
            /* ── Success state ── */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-2">
                We&apos;ve sent a password reset link to{' '}
                <strong className="text-gray-600">{email}</strong>.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Click the link in the email to set a new password. It expires in 1 hour.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                Didn&apos;t receive it? Check your spam folder or{' '}
                <button
                  onClick={() => setSent(false)}
                  className="text-emerald-600 font-semibold hover:text-emerald-700 transition"
                >
                  try again
                </button>
              </p>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition"
              >
                <ArrowLeft size={15} />
                Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Form ── */
            <>
              <div className="mb-7">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                  <Mail size={28} className="text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Reset password</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Enter your email and we&apos;ll send a secure reset link.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-start gap-2.5">
                  <span className="flex-shrink-0 mt-0.5 text-red-400">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm placeholder:text-gray-300 hover:border-gray-300"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3.5 font-bold rounded-2xl transition-all duration-200 text-sm shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.01] active:scale-[0.99] text-white disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                >
                  {loading ? 'Sending…' : 'Send reset link →'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition"
                >
                  <ArrowLeft size={14} />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
