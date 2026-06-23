import { createClient } from '@/lib/supabase/server'
import { 
  Trophy, School, MapPin, 
  TrendingUp, Award, Users 
} from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SchoolRankingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch Leaderboard from API logic (or direct db call for speed)
  const { data: leaderboardData } = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/schools/leaderboard`, {
    next: { revalidate: 3600 } // Cache for 1 hour
  }).then(r => r.json()).catch(() => ({ leaderboard: [] }))

  const schools = leaderboardData?.leaderboard || []

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-6 font-bold uppercase">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-6 sm:p-10 rounded-3xl text-white shadow-2xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 px-3 py-1.5 rounded-2xl border border-blue-500/30">
              <Trophy size={14} className="text-yellow-400" />
              <span className="text-xs font-black tracking-widest text-blue-200">National Rankings</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase leading-none">
              ZIMSEC PREP <br /><span className="text-blue-400">LEADERBOARD</span>
            </h1>
            <p className="text-slate-500 text-xs font-black tracking-[0.15em] max-w-xs leading-relaxed italic">
              Schools ranked by their active student Readiness Index.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl text-center flex-1">
               <p className="text-2xl sm:text-3xl font-black italic tracking-tighter">{schools.length}</p>
               <p className="text-xs text-slate-500 mt-1 tracking-widest">SCHOOLS</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl text-center flex-1">
               <p className="text-2xl sm:text-3xl font-black italic tracking-tighter">#1</p>
               <p className="text-xs text-slate-500 mt-1 tracking-widest">TOP SCHOOL</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard — cards on mobile, table on desktop */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="px-4 sm:px-8 py-4 sm:py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
           <h2 className="text-sm font-black italic tracking-tight text-slate-800">TOP PERFORMANCE UNITS</h2>
           <span className="text-xs text-slate-500">Every 60 mins</span>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-slate-50">
          {schools.map((school: any, idx: number) => (
            <div key={school.id} className="flex items-center gap-3 px-4 py-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black italic flex-shrink-0 text-sm ${
                idx === 0 ? 'bg-yellow-400 text-white' :
                idx === 1 ? 'bg-slate-300 text-white' :
                idx === 2 ? 'bg-orange-400 text-white' :
                'bg-slate-100 text-slate-500'
              }`}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-800 tracking-tight truncate">{school.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <MapPin size={10} className="text-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-500 truncate">{school.location || 'Zimbabwe'}</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className={`text-xl font-black italic ${
                  school.readinessIndex >= 80 ? 'text-emerald-600' :
                  school.readinessIndex >= 50 ? 'text-amber-600' :
                  'text-slate-400'
                }`}>{school.readinessIndex}%</span>
                <p className="text-xs text-slate-500">readiness</p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 bg-white/50">
                <th className="px-6 py-4 text-xs font-black text-slate-400 tracking-widest">RANK</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 tracking-widest">SCHOOL / INSTITUTION</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 tracking-widest">LOCATION</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 tracking-widest">STUDENTS</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 tracking-widest text-right">READINESS INDEX</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {schools.map((school: any, idx: number) => (
                <tr key={school.id} className="hover:bg-blue-50/50 transition-colors group cursor-pointer">
                  <td className="px-6 py-5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black italic ${
                      idx === 0 ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-400/30' :
                      idx === 1 ? 'bg-slate-300 text-white shadow-lg shadow-slate-300/30' :
                      idx === 2 ? 'bg-orange-400 text-white shadow-lg shadow-orange-400/30' :
                      'text-slate-400'
                    }`}>
                      {idx + 1}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors">
                        <School size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors uppercase">{school.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="blue" className="text-xs px-1.5 py-0.5">{school.rank}</Badge>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin size={12} />
                      <span className="text-xs font-black tracking-widest">{school.location || 'ZIMBABWE'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <Users size={14} className="text-slate-300" />
                       <span className="text-sm font-black text-slate-700 tracking-tighter">{school.studentCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="inline-flex flex-col items-end">
                      <span className={`text-2xl font-black italic tracking-tighter ${
                        school.readinessIndex >= 80 ? 'text-emerald-600' :
                        school.readinessIndex >= 50 ? 'text-amber-600' :
                        'text-slate-400'
                      }`}>
                        {school.readinessIndex}%
                      </span>
                      <div className="w-24 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full ${
                            school.readinessIndex >= 80 ? 'bg-emerald-500' :
                            school.readinessIndex >= 50 ? 'bg-amber-500' :
                            'bg-slate-300'
                          }`}
                          style={{ width: `${school.readinessIndex}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Badge({ children, variant, className }: any) {
  const variants: any = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100'
  }
  return (
    <span className={`px-2 py-1 rounded-md border text-xs font-black uppercase tracking-widest ${variants[variant] || ''} ${className}`}>
      {children}
    </span>
  )
}
