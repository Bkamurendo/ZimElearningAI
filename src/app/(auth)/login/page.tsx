import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { GraduationCap, Brain, Target, BookOpen, CheckCircle } from 'lucide-react'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Left panel: brand showcase ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-green-700 via-green-800 to-emerald-900 p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/5 rounded-full" />
        </div>

        {/* Top: logo */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <GraduationCap size={24} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">ZimLearn</span>
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Learn smarter<br />with AI
          </h1>
          <p className="text-green-200 text-lg leading-relaxed mb-12">
            Zimbabwe&apos;s AI-powered ZIMSEC learning platform — built for students, teachers &amp; parents.
          </p>

          <div className="space-y-4">
            {[
              { icon: Brain, text: 'AI Tutor trained on the full ZIMSEC curriculum' },
              { icon: Target, text: 'Adaptive quizzes that track topic mastery' },
              { icon: BookOpen, text: 'Past papers with instant AI marking &amp; feedback' },
              { icon: CheckCircle, text: 'Study planner built around your exam dates' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-green-200" />
                </div>
                <span
                  className="text-green-100 text-sm"
                  dangerouslySetInnerHTML={{ __html: text }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: tagline */}
        <p className="relative text-green-400 text-xs">
          © {new Date().getFullYear()} ZimLearn · Empowering Zimbabwean students
        </p>
      </div>

      {/* ── Right panel: login form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-xl">ZimLearn</span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="text-gray-400 text-sm mt-1 mb-8">Sign in to continue learning</p>

          {searchParams.error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2.5">
              <span className="flex-shrink-0 mt-0.5 text-red-400">⚠</span>
              <span>{searchParams.error}</span>
            </div>
          )}

          <form
            action={login as unknown as (formData: FormData) => void}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm placeholder:text-gray-300"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm placeholder:text-gray-300"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-xl transition text-sm shadow-sm mt-2"
            >
              Sign in
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-green-600 font-semibold hover:text-green-700 transition"
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
