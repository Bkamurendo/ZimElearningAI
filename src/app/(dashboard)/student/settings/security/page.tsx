'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ShieldCheck, ShieldOff, ArrowLeft, Loader2, XCircle,
  CheckCircle2, KeyRound, AlertTriangle, Copy, Check,
  Mail, Phone, QrCode,
} from 'lucide-react'

type MfaMethod = 'none' | 'totp' | 'email' | 'phone'
type SetupStep = 'choose' | 'totp-qr' | 'email-confirm' | 'phone-enter' | 'phone-verify'

export default function SecuritySettingsPage() {
  const supabase = createClient()

  /* ── state ── */
  const [currentMethod, setCurrentMethod] = useState<MfaMethod>('none')
  const [pageLoading, setPageLoading]     = useState(true)
  const [step, setStep]                   = useState<SetupStep>('choose')

  // TOTP enroll
  const [qrUrl, setQrUrl]       = useState('')
  const [secret, setSecret]     = useState('')
  const [enrollId, setEnrollId] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [copied, setCopied]     = useState(false)
  const totpRef = useRef<HTMLInputElement>(null)

  // Email confirm
  const [userEmail, setUserEmail] = useState('')

  // Phone enter + verify
  const [phone, setPhone]           = useState('')
  const [phoneCode, setPhoneCode]   = useState('')
  const phoneCodeRef = useRef<HTMLInputElement>(null)

  // Shared UI
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  /* ── load current state ── */
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email ?? '')
      const { data: profile } = await supabase
        .from('profiles')
        .select('mfa_method, mfa_phone')
        .eq('id', user.id)
        .single()
      setCurrentMethod((profile?.mfa_method as MfaMethod) ?? 'none')
      if (profile?.mfa_phone) setPhone(profile.mfa_phone)
      setPageLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── helpers ── */
  function resetState() {
    setStep('choose'); setError(''); setSuccess('')
    setTotpCode(''); setQrUrl(''); setSecret(''); setEnrollId('')
    setPhoneCode('')
  }

  async function saveMethod(method: MfaMethod, phoneNum?: string) {
    const updates: Record<string, unknown> = { mfa_method: method }
    if (phoneNum !== undefined) updates.mfa_phone = phoneNum
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update(updates).eq('id', user.id)
    setCurrentMethod(method)
  }

  async function unenrollTotp() {
    const { data } = await supabase.auth.mfa.listFactors()
    const totp = data?.totp?.[0]
    if (totp) await supabase.auth.mfa.unenroll({ factorId: totp.id })
  }

  /* ── TOTP setup ── */
  async function startTotp() {
    setError(''); setBusy(true)
    try {
      const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'ZimLearn' })
      if (err || !data) { setError(err?.message ?? 'Failed to start setup'); return }
      setEnrollId(data.id); setQrUrl(data.totp.qr_code); setSecret(data.totp.secret)
      setStep('totp-qr')
      setTimeout(() => totpRef.current?.focus(), 100)
    } finally { setBusy(false) }
  }

  async function confirmTotp(e: React.FormEvent) {
    e.preventDefault()
    if (totpCode.length !== 6) return
    setBusy(true); setError('')
    try {
      const { data: challenge, error: chalErr } = await supabase.auth.mfa.challenge({ factorId: enrollId })
      if (chalErr || !challenge) { setError(chalErr?.message ?? 'Challenge failed'); return }
      const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId: enrollId, challengeId: challenge.id, code: totpCode })
      if (verifyErr) { setError('Incorrect code — try again'); setTotpCode(''); totpRef.current?.focus(); return }
      await saveMethod('totp')
      setSuccess('Authenticator app is now active!')
      resetState()
    } finally { setBusy(false) }
  }

  /* ── Email OTP setup ── */
  async function enableEmail() {
    setBusy(true); setError('')
    try {
      await unenrollTotp()
      await saveMethod('email')
      setSuccess('Email verification is now active!')
      resetState()
    } finally { setBusy(false) }
  }

  /* ── Phone/SMS OTP setup ── */
  async function sendPhoneOtp() {
    if (!phone.trim()) { setError('Enter a phone number first'); return }
    setBusy(true); setError('')
    // Temporarily save phone but don't activate yet
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('profiles').update({ mfa_phone: phone.trim() }).eq('id', user.id)
    // Temporarily set method to phone so the send route allows it
    await supabase.from('profiles').update({ mfa_method: 'phone', mfa_phone: phone.trim() }).eq('id', (await supabase.auth.getUser()).data.user!.id)
    try {
      const res = await fetch('/api/auth/mfa/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'phone' }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error ?? 'Failed to send code'); return }
      setStep('phone-verify')
      setTimeout(() => phoneCodeRef.current?.focus(), 100)
    } finally { setBusy(false) }
  }

  async function confirmPhone(e: React.FormEvent) {
    e.preventDefault()
    if (phoneCode.length !== 6) return
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/auth/mfa/verify-custom', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'phone', code: phoneCode }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error ?? 'Incorrect code'); setPhoneCode(''); phoneCodeRef.current?.focus(); return }
      await unenrollTotp()
      await saveMethod('phone', phone.trim())
      setSuccess('SMS verification is now active!')
      resetState()
    } finally { setBusy(false) }
  }

  /* ── Disable MFA ── */
  async function disableMfa() {
    setBusy(true); setError('')
    try {
      await unenrollTotp()
      await saveMethod('none')
      setSuccess('Two-factor authentication has been disabled.')
      resetState()
    } finally { setBusy(false) }
  }

  /* ── Render ── */
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">

        <Link href="/student/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition mb-6">
          <ArrowLeft size={15} /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <KeyRound size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Security Settings</h1>
            <p className="text-sm text-gray-400">Choose how you verify your identity at login</p>
          </div>
        </div>

        {/* Success banner */}
        {success && (
          <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-5">
            <CheckCircle2 size={16} className="shrink-0" />{success}
          </div>
        )}

        {/* Error banner */}
        {error && step === 'choose' && (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm mb-5">
            <XCircle size={16} className="shrink-0" />{error}
          </div>
        )}

        {/* ── STEP: Choose method ── */}
        {step === 'choose' && (
          <div className="space-y-4">
            {/* Current status */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
              {currentMethod === 'none' ? (
                <><div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center"><ShieldOff size={20} className="text-amber-500" /></div>
                <div><p className="font-semibold text-gray-900 text-sm">2FA is <span className="text-amber-500">disabled</span></p><p className="text-xs text-gray-400">Your account is protected by password only</p></div></>
              ) : (
                <><div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><ShieldCheck size={20} className="text-green-600" /></div>
                <div><p className="font-semibold text-gray-900 text-sm">2FA is <span className="text-green-600">active</span></p>
                  <p className="text-xs text-gray-400">
                    Method: {currentMethod === 'totp' ? 'Authenticator App' : currentMethod === 'email' ? 'Email OTP' : 'Phone/SMS OTP'}
                  </p></div></>
              )}
            </div>

            {/* Method cards */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Choose a verification method</p>

            {/* Authenticator App */}
            <div className={`bg-white rounded-2xl shadow-sm border p-5 ${currentMethod === 'totp' ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-100'}`}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0"><QrCode size={20} className="text-indigo-600" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm">Authenticator App</p>
                    {currentMethod === 'totp' && <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Active</span>}
                    <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full ml-auto">Most Secure</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Use Google Authenticator, Authy, or any TOTP app. Works offline.</p>
                  <button
                    onClick={startTotp} disabled={busy}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-40 transition"
                  >
                    {currentMethod === 'totp' ? 'Re-configure →' : 'Set up →'}
                  </button>
                </div>
              </div>
            </div>

            {/* Email OTP */}
            <div className={`bg-white rounded-2xl shadow-sm border p-5 ${currentMethod === 'email' ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'}`}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0"><Mail size={20} className="text-blue-600" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm">Email OTP</p>
                    {currentMethod === 'email' && <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">Active</span>}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">A 6-digit code is sent to <strong>{userEmail}</strong> each time you sign in.</p>
                  <p className="text-xs text-gray-400 mb-3">Requires internet + access to your email inbox.</p>
                  <button
                    onClick={() => setStep('email-confirm')} disabled={busy}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-40 transition"
                  >
                    {currentMethod === 'email' ? 'Active — switch method ↓' : 'Enable →'}
                  </button>
                </div>
              </div>
            </div>

            {/* Phone/SMS OTP */}
            <div className={`bg-white rounded-2xl shadow-sm border p-5 ${currentMethod === 'phone' ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100'}`}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0"><Phone size={20} className="text-emerald-600" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm">Phone / SMS OTP</p>
                    {currentMethod === 'phone' && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Active</span>}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">A 6-digit code is sent via SMS to your mobile number.</p>
                  <p className="text-xs text-gray-400 mb-3">Works with any Zimbabwe number (EcoNet, NetOne, Telecel).</p>
                  <button
                    onClick={() => setStep('phone-enter')} disabled={busy}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 disabled:opacity-40 transition"
                  >
                    {currentMethod === 'phone' ? 'Change number →' : 'Enable →'}
                  </button>
                </div>
              </div>
            </div>

            {/* Disable */}
            {currentMethod !== 'none' && (
              <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-700 text-sm mb-0.5">Disable Two-Factor Authentication</p>
                    <p className="text-xs text-gray-500 mb-3">Your account will only be protected by your password.</p>
                    <button
                      onClick={disableMfa} disabled={busy}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-40 transition"
                    >
                      {busy ? <Loader2 size={12} className="animate-spin" /> : <ShieldOff size={12} />}
                      Disable 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP: TOTP QR ── */}
        {step === 'totp-qr' && (
          <div className="space-y-5">
            <button onClick={resetState} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
              <ArrowLeft size={14} /> Back
            </button>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
                <h3 className="font-semibold text-gray-900">Scan with your authenticator app</h3>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white border-2 border-indigo-100 rounded-2xl shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrUrl} alt="2FA QR code" width={180} height={180} />
                </div>
                <div className="w-full">
                  <p className="text-xs text-gray-400 text-center mb-2">Or enter this key manually:</p>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <code className="flex-1 text-xs font-mono text-gray-700 break-all select-all">{secret}</code>
                    <button type="button" onClick={async () => { await navigator.clipboard.writeText(secret); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="p-1.5 text-gray-400 hover:text-indigo-600 transition">
                      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
                <h3 className="font-semibold text-gray-900">Enter the 6-digit code to confirm</h3>
              </div>
              <form onSubmit={confirmTotp} className="space-y-4">
                <input
                  ref={totpRef} type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                  value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-2xl font-mono tracking-[0.4em] text-center placeholder:text-gray-300 placeholder:tracking-normal"
                />
                {error && <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm"><XCircle size={16} className="shrink-0" />{error}</div>}
                <button type="submit" disabled={busy || totpCode.length !== 6} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2">
                  {busy ? <><Loader2 size={18} className="animate-spin" /> Activating…</> : <><ShieldCheck size={18} /> Activate Authenticator App</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── STEP: Email confirm ── */}
        {step === 'email-confirm' && (
          <div className="space-y-5">
            <button onClick={resetState} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"><ArrowLeft size={14} /> Back</button>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4"><Mail size={24} className="text-blue-600" /></div>
              <h3 className="font-bold text-gray-900 mb-2">Enable Email OTP</h3>
              <p className="text-sm text-gray-500 mb-1">Each time you sign in, a 6-digit code will be emailed to:</p>
              <p className="text-sm font-semibold text-gray-900 mb-5">{userEmail}</p>
              {error && <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm mb-4"><XCircle size={16} className="shrink-0" />{error}</div>}
              <div className="flex gap-3">
                <button onClick={resetState} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition">Cancel</button>
                <button onClick={enableEmail} disabled={busy} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2">
                  {busy ? <><Loader2 size={15} className="animate-spin" /> Enabling…</> : <><Mail size={15} /> Enable Email OTP</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: Phone enter ── */}
        {step === 'phone-enter' && (
          <div className="space-y-5">
            <button onClick={resetState} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"><ArrowLeft size={14} /> Back</button>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4"><Phone size={24} className="text-emerald-600" /></div>
              <h3 className="font-bold text-gray-900 mb-2">Enable SMS OTP</h3>
              <p className="text-sm text-gray-500 mb-4">Enter your Zimbabwe mobile number. We&apos;ll send a code to verify it.</p>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Mobile Number</label>
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="07X XXX XXXX"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm"
                />
              </div>
              {error && <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm mb-4"><XCircle size={16} className="shrink-0" />{error}</div>}
              <div className="flex gap-3">
                <button onClick={resetState} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition">Cancel</button>
                <button onClick={sendPhoneOtp} disabled={busy || !phone.trim()} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2">
                  {busy ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : <><Phone size={15} /> Send Code</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: Phone verify ── */}
        {step === 'phone-verify' && (
          <div className="space-y-5">
            <button onClick={() => setStep('phone-enter')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"><ArrowLeft size={14} /> Back</button>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4"><Phone size={24} className="text-emerald-600" /></div>
              <h3 className="font-bold text-gray-900 mb-1">Verify your number</h3>
              <p className="text-sm text-gray-500 mb-5">Enter the 6-digit code sent to <strong>{phone}</strong></p>
              <form onSubmit={confirmPhone} className="space-y-4">
                <input
                  ref={phoneCodeRef} type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                  value={phoneCode} onChange={e => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-2xl font-mono tracking-[0.4em] text-center placeholder:text-gray-300 placeholder:tracking-normal"
                />
                {error && <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm"><XCircle size={16} className="shrink-0" />{error}</div>}
                <button type="submit" disabled={busy || phoneCode.length !== 6} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2">
                  {busy ? <><Loader2 size={18} className="animate-spin" /> Activating…</> : <><ShieldCheck size={18} /> Activate SMS OTP</>}
                </button>
                <button type="button" onClick={sendPhoneOtp} disabled={busy} className="w-full text-sm text-gray-400 hover:text-gray-600 disabled:opacity-40 transition">
                  Resend code
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
