export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Bot, HelpCircle, FileText, BookOpen, ChevronRight, CheckCircle } from 'lucide-react'

const FIRST_STEPS = [
  {
    icon: Bot,
    color: 'from-emerald-400 to-teal-600',
    bg: 'bg-emerald-50 border-emerald-100',
    textColor: 'text-emerald-700',
    title: 'Ask MaFundi anything',
    description: 'Your AI teacher knows every ZIMSEC topic. Ask a question, get a step-by-step explanation right now.',
    cta: 'Chat with MaFundi',
    href: '/student/ai-teacher',
    highlight: true,
  },
  {
    icon: HelpCircle,
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 border-violet-100',
    textColor: 'text-violet-700',
    title: 'Test yourself with a quiz',
    description: 'Generate 5 ZIMSEC-style questions on any topic in seconds. See which areas need work.',
    cta: 'Take a Quiz',
    href: '/student/quiz',
    highlight: false,
  },
  {
    icon: FileText,
    color: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50 border-amber-100',
    textColor: 'text-amber-700',
    title: 'Study past papers',
    description: 'Access real ZIMSEC past papers for your subjects. Practise with actual exam questions.',
    cta: 'Browse Past Papers',
    href: '/student/resources?filter=past_paper',
    highlight: false,
  },
]

export default async function WelcomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: sp } = await supabase
    .from('student_profiles')
    .select('id, zimsec_level, grade')
    .eq('user_id', user.id)
    .single()

  const { data: enrolments } = await supabase
    .from('student_subjects')
    .select('subjects(name)')
    .eq('student_id', sp?.id ?? '')

  const subjectNames = (enrolments ?? [])
    .map((e: any) => e.subjects?.name)
    .filter(Boolean) as string[]

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Student'
  const level = sp?.zimsec_level === 'olevel' ? 'O-Level' : sp?.zimsec_level === 'alevel' ? 'A-Level' : 'Primary'

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 flex flex-col items-center justify-start px-4 py-12"
      style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>

      <div className="w-full max-w-lg">

        {/* Success header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            You&apos;re all set, {firstName}!
          </h1>
          <p className="text-slate-500 text-sm">
            {level} · {sp?.grade}
          </p>

          {/* Enrolled subjects pills */}
          {subjectNames.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {subjectNames.map(name => (
                <span key={name} className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full shadow-sm">
                  <CheckCircle size={11} className="text-emerald-500" />
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* What to do next */}
        <div className="space-y-3 mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-4">
            Start with one of these
          </p>

          {FIRST_STEPS.map((step) => {
            const Icon = step.icon
            return (
              <Link key={step.href} href={step.href}
                className={`flex items-center gap-4 bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all group ${step.highlight ? 'ring-2 ring-emerald-300' : ''}`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Icon size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm">{step.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{step.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${step.bg} ${step.textColor} border whitespace-nowrap`}>
                    {step.cta}
                  </span>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Study library link */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen size={18} className="text-slate-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700">Explore the Study Library</p>
            <p className="text-xs text-slate-400">Notes, textbooks and resources uploaded by teachers</p>
          </div>
          <Link href="/student/resources" className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition flex items-center gap-1">
            Browse <ChevronRight size={12} />
          </Link>
        </div>

        {/* Dashboard link */}
        <div className="text-center mt-6">
          <Link href="/student/dashboard" className="text-xs text-slate-400 hover:text-slate-600 transition">
            Go to dashboard →
          </Link>
        </div>
      </div>
    </div>
  )
}
