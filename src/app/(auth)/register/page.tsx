import Link from 'next/link'
import { register } from '@/app/actions/auth'
import type { UserRole } from '@/types/database'
import { GraduationCap, Users, BookOpen, Shield, User, Zap } from 'lucide-react'
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton'

const ROLES: {
  value: UserRole
  label: string
  desc: string
  icon: React.ElementType
  gradient: string
  activeBg: string
  activeBorder: string
  activeText: string
}[] = [
  {
    value: 'student',
    label: 'Student',
    desc: 'I want to learn',
    icon: User,
    gradient: 'from-emerald-500 to-teal-600',
    activeBg: 'has-[:checked]:bg-emerald-50',
    activeBorder: 'has-[:checked]:border-emerald-500',
    activeText: 'has-[:checked]:text-emerald-700',
  },
  {
    value: 'teacher',
    label: 'Teacher',
    desc: 'I teach & create',
    icon: BookOpen,
    gradient: 'from-blue-500 to-indigo-600',
    activeBg: 'has-[:checked]:bg-blue-50',
    activeBorder: 'has-[:checked]:border-blue-500',
    activeText: 'has-[:checked]:text-blue-700',
  },
  {
    value: 'parent',
    label: 'Parent',
    desc: 'I monitor my child',
    icon: Users,
    gradient: 'from-purple-500 to-violet-600',
    activeBg: 'has-[:checked]:bg-purple-50',
    activeBorder: 'has-[:checked]:border-purple-500',
    activeText: 'has-[:checked]:text-purple-700',
  },
  {
    value: 'admin',
    label: 'Admin',
    desc: 'I manage platform',
    icon: Shield,
    gradient: 'from-gray-500 to-slate-600',
    activeBg: 'has-[:checked]:bg-gray-50',
    activeBorder: 'has-[:checked]:border-gray-500',
    activeText: 'has-[:checked]:text-gray-700',
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
        </div>

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
            Join thousands<br />
            <span className="text-emerald-300">of students</span>
          </h1>
          <p className="text-emerald-100 text-base leading-relaxed mb-10 opacity-90">
            Start your ZIMSEC journey with Zimbabwe&apos;s most advanced AI learning platform — completely free.
          </p>

          <div className="space-y-5">
            {[
              { emoji: '🎓', title: 'Personalised for ZIMSEC', desc: 'Content aligned with O-Level, A-Level and Primary curricula' },
              { emoji: '🤖', title: 'AI-powered learning', desc: 'Adaptive quizzes and an intelligent tutor that knows your weaknesses' },
              { emoji: '📊', title: 'Track your progress', desc: 'See topic mastery, streaks, XP and predicted grades' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="flex gap-3.5 items-start">
                <span className="text-2xl flex-shrink-0 mt-0.5">{emoji}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-emerald-300 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-emerald-500 text-xs">
          © {new Date().getFullYear()} ZimLearn · Empowering Zimbabwean students
        </p>
      </div>

      {/* ── Right panel: registration form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-gray-50">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-xl">ZimLearn</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Glass card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Zap size={13} className="text-white" />
                </div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Free forever</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
              <p className="text-gray-400 text-sm mt-1">Join ZimLearn today — it&apos;s free</p>
            </div>

            {searchParams.error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-start gap-2.5">
                <span className="flex-shrink-0 mt-0.5 text-red-400">⚠</span>
                <span>{searchParams.error}</span>
              </div>
            )}

            {/* Google OAuth */}
            <GoogleAuthButton label="Sign up with Google" />

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">or email</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <form
              action={register as unknown as (formData: FormData) => void}
              className="space-y-4"
            >
              <div>
                <label htmlFor="full_name" className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                  Full name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm placeholder:text-gray-300 hover:border-gray-300"
                  placeholder="Tatenda Moyo"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
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
                <label htmlFor="password" className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm placeholder:text-gray-300 hover:border-gray-300"
                  placeholder="Min. 8 characters"
                />
              </div>

              {/* Role picker */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2.5 uppercase tracking-wider">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <label
                      key={r.value}
                      className={`relative flex items-center gap-2.5 cursor-pointer border-2 border-gray-100 rounded-2xl p-3 hover:border-gray-200 transition-all duration-150 ${r.activeBg} ${r.activeBorder}`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        className="sr-only"
                        required
                        defaultChecked={r.value === 'student'}
                      />
                      <div className={`w-8 h-8 bg-gradient-to-br ${r.gradient} rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <r.icon size={14} className="text-white" />
                      </div>
                      <div>
                        <p className={`font-bold text-gray-900 text-sm leading-tight ${r.activeText}`}>{r.label}</p>
                        <p className="text-gray-400 text-[10px] leading-tight mt-0.5">{r.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 font-bold rounded-2xl transition-all duration-200 text-sm shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.01] active:scale-[0.99] text-white mt-1"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
              >
                Create account →
              </button>
            </form>
          </div>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-600 font-bold hover:text-emerald-700 transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
