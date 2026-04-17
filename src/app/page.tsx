import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { 
  Sparkles, 
  MessageSquare, 
  BookOpen, 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is already logged in, send them to their dashboard
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile?.onboarding_completed) {
      redirect(`/${profile.role}/dashboard`)
    } else {
      redirect('/onboarding')
    }
  }

  // PUBLIC SEO LANDING PAGE
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white" size={18} />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase transition-colors">
              ZimLearn<span className="text-emerald-500">AI</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#whatsapp" className="hover:text-emerald-600 transition-colors">WhatsApp Bot</a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="font-bold uppercase tracking-tight">Login</Button>
            </Link>
            <Link href="/login?signup=true">
              <Button variant="premium" className="font-black uppercase tracking-tight shadow-lg shadow-emerald-500/20">Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full" />
        
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <Badge variant="emerald" className="mb-6 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 animate-fade-in">
             <ShieldCheck size={14} className="mr-2 inline" /> OFFICIAL ZIMSEC AI PARTNER
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-6">
            Meet MaFundi.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Your AI Teacher.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">
            The only AI platform built specifically for the Zimbabwe Heritage-Based Curriculum. Master Primary, O-Level, and A-Level ZIMSEC exams with 24/7 personalized tutoring.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login?signup=true">
              <Button size="lg" className="h-14 px-10 text-lg font-black uppercase tracking-tight bg-slate-900 dark:bg-emerald-600 hover:scale-105 transition-transform">
                Start Learning Free
              </Button>
            </Link>
            <Link href="https://wa.me/263782876599" target="_blank">
              <Button variant="outline" size="lg" className="h-14 px-10 text-lg font-black uppercase tracking-tight border-2">
                <MessageSquare className="mr-2 text-emerald-500" /> WhatsApp Bot
              </Button>
            </Link>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 grayscale opacity-50">
            <span className="text-xs font-black uppercase tracking-[0.3em]">Trusted by 100+ Students</span>
            <span className="text-xs font-black uppercase tracking-[0.3em]">Official Syllabus Sync</span>
            <span className="text-xs font-black uppercase tracking-[0.3em]">AI-Powered Precision</span>
          </div>
        </div>
      </section>

      {/* Stats/Proof Section */}
      <section className="bg-white dark:bg-slate-900/50 py-12 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
             <TrendingUp className="mx-auto mb-2 text-emerald-500" />
             <p className="text-3xl font-black text-slate-900 dark:text-white">103+</p>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Students</p>
          </div>
          <div>
             <Award className="mx-auto mb-2 text-blue-500" />
             <p className="text-3xl font-black text-slate-900 dark:text-white">98%</p>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Syllabus Match</p>
          </div>
          <div>
             <BookOpen className="mx-auto mb-2 text-purple-500" />
             <p className="text-3xl font-black text-slate-900 dark:text-white">5,000+</p>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Study Topics</p>
          </div>
          <div>
             <Zap className="mx-auto mb-2 text-orange-500" />
             <p className="text-3xl font-black text-slate-900 dark:text-white">24/7</p>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Live Support</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="blue" className="uppercase font-black tracking-widest">Why ZimLearn AI?</Badge>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">The Future of Zimbabwe's Education</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Heritage-Based Sync",
              desc: "MaFundi is trained on the latest 2024-2030 MoPSE curriculum, including Ubuntu values and Local History.",
              icon: <BookOpen className="text-emerald-500" />,
              bg: "bg-emerald-500/10"
            },
            {
              title: "WhatsApp Bot Gateway",
              desc: "Don't have data? Chat with your AI Teacher directly on WhatsApp and get answers in seconds.",
              icon: <MessageSquare className="text-blue-500" />,
              bg: "bg-blue-500/10"
            },
            {
              title: "Smart Past Papers",
              desc: "Access thousands of ZIMSEC past papers with AI-generated marking schemes and model answers.",
              icon: <Zap className="text-purple-500" />,
              bg: "bg-purple-500/10"
            }
          ].map((feat, i) => (
            <Card key={i} className="group hover:border-emerald-500/50 transition-all duration-300 shadow-sm hover:shadow-xl">
              <CardContent className="p-8">
                <div className={`w-14 h-14 ${feat.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{feat.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {feat.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* WhatsApp Feature Highlight */}
      <section id="whatsapp" className="py-20 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-emerald-500/20 blur-[120px] -translate-y-1/2 -translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-4 relative flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <Badge className="bg-emerald-500 text-white border-none uppercase font-black tracking-widest">NEW FEATURE</Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Learn Anywhere.<br />Even on WhatsApp.</h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-lg">
              Our AI Teacher, MaFundi, is now fully synced with WhatsApp. Simply save our official number and start asking questions. No login required.
            </p>
            <div className="space-y-4">
              {[
                "Instant ZIMSEC syllabus explanations",
                "Solving complex Math & Science problems",
                "Exam study tips in Shona & Ndebele",
                "Direct Sync with your Web progress"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                  <span className="font-bold text-slate-200">{item}</span>
                </div>
              ))}
            </div>
            <Link href="https://wa.me/263782876599" target="_blank" className="inline-block pt-4">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-14 px-10 text-lg font-black uppercase tracking-tight group">
                CHAT ON WHATSAPP <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="flex-1 relative">
            <div className="w-full aspect-square max-w-md bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-[3rem] border border-white/10 flex items-center justify-center p-8 backdrop-blur-3xl">
              <div className="bg-slate-950 rounded-3xl p-6 border border-white/5 shadow-2xl w-full">
                <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center font-black">M</div>
                  <div>
                    <p className="font-bold text-xs uppercase tracking-widest">MaFundi AI</p>
                    <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Official Bot
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none text-xs font-medium text-slate-300">
                    Mhoro! How can I help you in your ZIMSEC studies today? 📚
                  </div>
                  <div className="bg-emerald-600 p-3 rounded-2xl rounded-tr-none text-xs font-black self-end ml-auto max-w-[80%]">
                    Explain photosynthesis in simple terms for Grade 7.
                  </div>
                  <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none text-xs font-medium text-slate-300 leading-relaxed">
                    Great choice! **Photosynthesis (Kubika kwekudya neZvirimwa)** is how plants make food. They use sunlight, carbon dioxide, and water to create sugar and oxygen. 🌿
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge variant="blue" className="mb-6 uppercase font-black tracking-widest px-4">Investment for Success</Badge>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight italic">ONE PRICE. ALL ACCESS.</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mb-12">
            No complicated tiers. Just complete access to MaFundi across Web and WhatsApp.
          </p>

          <Card className="max-w-lg mx-auto border-2 border-emerald-500 relative overflow-hidden shadow-2xl shadow-emerald-500/10">
            <div className="absolute top-0 right-0 p-4">
              <Badge variant="emerald" className="bg-emerald-500 text-white font-black uppercase">COMMUNITY CHOICE</Badge>
            </div>
            <CardContent className="p-12">
              <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-4">PREMIUM SCHOLAR</p>
              <div className="flex items-center justify-center gap-1 mb-8">
                 <span className="text-3xl font-black text-slate-400">$</span>
                 <span className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter">2</span>
                 <span className="text-xl font-bold text-slate-400 mt-6">/month</span>
              </div>
              
              <ul className="text-left space-y-4 mb-10">
                {[
                  "Unlimited AI Teacher Queries",
                  "Full ZIMSEC Past Paper Library",
                  "WhatsApp Bot Integration",
                  "Personalized Grade Tracking",
                  "Native Language Support (Shona/Ndebele)",
                  "Official Heritage Syllabus Alignment"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="text-emerald-600" size={12} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item}</span>
                  </li>
                ))}
              </ul>

              <Link href="/login?signup=true">
                <Button size="lg" className="w-full h-14 text-lg font-black uppercase tracking-tight bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20">
                  Join 103+ Scholars Now
                </Button>
              </Link>
              <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Cancel anytime. Priority support included.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-6 h-6 bg-emerald-600 rounded-md flex items-center justify-center">
              <Sparkles className="text-white" size={14} />
            </div>
            <span className="text-md font-black text-slate-900 dark:text-white tracking-tighter uppercase">
              ZimLearn<span className="text-emerald-500">AI</span>
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">
            © 2026 ZimLearn AI. The First & Original ZIMSEC AI Teacher.
          </p>
          <div className="flex justify-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
            <Link href="/terms" className="hover:text-emerald-600">Terms</Link>
            <Link href="/privacy" className="hover:text-emerald-600">Privacy</Link>
            <Link href="mailto:admin@zim-elearningai.co.zw" className="hover:text-emerald-600">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
