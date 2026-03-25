'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  GraduationCap, CheckCircle2, Building2, Users, BarChart3,
  BookOpen, Zap, Crown, Star, ArrowRight, Phone, Mail,
  Globe, ChevronDown, ChevronUp,
} from 'lucide-react'

// ── Pricing tiers ────────────────────────────────────────────────────────────

const SCHOOL_PLANS = [
  {
    id: 'basic',
    name: 'School Basic',
    price: '$50',
    period: '/month',
    annualNote: null,
    students: 'Up to 50 students',
    badge: null,
    color: 'border-blue-200',
    headerBg: 'from-blue-500 to-blue-700',
    icon: <Building2 size={22} className="text-white" />,
    features: [
      'Up to 50 student accounts',
      '5 teacher accounts',
      'Full MaFundi AI access (Pro tier) for all students',
      'Class & subject management',
      'Teacher lesson planner & gradebook',
      'Assignment & quiz tools',
      'Student progress reports',
      'Admin dashboard',
      'Email support',
    ],
    notIncluded: [
      'Unlimited student seats',
      'School branding / white-label',
      'Dedicated account manager',
    ],
  },
  {
    id: 'pro',
    name: 'School Pro',
    price: '$120',
    period: '/month',
    annualNote: 'or $1,000/year (save 31%)',
    students: 'Unlimited students',
    badge: 'Most Popular',
    color: 'border-indigo-400 ring-2 ring-indigo-400',
    headerBg: 'from-indigo-500 to-purple-600',
    icon: <Crown size={22} className="text-white" />,
    features: [
      'Unlimited student accounts',
      'Unlimited teacher accounts',
      'Elite tier AI for all students (priority model)',
      'Parent dashboard — parents see child progress',
      'Full admin analytics & audit logs',
      'Custom school branding',
      'SBP (School-Based Projects) full module',
      'Exam timetable management',
      'Question bank & mock exam generator',
      'Bulk student import (CSV)',
      'Priority email + WhatsApp support',
      'Dedicated account manager',
    ],
    notIncluded: [],
  },
]

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'How does school licensing work?',
    a: 'You purchase a school plan and get a school admin account. You can create student and teacher accounts in bulk. Students log in normally — they just see your school\'s branding.',
  },
  {
    q: 'Can students also have individual accounts?',
    a: 'Yes. Students with existing personal accounts can be linked to a school. The school subscription upgrades their access automatically.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'EcoCash, OneMoney, InnBucks, ZimSwitch, bank transfer, or USD cash. We can also invoice for annual plans.',
  },
  {
    q: 'Is there a free trial for schools?',
    a: 'Yes — we offer a 30-day pilot for up to 50 students at no cost. Contact us to set it up. No credit card required.',
  },
  {
    q: 'Do teachers pay separately?',
    a: 'No. Teacher accounts are included in the school plan — no extra charge per teacher.',
  },
  {
    q: 'Can we get a demo before signing up?',
    a: 'Absolutely. We can come to your school or do a Zoom walkthrough with your headmaster and HODs. Contact us to book.',
  },
]

// ── Components ───────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className="w-full text-left bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-indigo-200 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-gray-900 text-sm">{q}</p>
        {open ? <ChevronUp size={16} className="text-gray-400 mt-0.5 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />}
      </div>
      {open && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{a}</p>}
    </button>
  )
}

// ── Inquiry Form ──────────────────────────────────────────────────────────────

