'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  GraduationCap, ShieldCheck, Loader2, XCircle, Mail, Phone, RefreshCw,
} from 'lucide-react'

/* ── TOTP sub-component ────────────────────────────────────────────────────── */
function TotpVerify() {
  const router = useRouter()
  const supabase = createClient()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [factorId, setFactorId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadFactor() {
      const { data } = await supabase.auth.mfa.listFactors()
      const totp = data?.totp?.[0]
      if (!totp) { router.replace('/student/dashboard'); return }
      setFactorId(totp.id)
      inputRef.current?.focus()
    }
    loadFactor()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId || code.length !== 6) return
    setLoading(true); setError('')
    try {
      const { data: challenge, error: chalErr } = await supabase.auth.mfa.challenge({ factorId })
      if (chalErr || !challenge) { setError(chalErr?.message ?? 'Challenge failed'); return }
      const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code })
      if (verifyErr) { setError('Incorrect code — please try again'); setCode(''); inputRef.current?.focus(); return }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role, onboarding_completed').eq('id', user.id).single()
      if (!profile?.onboarding_completed) router.replace('/onboarding')
      else router.replace(`/${profile.role}/dashboard`)
    } catch { setError('Something went wrong — please try again') }
    finally { setLoading(false) }
  }

  return (
    <>
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
        <ShieldCheck size={32} className="text-indigo-600" />
      </div>
      <h1 className="text-xl font-bold text-gray-900">Authenticator App</h1>
      <p className="text-gray-400 text-sm mt-2">Enter the 6-digit code from your authenticator app</p>

      <form onSubmit={handleVerify} className="space-y-4 mt-8 w-full">
        <input
          ref={inputRef}
          type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
          value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-2xl font-mono tracking-[0.4em] text-center placeholder:text-gray-300 placeholder:tracking-normal"
          required
        />
        {error && (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
            <XCircle size={16} className="shrink-0" />{error}
          </div>
        )}
        <button
          type="submit" disabled={loading || code.length !== 6 || !factorId}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying…</> : <><ShieldCheck size={18} /> Verify & Continue</>}
        </button>
      </form>
    </>
  )
}

/* ── Email OTP — uses Supabase native signInWithOtp (no Resend needed) ──────── */
function EmailOtpVerify() {
  const router = useRouter()
  const supabase = createClient()
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get user email from existing session, then auto-send OTP
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) { router.replace('/login'); return }
      setUserEmail(user.email)
      await sendOtp(user.email)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Also listen for magic-link clicks in another tab
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase
          .from('profiles').select('role, onboarding_completed').eq('id', user.id).single()
        if (!profile?.onboarding_completed) router.replace('/onboarding')
        else router.replace(`/${profile.role}/dashboard`)
      }
    })
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [countdown])

  async function sendOtp(email: string) {
    setSending(true); setError('')
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      })
      if (otpError) { setError(otpError.message); return }
      setSent(true)
      setCountdown(60)
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch { setError('Failed to send — please try again') }
    finally { setSending(false) }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!userEmail || code.length !== 6) return
    setVerifying(true); setError('')
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: userEmail,
        token: code,
        type: 'email',
      })
      if (verifyError) {
        setError('Incorrect or expired code — please try again')
        setCode(''); inputRef.current?.focus(); return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('role, onboarding_completed').eq('id', user.id).single()
      if (!profile?.onboarding_completed) router.replace('/onboarding')
      else router.replace(`/${profile.role}/dashboard`)
    } catch { setError('Network error — please try again') }
    finally { setVerifying(false) }
  }

  return (
    <>
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
        <Mail size={32} className="text-indigo-600" />
      </div>
      <h1 className="text-xl font-bold text-gray-900">Email Verification</h1>
      <p className="text-gray-400 text-sm mt-2 leading-relaxed">
        {sent
          ? <><span>We sent a verification code to </span><strong className="text-gray-600">{userEmail}</strong><span>. Enter it below.</span></>
          : 'Sending a verification code to your email…'}
      </p>

      <form onSubmit={handleVerify} className="space-y-4 mt-8 w-full">
        <input
          ref={inputRef}
          type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
          value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000" disabled={!sent}
          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-2xl font-mono tracking-[0.4em] text-center placeholder:text-gray-300 placeholder:tracking-normal disabled:opacity-40"
          required
        />

        {error && (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
            <XCircle size={16} className="shrink-0" />{error}
          </div>
        )}

        <button
          type="submit" disabled={verifying || code.length !== 6 || !sent}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
        >
          {verifying ? <><Loader2 size={18} className="animate-spin" /> Verifying…</> : <><ShieldCheck size={18} /> Verify & Continue</>}
        </button>

        <button
          type="button"
          onClick={() => userEmail && sendOtp(userEmail)}
          disabled={sending || countdown > 0 || !userEmail}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition pt-1"
        >
          <RefreshCw size={13} className={sending ? 'animate-spin' : ''} />
          {countdown > 0 ? `Resend code in ${countdown}s` : sending ? 'Sending…' : 'Resend code'}
        </button>
      </form>
    </>
  )
}

