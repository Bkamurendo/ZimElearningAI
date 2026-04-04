'use client'

import { useFormStatus } from 'react-dom'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { login } from '@/app/actions/auth'
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton'
import { FacebookAuthButton } from '@/components/auth/FacebookAuthButton'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

/* ── Submit button — reads pending state from parent form ── */
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3.5 font-bold rounded-2xl transition-all duration-200 text-sm shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 text-white mt-2"
      style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          Signing in…
        </span>
      ) : (
        'Sign in →'
      )}
    </button>
  )
}

/* ── Main login form (client component) ── */
export function LoginForm({
  error,
  successMessage,
}: {
  error?: string
  successMessage?: string
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="w-full max-w-sm">
      {/* Glass card */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-4">
            <Image src="/zimlearn-logo.svg" alt="ZimLearn" width={44} height={44} className="rounded-xl" />
            <div>
              <p className="font-extrabold text-gray-900 text-lg leading-tight">ZimLearn</p>
              <p className="text-xs text-emerald-600 font-medium">ZIMSEC E-Learning Platform</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
          <p className="text-gray-400 text-sm mt-1">Continue your learning journey</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-start gap-2.5">
            <span className="flex-shrink-0 mt-0.5 text-red-400">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success (e.g. password reset) */}
        {successMessage && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm flex items-start gap-2.5">
            <span className="flex-shrink-0 mt-0.5">✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Social auth */}
        <div className="space-y-3">
          <GoogleAuthButton label="Sign in with Google" />
          <FacebookAuthButton label="Sign in with Facebook" />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
            or email
          </span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <form
          action={login as unknown as (formData: FormData) => void}
          className="space-y-4"
        >
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm placeholder:text-gray-300 hover:border-gray-300"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="text-xs font-bold text-gray-600 uppercase tracking-wider"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 transition"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-11 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm placeholder:text-gray-300 hover:border-gray-300"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <SubmitButton />
        </form>

        {/* Terms note */}
        <p className="text-center text-[11px] text-gray-300 mt-5 leading-relaxed">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="hover:text-gray-500 underline transition">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="hover:text-gray-500 underline transition">
            Privacy Policy
          </Link>
        </p>
      </div>

      {/* Register link */}
      <div className="mt-5 text-center space-y-1.5">
        <p className="text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-emerald-600 font-bold hover:text-emerald-700 transition"
          >
            Create one free
          </Link>
        </p>
        <p className="text-xs text-gray-400">
          Are you a school?{' '}
          <Link href="/schools" className="text-indigo-600 font-semibold hover:text-indigo-700 transition">
            School licensing →
          </Link>
        </p>
      </div>
    </div>
  )
}
