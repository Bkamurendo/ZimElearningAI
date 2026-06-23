import { createClient } from '@/lib/supabase/server'
import { 
  Trophy, Users, Link as LinkIcon, 
  Award, TrendingUp, CheckCircle 
} from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function TeacherReferralsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, referral_code, referral_credits')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  // Fetch CPD Points
  const { data: cpdData } = await supabase
    .from('teacher_cpd_points')
    .select('points')
    .eq('teacher_id', user.id)
  
  const totalPoints = (cpdData ?? []).reduce((acc, curr) => acc + curr.points, 0)

  // Fetch Referral Stats
  const { count: referralCount } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', user.id)

  const referralUrl = `https://zimlearn.ai/onboarding?ref=${profile.referral_code}`

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tight">Teacher Referral Program</h1>
          <p className="text-emerald-100 mt-2 font-medium">Earn CPD points by bringing your students into the digital age.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">CPD Points</p>
            <p className="text-3xl font-black">{totalPoints}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">Total Referrals</p>
            <p className="text-3xl font-black">{referralCount || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Referral Link Card */}
        <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <LinkIcon size={20} className="text-emerald-500" />
              Your Unique Referral Link
            </h2>
            <p className="text-sm text-slate-500 mt-1">Share this with your students. They get a 14-day free trial (instead of 7) when they use your link.</p>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <code className="flex-1 text-sm font-mono text-emerald-700 overflow-hidden text-ellipsis whitespace-nowrap">
              {referralUrl}
            </code>
            <button 
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-emerald-200"
              onClick={() => { /* Client-side copy handled by component wrapper if needed */ }}
            >
              Copy Link
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
              <Trophy size={20} className="text-orange-500 mb-2" />
              <p className="text-xs font-bold text-orange-900">Digital Mentorship</p>
              <p className="text-[10px] text-orange-700 mt-1">Earn 5 points per student quiz completed.</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <Users size={20} className="text-blue-500 mb-2" />
              <p className="text-xs font-bold text-blue-900">Class Growth</p>
              <p className="text-[10px] text-blue-700 mt-1">Awarded the "Digital Pioneer" badge at 50 referrals.</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
              <Award size={20} className="text-purple-500 mb-2" />
              <p className="text-xs font-bold text-purple-900">CPD Certificate</p>
              <p className="text-[10px] text-purple-700 mt-1">Claim official certificates for your professional file.</p>
            </div>
          </div>
        </div>

        {/* Milestone Card */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
          
          <h2 className="text-lg font-bold flex items-center gap-2 relative z-10">
            <TrendingUp size={20} className="text-emerald-400" />
            Next Certificate
          </h2>

          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-end">
              <p className="text-sm font-medium text-slate-400">Foundation Specialist</p>
              <p className="text-xs font-bold text-emerald-400">{totalPoints} / 50 pts</p>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000" 
                style={{ width: `${Math.min((totalPoints / 50) * 100, 100)}%` }} 
              />
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Unlocked Benefits</p>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle size={14} className="text-emerald-500" />
              <span>AI Lesson Planner</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300 opacity-50">
              <CheckCircle size={14} className="text-slate-600" />
              <span>Bulk Exam Generator</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300 opacity-50">
              <CheckCircle size={14} className="text-slate-600" />
              <span>Ministry CPD Certification</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