/* ── Phone / SMS OTP — existing Infobip flow ─────────────────────────────── */
function PhoneOtpVerify() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  async function sendCode() {
    setSending(true); setError('')
    try {
      const res = await fetch('/api/auth/mfa/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'phone' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to send code'); return }
      setSent(true)
      setCountdown(60)
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch { setError('Network error — please try again') }
    finally { setSending(false) }
  }

  // Auto-send on mount
  useEffect(() => { sendCode() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [countdown])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return
    setVerifying(true); setError('')
    try {
      const res = await fetch('/api/auth/mfa/verify-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'phone', code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Incorrect code'); setCode(''); inputRef.current?.focus(); return }
      if (!data.onboarding_completed) router.replace('/onboarding')
      else router.replace(`/${data.role}/dashboard`)
    } catch { setError('Network error — please try again') }
    finally { setVerifying(false) }
  }

  return (
    <>
      <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
        <Phone size={32} className="text-emerald-600" />
      </div>
      <h1 className="text-xl font-bold text-gray-900">SMS Verification</h1>
      <p className="text-gray-400 text-sm mt-2">
        {sent
          ? 'We sent a 6-digit code to your phone. It expires in 10 minutes.'
          : 'Sending a verification code to your phone…'}
      </p>

      <form onSubmit={handleVerify} className="space-y-4 mt-8 w-full">
        <input
          ref={inputRef}
          type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
          value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000" disabled={!sent}
          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-2xl font-mono tracking-[0.4em] text-center placeholder:text-gray-300 placeholder:tracking-normal disabled:opacity-40"
          required
        />

        {error && (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
            <XCircle size={16} className="shrink-0" />{error}
          </div>
        )}

        <button
          type="submit" disabled={verifying || code.length !== 6 || !sent}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
        >
          {verifying ? <><Loader2 size={18} className="animate-spin" /> Verifying…</> : <><ShieldCheck size={18} /> Verify & Continue</>}
        </button>

        <button
          type="button" onClick={sendCode}
          disabled={sending || countdown > 0}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition pt-1"
        >
          <RefreshCw size={13} className={sending ? 'animate-spin' : ''} />
          {countdown > 0 ? `Resend code in ${countdown}s` : sending ? 'Sending…' : 'Resend code'}
        </button>
      </form>
    </>
  )
}

/* ── Wrapper that reads searchParams ─────────────────────────────────────── */
function MfaVerifyInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const method = searchParams.get('method') as 'email' | 'phone' | null

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-xl">ZimLearn</span>
        </div>

        <div className="flex flex-col items-center text-center">
          {method === 'email' && <EmailOtpVerify />}
          {method === 'phone' && <PhoneOtpVerify />}
          {!method && <TotpVerify />}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 mb-3">Having trouble?</p>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-700 underline transition"
          >
            Sign out and use a different account
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Page export with Suspense boundary (required for useSearchParams) ─────── */
export default function MfaVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-indigo-400" />
      </div>
    }>
      <MfaVerifyInner />
    </Suspense>
  )
}
