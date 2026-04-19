import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_completed')
      .eq('id', user.id)
      .single()
    if (!profile?.onboarding_completed) redirect('/onboarding')
    redirect(`/${profile.role}/dashboard`)
  }

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇿🇼</span>
            <div>
              <span className="font-black text-gray-900 text-lg leading-none block">ZimLearn AI</span>
              <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide leading-none">Zimbabwe&apos;s AI Teacher</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <Link href="/schools" className="hover:text-gray-900 transition-colors">For Schools</Link>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#about" className="hover:text-gray-900 transition-colors">About</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link href="/login" className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white pt-20 pb-24 px-4 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/60 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
            Built for ZIMSEC · Trained on the Heritage-Based Curriculum
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 leading-[1.05] tracking-tight mb-6">
            Meet MaFundi.<br />
            <span className="text-emerald-600">Your AI Teacher.</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
            An AI teacher trained on Zimbabwe&apos;s Heritage-Based Curriculum and the full ZIMSEC syllabus — from ECD through A&apos;Level. Study any subject, practise real past papers, and get instant feedback, any time of day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-emerald-200"
            >
              Start learning free
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-700 text-base font-medium px-8 py-4 rounded-xl transition-colors"
            >
              <span className="text-lg">▶</span> Watch the 2-minute tour
            </a>
          </div>
          <p className="mt-6 text-sm text-gray-400">
            Trusted by learners in Harare, Bulawayo, Binga, Gweru and beyond.
          </p>
        </div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-gray-50 py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { stat: '103+', label: 'Zimbabwean learners already studying' },
            { stat: '5,000+', label: 'Syllabus topics covered' },
            { stat: 'All 3 levels', label: 'ECD · O\'Level · A\'Level' },
          ].map(({ stat, label }) => (
            <div key={stat}>
              <div className="text-2xl sm:text-3xl font-black text-gray-900">{stat}</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              Everything a Zimbabwean learner needs, in one app.
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Most AI tutors were built for American or British schools. MaFundi was built for ours.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🤖',
                title: 'MaFundi, your AI Teacher',
                desc: 'A 24/7 tutor that explains any topic in your syllabus, answers your questions, and shows worked examples — as many times as you need, without judgement.',
              },
              {
                icon: '🧠',
                title: 'Adaptive quizzes that know what you know',
                desc: 'Quizzes that track which topics you\'ve mastered and which need more work, so your study time goes exactly where it counts.',
              },
              {
                icon: '📝',
                title: 'Real past papers, marked instantly',
                desc: 'Practise with actual ZIMSEC past papers and get instant AI marking with personalised feedback — not just a score, but what to do next.',
              },
              {
                icon: '📅',
                title: 'A study plan built around your exam dates',
                desc: 'Tell MaFundi when you sit your exams and what subjects you\'re writing. Get a personalised study timetable that adapts as you progress.',
              },
              {
                icon: '📱',
                title: 'Works on the phone you already have',
                desc: 'Built mobile-first for real Zimbabwean conditions — runs on modest Android phones and respects your data.',
              },
              {
                icon: '🏛️',
                title: 'Rooted in the Heritage-Based Curriculum',
                desc: 'From Shona grammar to Great Zimbabwe, from indigenous knowledge systems to the Zimbabwean economy — MaFundi answers in the context your examiners are actually testing.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-gray-50 rounded-2xl p-6 hover:bg-emerald-50 transition-colors group">
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-emerald-50 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            Start studying in under a minute.
          </h2>
          <p className="text-gray-500 mb-16 text-lg">No complicated setup. No downloads required.</p>
          <div className="grid sm:grid-cols-3 gap-8 text-left mb-12">
            {[
              {
                step: '01',
                title: 'Create your free account',
                desc: 'Tell us your level (ECD, Primary, O\'Level, or A\'Level) and your subjects.',
              },
              {
                step: '02',
                title: 'Meet MaFundi',
                desc: 'Ask your first question, take a diagnostic quiz, or jump straight into a past paper.',
              },
              {
                step: '03',
                title: 'Study with a plan',
                desc: 'Get a personalised study timetable built around your exam dates and topic mastery.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-4xl font-black text-emerald-200 mb-3">{step}</div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <Link href="/login" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-emerald-200">
            Create your free account →
          </Link>
        </div>
      </section>

      {/* ── WHO IT'S FOR ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 text-center mb-12">
            Built for every part of the learning family.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🎓', who: 'Learners', desc: 'Study smarter, not longer. A patient tutor on your phone, 24/7.' },
              { icon: '👨‍👩‍👧', who: 'Parents', desc: 'Give your child a reliable tutor without the cost of private lessons.' },
              { icon: '👩‍🏫', who: 'Teachers', desc: 'AI-assisted marking, lesson planning, and classroom resources.' },
              { icon: '🏫', who: 'Schools', desc: 'Every learner gets a personal tutor. School licensing available.', link: '/schools' },
            ].map(({ icon, who, desc, link }) => (
              <div key={who} className="border border-gray-100 rounded-2xl p-6 hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{who}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-3">{desc}</p>
                {link && (
                  <Link href={link} className="text-xs text-emerald-600 font-semibold hover:underline">
                    School licensing →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOUNDER NOTE ────────────────────────────────────────────────────── */}
      <section id="about" className="py-24 bg-gray-900 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-8">
            Built with Zimbabwean learners, not for them.
          </h2>
          <blockquote className="text-lg sm:text-xl text-gray-300 leading-relaxed italic mb-8">
            &ldquo;Growing up in Zimbabwe, I watched brilliant learners held back not by ability but by access — to good teachers, to resources, to time. ZimLearn AI is what I wish had existed when I was in school. MaFundi is for every learner who&apos;s ever had a question at 9pm and nobody to ask.&rdquo;
          </blockquote>
          <div className="text-gray-500 text-sm font-medium">— Bright, Founder · ZimLearn AI</div>
        </div>
      </section>

      {/* ── PRICING TEASER ──────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            Affordable for every Zimbabwean family.
          </h2>
          <p className="text-lg text-gray-500 mb-10">
            Start free. Upgrade when you&apos;re ready. School licensing available for institutions.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            {[
              { name: 'Free', price: '$0', period: 'forever', features: ['5 AI questions/day', '3 study resources', 'Basic quizzes'], cta: 'Start free', primary: false },
              { name: 'Starter', price: '$2', period: '/month', features: ['Unlimited AI tutoring', 'All subjects & past papers', 'Study planner', 'Grade predictor'], cta: 'Get Starter', primary: true },
              { name: 'Pro Scholar', price: '$5', period: '/month', features: ['Everything in Starter', 'Advanced AI model', 'Mock exams', 'Priority responses', 'Parent dashboard'], cta: 'Get Pro', primary: false },
            ].map(({ name, price, period, features, cta, primary }) => (
              <div key={name} className={`rounded-2xl p-6 border-2 ${primary ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100' : 'border-gray-100'}`}>
                {primary && <div className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2">Most popular</div>}
                <h3 className="font-black text-gray-900 text-lg mb-1">{name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-black text-gray-900">{price}</span>
                  <span className="text-gray-500 text-sm">{period}</span>
                </div>
                <ul className="space-y-2 mb-6 text-left">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-emerald-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`block w-full text-center py-3 rounded-xl font-bold text-sm transition-colors ${primary ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border border-gray-200 hover:border-gray-300 text-gray-700'}`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400">Pay via EcoCash · OneMoney · InnBucks · Visa · Mastercard · Google Pay</p>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section className="py-24 bg-emerald-600 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Your exam prep starts today.
          </h2>
          <p className="text-emerald-100 text-lg mb-10">
            Join the growing community of Zimbabwean learners studying smarter with MaFundi.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="w-full sm:w-auto bg-white hover:bg-gray-50 text-emerald-700 font-black px-8 py-4 rounded-xl transition-colors shadow-lg text-base">
              Start learning free
            </Link>
            <Link href="/schools" className="w-full sm:w-auto border-2 border-emerald-400 hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base">
              Are you a school? School licensing →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 pt-16 pb-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🇿🇼</span>
                <span className="font-black text-white text-lg">ZimLearn AI</span>
              </div>
              <p className="text-sm leading-relaxed">Zimbabwe&apos;s AI Teacher for the Heritage-Based Curriculum.</p>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/schools" className="hover:text-white transition-colors">For Schools</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Download app</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">Our mission</a></li>
                <li><a href="mailto:admin@zim-elearningai.co.zw" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="mailto:admin@zim-elearningai.co.zw" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Data protection</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="https://wa.me/263782876599" className="hover:text-white transition-colors">WhatsApp</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter / X</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm">
              <span>© 2026 ZimLearn AI. Made in Zimbabwe. 🇿🇼</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed max-w-4xl">
              ZimLearn AI is an independent Zimbabwean education technology platform. We are not affiliated with, endorsed by, or officially connected to ZIMSEC or the Ministry of Primary and Secondary Education. References to ZIMSEC, the Heritage-Based Curriculum, and official syllabuses are descriptive — they indicate the curriculum content our AI has been trained on.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
