import Link from 'next/link'
import {
  Package, CheckCircle, BookOpen, Bot, Share2,
  Download, ArrowRight, Star, Users, Sparkles,
  GraduationCap, FlaskConical, Globe,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SBP Packages — ZIMSEC School-Based Project Generator | ZimLearn AI',
  description:
    'Get a complete, ZIMSEC-compliant School-Based Project package for any subject, form level, and topic. Aligned to the Heritage-Based Curriculum 2024–2030. Powered by MaFundi AI.',
}

const SUBJECTS = [
  'Agriculture', 'Biology', 'Chemistry', 'Physics', 'Geography',
  'History', 'Computer Science', 'Business Studies', 'Heritage Studies',
  'Food & Nutrition', 'Building Technology', 'Entrepreneurship',
]

const FEATURES = [
  {
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950/20',
    title: 'ZIMSEC SBP Guidelines Compliant',
    desc: 'Every package follows the official ZIMSEC SBP marking framework and submission structure.',
  },
  {
    icon: Globe,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    title: 'Heritage-Based Curriculum 2024–2030',
    desc: 'All projects are grounded in Zimbabwe\'s HBC framework — local context, community problems, heritage themes.',
  },
  {
    icon: FlaskConical,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    title: 'All 5 SBP Stages Covered',
    desc: 'Proposal → Research → Planning → Implementation → Evaluation — a complete annotated example for each stage.',
  },
  {
    icon: Bot,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    title: 'MaFundi AI Annotations',
    desc: 'Each section includes teacher annotations explaining what ZIMSEC markers look for and why the example scores well.',
  },
  {
    icon: Share2,
    color: 'text-[#25D366]',
    bg: 'bg-green-50 dark:bg-green-950/20',
    title: 'Share via WhatsApp',
    desc: 'Send the package summary directly to your students, parents, or your own phone — one tap.',
  },
  {
    icon: Download,
    color: 'text-slate-500',
    bg: 'bg-slate-50 dark:bg-slate-800',
    title: 'Download for Offline Use',
    desc: 'Save the full package as a text file to read, print, or share without internet access.',
  },
]

const PLANS = [
  {
    name: 'Starter',
    price: 'USD 3',
    period: '/month',
    color: 'border-blue-200 dark:border-blue-700',
    badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    cta: 'bg-blue-600 hover:bg-blue-700 text-white',
    perks: ['Unlimited SBP Packages', 'All subjects & form levels', 'WhatsApp share', 'Download as text', 'AI guidance (limited)'],
  },
  {
    name: 'Pro',
    price: 'USD 7',
    period: '/month',
    color: 'border-amber-300 dark:border-amber-600 ring-2 ring-amber-400',
    badge: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
    cta: 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white',
    highlight: true,
    perks: ['Everything in Starter', 'Unlimited AI tutor sessions', 'Past papers & resources', 'Study planner', 'Grade predictor'],
  },
  {
    name: 'Elite',
    price: 'USD 12',
    period: '/month',
    color: 'border-purple-300 dark:border-purple-700',
    badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    cta: 'bg-purple-600 hover:bg-purple-700 text-white',
    perks: ['Everything in Pro', 'Priority AI responses', 'School-Based Project coaching', 'Parent monitoring dashboard', 'Exam performance alerts'],
  },
]

export default function SbpPackagesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">ZimLearn AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-all"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-slate-950 pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <Package size={14} />
            ZIMSEC SBP Packages — Now on ZimLearn AI
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
            Complete SBP Packages for<br />
            <span className="text-green-600 dark:text-green-400">Any Subject. Any Form. Any Topic.</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
            MaFundi generates a full, ZIMSEC-compliant School-Based Project example — all 5 stages, annotated, Heritage-Based Curriculum aligned. Pick your subject, form level, and topic. Get your SBP document instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-all shadow-lg shadow-green-500/20"
            >
              <Package size={18} />
              Get Your SBP Package <ArrowRight size={16} />
            </Link>
            <Link
              href="/student/projects/examples"
              className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium px-8 py-4 rounded-2xl text-base border border-slate-200 dark:border-slate-700 transition-all"
            >
              <BookOpen size={18} />
              View Free Examples
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> ZIMSEC Guidelines Compliant</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> HBC 2024–2030 Aligned</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> Forms 1–6 Covered</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> Share via WhatsApp</span>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">What's in Every SBP Package</h2>
            <p className="text-slate-600 dark:text-slate-400">A complete annotated model project — everything a student needs to understand what excellent SBP work looks like</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon size={18} className={color} />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Covers All Subjects & Syllabus Requirements</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-10">Primary (Grades 5–7), O-Level (Forms 1–4), and A-Level (Forms 5–6)</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {SUBJECTS.map(s => (
              <span key={s} className="px-4 py-2 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 text-sm font-medium rounded-full border border-green-200 dark:border-green-800">
                {s}
              </span>
            ))}
            <span className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm rounded-full border border-slate-200 dark:border-slate-700">
              + 35 more subjects
            </span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Pick Your Details', desc: 'Select your subject, form level, and enter your project topic. Choose a Heritage theme for extra marks.' },
              { step: '2', title: 'MaFundi Generates', desc: 'Our AI teacher writes a complete 5-stage example project in 20–30 seconds, with annotations explaining every section.' },
              { step: '3', title: 'Download or Share', desc: 'Save your package as a text file or share it directly on WhatsApp — to yourself, a student, or a parent.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-green-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">For Teachers & Learners</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Users size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">For Teachers</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                {[
                  'Generate model projects to show students what excellence looks like',
                  'Create assignment brief templates aligned to HBC',
                  'Save time preparing SBP orientation materials',
                  'Share packages with your class via WhatsApp',
                  'Use annotations as marking guide reference',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <GraduationCap size={18} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">For Students</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                {[
                  'See exactly how a full SBP should be structured',
                  'Understand what ZIMSEC markers look for at each stage',
                  'Get a topic-specific starting point for your own research',
                  'Learn how to connect your work to heritage themes',
                  'Start your own project with confidence',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Simple Pricing</h2>
            <p className="text-slate-600 dark:text-slate-400">SBP Packages are included in all paid plans — no per-package fees</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PLANS.map(({ name, price, period, color, badge, cta, highlight, perks }) => (
              <div key={name} className={`bg-white dark:bg-slate-900 rounded-2xl border ${color} p-6 relative`}>
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                      <Star size={10} /> Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{name}</span>
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{price}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm">{period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {perks.map(p => (
                    <li key={p} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center font-semibold py-2.5 rounded-xl transition-all text-sm ${cta}`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-green-600 to-emerald-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Sparkles size={28} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Ready to Generate Your SBP Package?</h2>
          <p className="text-green-100 mb-8">
            Join ZimLearn AI and get instant access to MaFundi's SBP Package Generator — aligned to the Heritage-Based Curriculum 2024–2030.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-green-700 hover:bg-green-50 font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-lg"
          >
            <Package size={18} />
            Start Free — Get Your First Package <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-400">
        <p>© 2026 ZimLearn AI · Zimbabwe's AI Teacher for ZIMSEC & the Heritage-Based Curriculum</p>
        <p className="mt-1 text-xs">
          SBP Packages are model examples for guidance only. Students must write original work based on their own community and observations.
        </p>
      </footer>
    </div>
  )
}
