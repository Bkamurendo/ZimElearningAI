import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, Plus, ShieldCheck, Search, Users2, Star, ChevronRight, Lock } from 'lucide-react'

export default async function StudySquadsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user's squads
  const { data: memberships } = await supabase
    .from('study_squad_members')
    .select('squad:study_squads(*)')
    .eq('user_id', user.id)

  const mySquads = memberships?.map(m => m.squad).filter(Boolean) || []

  // Get public squads to join
  const { data: publicSquads } = await supabase
    .from('study_squads')
    .select('*, members:study_squad_members(count)')
    .eq('is_private', false)
    .limit(10)

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const isPro = profile?.plan === 'pro' || profile?.plan === 'elite'

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        
        {/* Missions-Focused Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Users2 size={32} className="text-emerald-600" /> Study Squads
          </h1>
          <p className="text-slate-500 text-sm max-w-xl">
            No student is an island. Join forces with peers from across Zimbabwe to master the ZIMSEC syllabus together.
            Especially effective for students in rural areas needing peer-to-peer support.
          </p>
        </div>

        {/* My Squads Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">My Active Squads</h2>
            <Link href="/student/squads/create" 
              className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition ${
                isPro ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}>
              {isPro ? <Plus size={14} /> : <Lock size={14} />} Create Squad
            </Link>
          </div>

          {mySquads.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm">
              <Users size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-600">You aren't in any squads yet.</p>
              <p className="text-xs text-gray-400 mt-1">Join a public squad below to start collaborating.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mySquads.map((s: any) => (
                <Link key={s.id} href={`/student/squads/${s.id}`} 
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <Users size={20} className="text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">
                      Admin
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{s.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{s.description || 'No description provided.'}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
                    <div className="flex -space-x-2">
                       {/* Placeholder avatars */}
                       {[1,2,3].map(i => (
                         <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">
                           {i}
                         </div>
                       ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">8 Members</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Discovery Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Discover Public Squads</h2>
            <button className="text-gray-400 hover:text-emerald-600">
              <Search size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {publicSquads?.map((s: any) => (
              <div key={s.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between gap-4 group hover:border-emerald-200 transition-all">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                    <Star size={20} className="text-slate-300 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{s.name}</h3>
                    <p className="text-[10px] text-gray-400 font-medium">8/10 Members · Active 2h ago</p>
                  </div>
                </div>
                <Link href={`/student/squads/${s.id}/join`} 
                  className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-slate-100">
                  Join Squad
                </Link>
              </div>
            ))}
            
            {/* If no squads yet */}
            {(!publicSquads || publicSquads.length === 0) && (
              <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-400">No public squads found. Be the first to start one!</p>
              </div>
            )}
          </div>
        </section>

        {/* Elite/Pro Nudge */}
        {!isPro && (
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             <div className="relative">
                <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                  <ShieldCheck size={24} className="text-amber-400" /> Unlock Collaborative Studying
                </h3>
                <p className="text-indigo-100 text-sm max-w-md mb-6 leading-relaxed">
                  Start your own Study Squad, invite friends, and share AI-generated study materials. 
                  Exclusive to Pro and Elite members.
                </p>
                <Link href="/student/upgrade" className="inline-flex items-center gap-2 bg-white text-indigo-700 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-amber-400 transition shadow-xl hover:scale-105">
                  Upgrade Now <ChevronRight size={14} />
                </Link>
             </div>
          </div>
        )}

      </div>
    </div>
  )
}
