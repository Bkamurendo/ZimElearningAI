import { createClient } from '@/lib/supabase/server'
import { ShieldAlert, Database } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
  const supabase = createClient()
  const results: { step: string; status: 'ok' | 'fail'; detail: string }[] = []

  // 1. Check Env Vars
  const envs = {
    URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    ANON: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SERVICE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
  
  results.push({
    step: 'Environment Variables',
    status: (envs.URL && envs.ANON) ? 'ok' : 'fail',
    detail: `URL: ${envs.URL}, ANON: ${envs.ANON}, SERVICE: ${envs.SERVICE}`
  })

  // 2. Check Auth
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError
    results.push({
      step: 'Authentication',
      status: 'ok',
      detail: user ? `Logged in as: ${user.email} (${user.id})` : 'Not logged in'
    })
    
    // 3. Check Profile Table
    if (user) {
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profError) throw profError
      results.push({
        step: 'Profile Lookup',
        status: 'ok',
        detail: `Role: ${profile?.role}, Onboarding: ${profile?.onboarding_completed}`
      })
      
      // 4. Test Student Profiles (Common crash site)
      if (profile?.role === 'student') {
        const { data: student, error: sError } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (sError) throw sError
        results.push({
          step: 'Student Profile Sync',
          status: 'ok',
          detail: `Level: ${student?.zimsec_level}, Grade: ${student?.grade}`
        })
      }
    }
  } catch (err: any) {
    results.push({
      step: 'Critical Error',
      status: 'fail',
      detail: err.message || JSON.stringify(err)
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-mono">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-10">
          <ShieldAlert className="text-red-500" size={48} />
          <div>
            <h1 className="text-2xl font-black text-white">SYSTEM DIAGNOSTICS</h1>
            <p className="text-slate-500 text-xs uppercase tracking-widest">MaFundi Security & Stability Audit v1.0</p>
          </div>
        </div>

        <div className="grid gap-4">
          {results.map((r, i) => (
            <div key={i} className={`p-4 rounded-xl border ${r.status === 'ok' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-50">{r.step}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${r.status === 'ok' ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
                  {r.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-bold break-all">{r.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 p-6 border border-slate-800 rounded-3xl bg-slate-900 shadow-2xl">
          <h2 className="text-white font-black mb-2 uppercase text-xs tracking-widest flex items-center gap-2">
            <Database size={14} /> Database Integrity Status
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed uppercase italic">
            This module bypasses standard Next.js error obfuscation. If you see "Column not found" above, you must execute the SQL migrations in your Supabase Dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
