import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminDashboard() {
  const supabase = createClient()
  
  // Safely check for user without crashing on null data
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
      const safeRole = profile?.role?.toLowerCase() || 'admin'
      redirect(`/${safeRole === 'school_admin' ? 'school-admin' : safeRole}/dashboard`)
    }

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
    // Trial statistics
    supabase.from('profiles').select('id, full_name, email, plan, trial_ends_at, subscription_expires_at').eq('role', 'student').not('trial_ends_at', 'is', null),
    // Payment statistics  
    supabase.from('profiles').select('plan, subscription_expires_at').eq('role', 'student').not('plan', 'is', null),
    // Cohort data (registrations by month)
    supabase.from('profiles').select('created_at, role').gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  // Trial stats
  const trialNow = new Date().toISOString()
  const trialTodayEnd = new Date()
  trialTodayEnd.setHours(23, 59, 59, 999)

  let activeTrialsCount = 0
  let endingTodayCount = 0
  try {
    const { count: at } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('trial_ends_at', 'is', null)
      .gt('trial_ends_at', trialNow)
      .eq('plan', 'free')
    activeTrialsCount = at ?? 0
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

  // Fetch announcement count separately (table may not exist yet)
  let activeAnnouncements = 0
  let pendingTeachers = 0
  let totalQuestions = 0
  try {
    const { count } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    activeAnnouncements = count ?? 0
  } catch { /* announcements table not yet created */ }
  try {
    const { count } = await supabase
      .from('teacher_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', false)
    pendingTeachers = count ?? 0
  } catch { /* column may not exist yet */ }
  try {
    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
    totalQuestions = count ?? 0
  } catch { /* table may not exist yet */ }

  // Active Users calculation (seen in last 15 mins)
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const { count: liveActiveUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gt('last_sign_in_at', fifteenMinsAgo)
    .eq('role', 'student')

  // Process trial and payment statistics
  const now = new Date()
  const trialUsers = trialStats?.filter(p => p.trial_ends_at) || []
  const activeTrials = trialUsers.filter(p => new Date(p.trial_ends_at) > now)
  const expiringSoon = trialUsers.filter(p => {
    const daysLeft = Math.ceil((new Date(p.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft > 0 && daysLeft <= 3
  })

  // Payment Tracking - REAL: calculate value based on current tiers
  const paidUsers = paymentStats?.filter(p => p.plan !== 'free' && p.plan !== null) || []
  const trulyActivePaidUsers = paidUsers.filter(p => !p.subscription_expires_at || new Date(p.subscription_expires_at) >= now)
  
  const eliteUsers = paidUsers.filter(p => p.plan === 'elite')
  const proUsers = paidUsers.filter(p => p.plan === 'pro')
  const starterUsers = paidUsers.filter(p => p.plan === 'starter')
  
  // Real potential monthly MRR (Matching lib/subscription.ts)
  const currentMRR = (starterUsers.length * 2) + (proUsers.length * 5) + (eliteUsers.length * 8)
  const potentialMRR = currentMRR + (activeTrials.length * 2) // Estimate conversion to $2 Starter min

  // Process cohort data
  const cohortByMonth = cohortData?.reduce((acc, user) => {
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
  } catch (error) {
    console.error('[AdminDashboard] Runtime error:', error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Something went wrong</h2>
        <p className="text-slate-500">We couldn't load the admin dashboard. Please try refreshing.</p>
        <Link href="/login">
          <Button>Back to Login</Button>
        </Link>
      </div>
    )
  }
}

import { Button } from '@/components/ui/Button'
