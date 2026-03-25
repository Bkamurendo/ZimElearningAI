'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Eye, EyeOff, KeyRound, CheckCircle, Loader2 } from 'lucide-react'

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (password.length === 0) return { score: 0, label: '', color: 'bg-gray-200' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-500' }
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-400' }
  return { score, label: 'Strong', color: 'bg-emerald-500' }
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    // Verify we have a valid session (user arrived from password-reset email link)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true)
      } else {
        // No session — send them back to request a new link
        router.replace('/forgot-password')
      }
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      setDone(true)
      // Redirect to login after 3 seconds with success message
      setTimeout(() => router.replace('/login?message=password_reset_success'), 3000)
    }
  }

  const strength = getPasswordStrength(password)
  const mismatch = confirm.length > 0 && password !== confirm

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin text-emerald-400" />
      </div>
    )
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
          {done ? (
            /* ── Success state ── */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Password updated!</h2>
              <p className="text-gray-400 text-sm">
                Your password has been changed successfully. Redirecting you to sign in…
              </p>
            </div>
          ) : (
            /* ── Form ── */
            <>
              <div className="mb-7">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                  <KeyRound size={28} className="text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Set new password</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Choose a strong password for your account.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-start gap-2.5">
                  <span className="flex-shrink-0 mt-0.5 text-red-400">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* New password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider"
                  >
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoFocus
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-11 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm placeholder:text-gray-300 hover:border-gray-300"
                      placeholder="Min. 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              i <= strength.score ? strength.color : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-semibold ${
                        strength.score <= 1 ? 'text-red-500'
                          : strength.score <= 2 ? 'text-amber-500'
                          : strength.score <= 3 ? 'text-yellow-500'
                          : 'text-emerald-600'
                      }`}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor="confirm"
                    className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider"
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className={`w-full px-4 py-3 pr-11 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm placeholder:text-gray-300 hover:border-gray-300 ${
                        mismatch ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="Repeat password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {mismatch && (
                    <p className="text-xs text-red-500 mt-1.5 font-medium">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || password.length < 8 || password !== confirm}
                  className="w-full py-3.5 font-bold rounded-2xl transition-all duration-200 text-sm shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.01] active:scale-[0.99] text-white disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Updating…
                    </span>
                  ) : (
                    'Update password →'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
