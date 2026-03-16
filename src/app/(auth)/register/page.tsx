import Link from 'next/link'
import { register } from '@/app/actions/auth'
import type { UserRole } from '@/types/database'
import { GraduationCap, Users, BookOpen, Shield, User } from 'lucide-react'

const ROLES: {
  value: UserRole
  label: string
  desc: string
  icon: React.ElementType
  color: string
  activeBg: string
  activeBorder: string
}[] = [
  {
    value: 'student',
    label: 'Student',
    desc: 'I want to learn',
    icon: User,
    color: 'text-green-600',
    activeBg: 'has-[:checked]:bg-green-50',
    activeBorder: 'has-[:checked]:border-green-500',
  },
  {
    value: 'teacher',
    label: 'Teacher',
    desc: 'I teach & create content',
    icon: BookOpen,
    color: 'text-blue-600',
    activeBg: 'has-[:checked]:bg-blue-50',
    activeBorder: 'has-[:checked]:border-blue-500',
  },
  {
    value: 'parent',
    label: 'Parent',
    desc: 'I monitor my child',
    icon: Users,
    color: 'text-purple-600',
    activeBg: 'has-[:checked]:bg-purple-50',
    activeBorder: 'has-[:checked]:border-purple-500',
  },
  {
    value: 'admin',
    label: 'Admin',
    desc: 'I manage the platform',
    icon: Shield,
    color: 'text-gray-600',
    activeBg: 'has-[:checked]:bg-gray-50',
    activeBorder: 'has-[:checked]:border-gray-500',
  },
]

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-green-700 via-green-800 to-emerald-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <GraduationCap size={24} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">ZimLearn</span>
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Join thousands<br />of students
          </h1>
          <p className="text-green-200 text-lg leading-relaxed mb-12">
            Start your ZIMSEC journey with Zimbabwe&apos;s most advanced AI learning platform — completely free.
          </p>

          <div className="space-y-5">
            {[
              { emoji: '🎓', title: 'Personalised for ZIMSEC', desc: 'Content aligned with O-Level, A-Level and Primary curricula' },
              { emoji: '🤖', title: 'AI-powered learning', desc: 'Adaptive quizzes and an intelligent tutor that knows your weaknesses' },
              { emoji: '📊', title: 'Track your progress', desc: 'See topic mastery, streaks, XP and predicted grades' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="flex gap-3">
                <span className="text-2xl flex-shrink-0">{emoji}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-green-300 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-green-400 text-xs">
          © {new Date().getFullYear()} ZimLearn · Empowering Zimbabwean students
        </p>
      </div>

      {/* ── Right panel: registration form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-xl">ZimLearn</span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
          <p className="text-gray-400 text-sm mt-1 mb-7">Join ZimLearn today — it&apos;s free</p>

          {searchParams.error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2.5">
              <span className="flex-shrink-0 mt-0.5 text-red-400">⚠</span>
              <span>{searchParams.error}</span>
            </div>
          )}

          <form
            action={register as unknown as (formData: FormData) => void}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="full_name"
                className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide"
              >
                Full name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm placeholder:text-gray-300"
                placeholder="Tatenda Moyo"
              />
            </div>

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
                minLength={8}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm placeholder:text-gray-300"
                placeholder="Min. 8 characters"
              />
            </div>

            {/* Role picker */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <label
                    key={r.value}
                    className={`relative flex items-center gap-2.5 cursor-pointer border-2 border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-all ${r.activeBg} ${r.activeBorder}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      className="sr-only"
                      required
                      defaultChecked={r.value === 'student'}
                    />
                    <r.icon size={16} className={r.color} />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{r.label}</p>
                      <p className="text-gray-400 text-[11px] leading-tight mt-0.5">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-xl transition text-sm shadow-sm mt-1"
            >
              Create account
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-green-600 font-semibold hover:text-green-700 transition"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
