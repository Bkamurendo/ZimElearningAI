export const dynamic = 'force-dynamic';
import Link from 'next/link'
import { register } from '@/app/actions/auth'
import type { UserRole } from '@/types/database'
import { GraduationCap, Users, BookOpen, User, Zap } from 'lucide-react'
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton'
import { FacebookAuthButton } from '@/components/auth/FacebookAuthButton'
import { PlatformTourButton } from '@/components/PlatformTourButton'

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
]

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { error?: string; ref?: string }
}) {
  const refCode = searchParams.ref ?? ''
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[40%] p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b, #334155)' }}
      >
        {/* Animated glow orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles size={26} className="text-white" />
            </div>
            <span className="text-white font-black text-2xl tracking-tight uppercase italic">ZimLearn<span className="text-emerald-500">AI</span></span>
          </div>

          <h1 className="text-5xl font-black text-white leading-tight mb-6 tracking-tight uppercase italic">
            Unlock your<br />
            <span className="text-emerald-500 italic">True Potential.</span>
          </h1>
          
          <div className="space-y-8 mt-12">
            {[
              { icon: Zap, title: 'Instant Mastery', desc: 'MaFundi identifies your gaps in seconds.' },
              { icon: Globe, title: 'National Standard', desc: 'Used by top schools across Zimbabwe.' },
              { icon: Star, title: 'Elite Performance', desc: '94% of our students improve their grades within 30 days.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-all duration-300">
                  <item.icon size={20} className="text-emerald-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-white font-black uppercase text-sm tracking-widest">{item.title}</p>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
             © {new Date().getFullYear()} ZimLearn AI
           </p>
           <PlatformTourButton variant="outline" label="Watch Tour" />
        </div>
      </div>

      {/* ── Right panel: World-Class Onboarding ── */}
      <div className="flex-1 overflow-y-auto">
        <RegisterClient error={searchParams.error} />
      </div>

    </div>
  )
}
