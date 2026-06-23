export const dynamic = 'force-dynamic';
import { Sparkles, Brain, Target, BookOpen, CheckCircle } from 'lucide-react'
import { LoginForm } from './LoginForm'
import { PlatformTourButton } from '@/components/PlatformTourButton'

const SUCCESS_MESSAGES: Record<string, string> = {
  password_reset_success: 'Password updated successfully. Please sign in with your new password.',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string }
}) {
  const successMessage = searchParams.message
    ? SUCCESS_MESSAGES[searchParams.message]
    : undefined

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left panel: brand showcase ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[48%] p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #064e3b, #065f46, #047857, #059669)' }}
      >
        {/* Animated glow orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full animate-float"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full animate-float"
            style={{
              background: 'radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)',
              animationDelay: '1.5s',
            }}
          />
          <div
            className="absolute top-1/2 left-2/3 w-48 h-48 rounded-full animate-float"
            style={{
              background: 'radial-gradient(circle, rgba(110,231,183,0.15) 0%, transparent 70%)',
              animationDelay: '3s',
            }}
          />
        </div>

        {/* Top: logo + headline */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg shadow-black/20 border border-white/10">
              <Sparkles size={26} className="text-white" />
            </div>
            <div>
              <span className="text-white font-extrabold text-xl tracking-tight">ZimLearn<span className="text-emerald-300">AI</span></span>
              <p className="text-emerald-400 text-[11px] font-black uppercase tracking-widest">Official ZIMSEC AI</p>
            </div>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight uppercase italic">
            Meet MaFundi.<br />
            <span className="text-emerald-300">Your AI Teacher.</span>
          </h1>
          <p className="text-emerald-100 text-base font-medium leading-relaxed mb-10 opacity-90">
            Master the Zimbabwe Heritage-Based Curriculum with the platform trusted by over 100 students nationwide.
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

          {/* Platform tour CTA */}
          <div className="mt-8">
            <PlatformTourButton
              variant="banner"
              label="▶  Full platform tour — all features explained"
            />
          </div>

          {/* Stats row */}
          <div className="mt-6 flex items-center gap-4">
            {[
              { value: '103+', label: 'Students' },
              { value: '5K+', label: 'Topics' },
              { value: '98%', label: 'Accuracy' },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="flex-1 bg-white/5 rounded-2xl px-3 py-3 text-center border border-white/5 backdrop-blur-sm"
              >
                <p className="text-white font-black text-lg leading-tight uppercase tracking-tighter">{value}</p>
                <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: tagline */}
        <p className="relative z-10 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} ZimLearn AI · The Official ZIMSEC AI Teacher
        </p>
      </div>

      {/* ── Right panel: login form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200">
            <Sparkles size={20} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-xl">ZimLearn<span className="text-emerald-500">AI</span></span>
        </div>

        <LoginForm error={searchParams.error} successMessage={successMessage} />
      </div>
    </div>
  )
}
