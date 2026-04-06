import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Shield } from 'lucide-react'
import { isRedirectError } from 'next/dist/client/components/redirect'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminDashboard() {
  const supabase = createClient()
  
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user
  
  if (authError || !user) redirect('/login')

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    if (profile?.role?.toLowerCase() !== 'admin') {
      const safeRole = profile?.role?.toLowerCase() || 'student'
      redirect(`/${safeRole === 'school_admin' ? 'school-admin' : safeRole}/dashboard`)
    }

    console.log('[AdminDashboard] Fetching data for profile:', profile?.role)
    const [
      { count: totalUsers },
      { count: totalStudents },
      { count: totalSubjects },
      { count: totalDocuments },
      { count: pendingModeration },
      { count: publishedDocuments },
      { data: trialStats },
      { data: paymentStats },
      { data: cohortData },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('subjects').select('*', { count: 'exact', head: true }),
      supabase.from('uploaded_documents').select('*', { count: 'exact', head: true }),
      supabase.from('uploaded_documents').select('*', { count: 'exact', head: true }).eq('moderation_status', 'ai_reviewed'),
      supabase.from('uploaded_documents').select('*', { count: 'exact', head: true }).eq('moderation_status', 'published'),
      supabase.from('profiles').select('id, full_name, email, plan, trial_ends_at, subscription_expires_at').eq('role', 'student').not('trial_ends_at', 'is', null),
      supabase.from('profiles').select('plan, subscription_expires_at').eq('role', 'student').not('plan', 'is', null),
      supabase.from('profiles').select('created_at, role').gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    const trialNow = new Date().toISOString()
    const trialTodayEnd = new Date()
    trialTodayEnd.setHours(23, 59, 59, 999)

    let _activeTrialsCount = 0
    let endingTodayCount = 0
    try {
      const { count: at } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('trial_ends_at', 'is', null)
        .gt('trial_ends_at', trialNow)
        .eq('plan', 'free')
      _activeTrialsCount = at ?? 0
    } catch { /* trial_ends_at column may not exist yet */ }
    
    try {
      const { count: et } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('trial_ends_at', 'is', null)
        .gt('trial_ends_at', trialNow)
        .lt('trial_ends_at', trialTodayEnd.toISOString())
        .eq('plan', 'free')
      endingTodayCount = et ?? 0
    } catch { /* trial_ends_at column may not exist yet */ }

    let activeAnnouncements = 0
    let pendingTeachers = 0
    let totalQuestions = 0
    try {
      const { count } = await supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('is_active', true)
      activeAnnouncements = count ?? 0
    } catch { /* announcements table not yet created */ }
    try {
      const { count } = await supabase.from('teacher_profiles').select('*', { count: 'exact', head: true }).eq('is_approved', false)
      pendingTeachers = count ?? 0
    } catch { /* column may not exist yet */ }
    try {
      const { count } = await supabase.from('questions').select('*', { count: 'exact', head: true })
      totalQuestions = count ?? 0
    } catch { /* table may not exist yet */ }

    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { count: liveActiveUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gt('last_sign_in_at', fifteenMinsAgo)
      .eq('role', 'student')

    const now = new Date()
    const trialUsers = trialStats?.filter((p: any) => p.trial_ends_at) || []
    const activeTrials = trialUsers.filter((p: any) => new Date(p.trial_ends_at) > now)
    const expiringSoon = trialUsers.filter((p: any) => {
      const daysLeft = Math.ceil((new Date(p.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysLeft > 0 && daysLeft <= 3
    })
 
    const paidUsers = paymentStats?.filter((p: any) => p.plan !== 'free' && p.plan !== null) || []
    const trulyActivePaidUsers = paidUsers.filter((p: any) => !p.subscription_expires_at || new Date(p.subscription_expires_at) >= now)
    
    const eliteUsers = paidUsers.filter((p: any) => p.plan === 'elite')
    const proUsers = paidUsers.filter((p: any) => p.plan === 'pro')
    const starterUsers = paidUsers.filter((p: any) => p.plan === 'starter')
    
    const currentMRR = (starterUsers.length * 2) + (proUsers.length * 5) + (eliteUsers.length * 8)
    const potentialMRR = currentMRR + (activeTrials.length * 2)
 
    const cohortByMonth = cohortData?.reduce((acc: any, user: any) => {
      const month = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const stats = [
      { label: 'Total users',    value: totalUsers ?? 0,        iconId: 'Users',         color: 'text-blue-600',   bg: 'bg-blue-50',   href: '/admin/users', border: 'border-t-blue-500' },
      { label: 'Students',       value: totalStudents ?? 0,     iconId: 'GraduationCap', color: 'text-green-600',  bg: 'bg-green-50',  href: '/admin/users', border: 'border-t-green-500' },
      { label: 'Subjects',       value: totalSubjects ?? 0,     iconId: 'LayoutList',    color: 'text-purple-600', bg: 'bg-purple-50', href: '/admin/subjects', border: 'border-t-purple-500' },
      { label: 'Active Trials',  value: activeTrials.length,    iconId: 'Clock',         color: 'text-amber-600',  bg: 'bg-amber-50',  href: '/admin/trials', border: 'border-t-amber-500' },
      { label: 'Paid Users',     value: trulyActivePaidUsers.length, iconId: 'CreditCard',    color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/admin/payments', border: 'border-t-emerald-500' },
      { label: 'Published Docs', value: publishedDocuments ?? 0, iconId: 'FileText',     color: 'text-teal-600',   bg: 'bg-teal-50',   href: '/admin/documents', border: 'border-t-teal-500' },
      { label: 'Docs to review', value: pendingModeration ?? 0, iconId: 'BarChart2',     color: 'text-amber-600',  bg: 'bg-amber-50',  href: '/admin/documents', border: 'border-t-amber-500' },
      { label: 'Expirations Today', value: endingTodayCount,    iconId: 'AlertTriangle', color: endingTodayCount > 0 ? 'text-rose-600' : 'text-slate-400', bg: endingTodayCount > 0 ? 'bg-rose-50' : 'bg-slate-50', href: '/admin/trials', border: 'border-t-rose-500' },
    ]

    return (
      <AdminDashboardClient 
        user={user}
        profile={profile || {}}
        stats={stats || []}
        endingTodayCount={endingTodayCount || 0}
        expiringSoon={expiringSoon || []}
        cohortByMonth={cohortByMonth || {}}
        totalUsers={totalUsers ?? 0}
        liveActiveUsers={liveActiveUsers ?? 0}
        currentMRR={currentMRR || 0}
        potentialMRR={potentialMRR || 0}
        activeTrials={activeTrials || []}
        paidUsers={trulyActivePaidUsers || []}
        eliteUsers={eliteUsers || []}
        pendingModeration={pendingModeration ?? 0}
        totalDocuments={totalDocuments ?? 0}
        publishedDocuments={publishedDocuments ?? 0}
        pendingTeachers={pendingTeachers || 0}
        activeAnnouncements={activeAnnouncements || 0}
        totalQuestions={totalQuestions || 0}
      />
    )
  } catch (err: any) {
    if (isRedirectError(err)) {
      throw err;
    }
    console.error('[AdminDashboard] Runtime error:', err)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center bg-gray-50 uppercase font-bold">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
          <Shield size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Command Center Offline</h2>
        <p className="text-slate-500 max-w-xs uppercase">We encountered a critical error while loading the administrative command center. Security protocols have blocked access.</p>
        <Link href="/login">
          <Button variant="outline">Re-authenticate Session</Button>
        </Link>
      </div>
    )
  }
}