function InquiryForm() {
  const [form, setForm] = useState({ name: '', role: '', school: '', phone: '', email: '', students: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/schools/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
        <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
        <h3 className="font-bold text-gray-900 text-lg mb-1">Thank you! We&apos;ll be in touch.</h3>
        <p className="text-sm text-gray-600">Expect a call or WhatsApp message within 24 hours on school days.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Your Name *</label>
          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Mr Chinyama" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Your Role *</label>
          <select required value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">Select...</option>
            <option>Headmaster / Headmistress</option>
            <option>Deputy Headmaster</option>
            <option>Head of Department</option>
            <option>Teacher</option>
            <option>School Administrator</option>
            <option>Parent / Guardian</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">School Name *</label>
        <input required value={form.school} onChange={e => setForm(f => ({ ...f, school: e.target.value }))}
          placeholder="e.g. St. George's College, Harare" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Phone / WhatsApp *</label>
          <input required type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="+263 78 517 0918" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="headmaster@school.ac.zw" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Approx. Number of Students</label>
        <select value={form.students} onChange={e => setForm(f => ({ ...f, students: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">Select range...</option>
          <option>Under 50</option>
          <option>50 – 150</option>
          <option>150 – 300</option>
          <option>300 – 600</option>
          <option>600+</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Message (optional)</label>
        <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          rows={3} placeholder="Any questions or specific requirements..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600">Something went wrong. Please WhatsApp us directly.</p>
      )}

      <button type="submit" disabled={status === 'sending'}
        className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
        {status === 'sending' ? 'Sending...' : (<>Request Free Pilot <ArrowRight size={16} /></>)}
      </button>
      <p className="text-xs text-center text-gray-400">No payment required for pilot. We&apos;ll contact you within 24 hours.</p>
    </form>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SchoolsPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">ZimLearn</span>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full ml-1">For Schools</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition">Log in</Link>
            <a href="#contact" className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition">
              Book a Demo
            </a>
          </div>
        </div>
      </nav>

      <div className="pt-16">

        {/* ── Hero ── */}
        <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-6">
              <Star size={14} fill="currentColor" /> Trusted by schools across Zimbabwe
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
              Give Every Student a<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #34d399, #6366f1)' }}>
                24/7 AI Tutor
              </span>
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
              ZimLearn brings ZIMSEC-aligned AI teaching to your entire school — for less than the cost of one private tutor session per month.
              Improve results, reduce teacher workload, and give parents real visibility.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="#contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                Request Free 30-Day Pilot <ArrowRight size={16} />
              </a>
              <a href="#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-slate-300 border border-slate-600 hover:border-slate-400 transition text-sm">
                View Pricing
              </a>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="bg-white border-b border-gray-100 py-10 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: '$2', label: 'per student/month (Pro plan)' },
              { value: '24/7', label: 'AI tutor availability' },
              { value: '30+', label: 'ZIMSEC subjects covered' },
              { value: '0 extra', label: 'cost per teacher account' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-indigo-600">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── What schools get ── */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Everything your school needs</h2>
            <p className="text-sm text-gray-500 text-center mb-10">One platform for students, teachers, parents, and admin</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: <Zap size={20} className="text-indigo-500" />, title: 'MaFundi AI Teacher', desc: 'Students get instant, personalised ZIMSEC-aligned answers 24/7. Like a private tutor for every learner.' },
                { icon: <BookOpen size={20} className="text-emerald-500" />, title: 'Lesson Planner', desc: 'Teachers generate complete, structured lesson plans in minutes. Aligned to the ZIMSEC curriculum.' },
                { icon: <BarChart3 size={20} className="text-blue-500" />, title: 'Admin Analytics', desc: 'Headmasters see school-wide progress, subject performance, and AI usage at a glance.' },
                { icon: <Users size={20} className="text-purple-500" />, title: 'Parent Dashboard', desc: 'Parents see exactly what their child studied, how they scored, and where they need help.' },
                { icon: <Crown size={20} className="text-amber-500" />, title: 'Question Bank & Exams', desc: 'Generate mock ZIMSEC exams, quizzes, and past-paper-style questions by topic.' },
                { icon: <Globe size={20} className="text-teal-500" />, title: 'School Branding', desc: 'Pro plan schools get their name and logo on the platform. Looks like your own system.' },
              ].map(f => (
                <div key={f.title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-3">{f.icon}</div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">School Pricing</h2>
            <p className="text-sm text-gray-500 text-center mb-10">
              All plans include a <strong>30-day free pilot</strong>. Pay only when you&apos;re satisfied.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {SCHOOL_PLANS.map(plan => (
                <div key={plan.id} className={`rounded-2xl border-2 ${plan.color} overflow-hidden relative`}>
                  {plan.badge && (
                    <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      {plan.badge}
                    </div>
                  )}
                  <div className={`bg-gradient-to-r ${plan.headerBg} p-5 text-white`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">{plan.icon}</div>
                      <div>
                        <p className="font-bold text-sm">{plan.name}</p>
                        <p className="text-xs text-white/70">{plan.students}</p>
                      </div>
                    </div>
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-extrabold">{plan.price}</span>
                      <span className="text-sm text-white/70 mb-0.5">{plan.period}</span>
                    </div>
                    {plan.annualNote && <p className="text-xs text-white/60 mt-0.5">{plan.annualNote}</p>}
                  </div>
                  <div className="p-5 space-y-2">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                    {plan.notIncluded.map(f => (
                      <div key={f} className="flex items-start gap-2 text-sm text-gray-400">
                        <div className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 rounded-full border border-gray-300" />
                        {f}
                      </div>
                    ))}
                    <a href="#contact" className="block mt-4 w-full text-center py-2.5 rounded-xl font-bold text-sm border-2 border-indigo-400 text-indigo-600 hover:bg-indigo-50 transition">
                      Request Free Pilot
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Per-student comparison */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 text-center">
              <p className="text-sm font-semibold text-indigo-800 mb-1">Cost comparison for a 300-student school</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-3 text-sm">
                <div className="bg-white rounded-xl px-5 py-3 border border-indigo-100">
                  <p className="font-bold text-gray-900">ZimLearn School Pro</p>
                  <p className="text-2xl font-extrabold text-indigo-600">$0.40</p>
                  <p className="text-xs text-gray-500">per student/month</p>
                </div>
                <p className="text-gray-400 font-semibold">vs</p>
                <div className="bg-white rounded-xl px-5 py-3 border border-gray-100">
                  <p className="font-bold text-gray-900">Private Tutor</p>
                  <p className="text-2xl font-extrabold text-gray-700">$10–$30</p>
                  <p className="text-xs text-gray-500">per hour, per student</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {FAQS.map(faq => <FAQItem key={faq.q} {...faq} />)}
            </div>
          </div>
        </section>

        {/* ── Contact / Inquiry form ── */}
        <section id="contact" className="py-16 px-4 bg-white">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Your Free 30-Day Pilot</h2>
              <p className="text-sm text-gray-500">Fill in the form and we will contact you within 24 hours. No payment required.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <InquiryForm />
            </div>

            {/* Direct contact options */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              {[
                { icon: <Phone size={18} className="text-emerald-500" />, label: 'WhatsApp', value: '+263 78 517 0918' },
                { icon: <Mail size={18} className="text-blue-500" />, label: 'Email', value: 'schools@zimlearn.co.zw' },
                { icon: <Globe size={18} className="text-indigo-500" />, label: 'Website', value: 'zim-elearningai.co.zw' },
              ].map(c => (
                <div key={c.label} className="flex flex-col items-center gap-1 py-3">
                  {c.icon}
                  <p className="text-xs font-semibold text-gray-700">{c.label}</p>
                  <p className="text-xs text-gray-500">{c.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} ZimLearn. Built for Zimbabwe&apos;s students, teachers, and schools.</p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/login" className="hover:text-white transition">Student Login</Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
