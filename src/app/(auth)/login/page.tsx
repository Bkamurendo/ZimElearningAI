import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { GraduationCap, Brain, Target, BookOpen, CheckCircle, Zap } from 'lucide-react'
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left panel: brand showcase ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[48%] p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #064e3b, #065f46, #047857, #059669)' }}
      >
        {/* Animated glow orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full animate-float"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full animate-float"
            style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)', animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-2/3 w-48 h-48 rounded-full animate-float"
            style={{ background: 'radial-gradient(circle, rgba(110,231,183,0.15) 0%, transparent 70%)', animationDelay: '3s' }} />
        </div>

        {/* Top: logo + headline */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg shadow-black/20 border border-white/10">
              <GraduationCap size={26} className="text-white" />
            </div>
            <div>
              <span className="text-white font-extrabold text-xl tracking-tight">ZimLearn</span>
              <p className="text-emerald-300 text-[11px] font-medium">ZIMSEC AI Platform</p>
            </div>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            Learn smarter<br />
            <span className="text-emerald-300">with AI</span>
          </h1>
          <p className="text-emerald-100 text-base leading-relaxed mb-10 opacity-90">
            Zimbabwe&apos;s AI-powered ZIMSEC learning platform — built for students, teachers &amp; parents.
          </p>

          {/* Feature cards */}
          <div className="space-y-3">
            {[
              { icon: Brain,       text: 'AI Tutor trained on the full ZIMSEC curriculum' },
              { icon: Target,      text: 'Adaptive quizzes that track your topic mastery' },
              { icon: BookOpen,    text: 'Past papers with instant AI marking &amp; feedback' },
              { icon: CheckCircle, text: 'Study planner built around your exam dates' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 group">
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all">
                  <Icon size={16} className="text-emerald-300" />
                </div>
                <span
                  className="text-emerald-50 text-sm font-medium"
                  dangerouslySetInnerHTML={{ __html: text }}
                />
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="mt-10 flex items-center gap-4">
            {[
              { value: '10K+', label: 'Students' },
              { value: '500+', label: 'Lessons' },
              { value: '4.9★', label: 'Rating' },
            ].map(({ value, label }) => (
              <div key={label} className="flex-1 bg-white/10 rounded-2xl px-3 py-3 text-center border border-white/10 backdrop-blur-sm">
                <p className="text-white font-bold text-lg leading-tight">{value}</p>
                <p className="text-emerald-300 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: tagline */}
        <p className="relative z-10 text-emerald-500 text-xs">
          © {new Date().getFullYear()} ZimLearn · Empowering Zimbabwean students
        </p>
      </div>

      {/* ── Right panel: login form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-xl">ZimLearn</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Glass card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Zap size={13} className="text-white" />
                </div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Welcome back</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Sign in to ZimLearn</h2>
              <p className="text-gray-400 text-sm mt-1">Continue your learning journey</p>
            </div>

            {searchParams.error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-start gap-2.5">
                <span className="flex-shrink-0 mt-0.5 text-red-400">⚠</span>
                <span>{searchParams.error}</span>
              </div>
            )}

            {/* Google OAuth */}
            <GoogleAuthButton label="Sign in with Google" />

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">or email</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <form
              action={login as unknown as (formData: FormData) => void}
              className="space-y-4"
            >
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

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm placeholder:text-gray-300 hover:border-gray-300"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 font-bold rounded-2xl transition-all duration-200 text-sm shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.01] active:scale-[0.99] text-white mt-2"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
              >
                Sign in →
              </button>
            </form>
          </div>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-emerald-600 font-bold hover:text-emerald-700 transition"
              >
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
