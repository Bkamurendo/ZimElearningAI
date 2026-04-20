export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BarChart3, Users, DollarSign, ArrowLeft, Filter, FileText, Download, Calendar, TrendingUp } from 'lucide-react'

export const metadata = { title: 'Reports — Admin' }

export default async function AdminReportsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  // Fetch comprehensive data for reports
  const [
    { data: userData },
    { data: revenueData },
    { data: activityData },
    { data: _contentData },
    { data: quizData },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, role, plan, created_at, last_sign_in_at'),
    supabase.from('profiles').select('plan, subscription_expires_at, created_at').not('plan', 'is', null),
    Promise.resolve({ data: [] as any[] }), // user_activity table not yet in schema
    supabase.from('uploaded_documents').select('title, subject, created_at, moderation_status'),
    supabase.from('quiz_attempts').select('score, total, subject_id, created_at, student_id'),
  ])

  const generateCSV = (data: any[], filename: string) => {
    if (data.length === 0) return null
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string' && value.includes(',')) return `"${value}"`
        return String(value)
      }).join(','))
    ].join('\n')

    return { filename, content: csvContent, size: csvContent.length }
  }

  // Prepare report data
  const userReport = generateCSV(
    userData?.map(u => ({
      ID: u.id,
      Name: u.full_name || '',
      Email: u.email,
      Role: u.role,
      Plan: u.plan || 'free',
      'Created At': u.created_at,
      'Last Login': u.last_sign_in_at || 'Never'
    })) || [],
    'users_report.csv'
  )

  const revenueReport = generateCSV(
    revenueData?.map(r => ({
      Plan: r.plan,
      'Subscription Expires': r.subscription_expires_at || 'Lifetime',
      'Created At': r.created_at,
      'Monthly Value': r.plan === 'premium' ? '$15' : r.plan === 'basic' ? '$5' : '$0'
    })) || [],
    'revenue_report.csv'
  )

  const activityReport = generateCSV(
    activityData?.map(a => ({
      'User ID': a.user_id,
      'Activity Type': a.activity_type,
      'Timestamp': a.created_at
    })) || [],
    'activity_report.csv'
  )

  const performanceReport = generateCSV(
    quizData?.map(p => ({
      'Student ID': p.student_id || 'N/A',
      'Subject ID': p.subject_id || 'N/A',
      'Score': p.score || 'N/A',
      'Total': p.total || 'N/A',
      Percentage: p.score && p.total ? Math.round((p.score / p.total) * 100) : 'N/A',
      'Attempt Date': p.created_at || 'N/A'
    })) || [],
    'performance_report.csv'
  )

  const reports = [
    {
      title: 'User Report',
      description: 'Complete user database with roles, plans, and activity',
      icon: Users,
      color: 'blue',
      data: userReport,
      records: userData?.length || 0,
      lastUpdated: new Date().toLocaleDateString()
    },
    {
      title: 'Revenue Report',
      description: 'Subscription plans and revenue projections',
      icon: DollarSign,
      color: 'green',
      data: revenueReport,
      records: revenueData?.length || 0,
      lastUpdated: new Date().toLocaleDateString()
    },
    {
      title: 'Activity Report',
      description: 'User activity logs and engagement metrics',
      icon: TrendingUp,
      color: 'purple',
      data: activityReport,
      records: activityData?.length || 0,
      lastUpdated: new Date().toLocaleDateString()
    },
    {
      title: 'Performance Report',
      description: 'Quiz scores and academic performance data',
      icon: BarChart3,
      color: 'amber',
      data: performanceReport,
      lastUpdated: new Date().toLocaleDateString()
    }
  ]

  const ReportCard = ({ report }: { report: typeof reports[0] }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-${report.color}-100 rounded-xl flex items-center justify-center`}>
          <report.icon size={20} className={`text-${report.color}-600`} />
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {report.records} records
        </span>
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-2">{report.title}</h3>
      <p className="text-sm text-gray-500 mb-4">{report.description}</p>
      
      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
        <span>Updated: {report.lastUpdated}</span>
        {report.data && (
          <span>Size: {(report.data.size / 1024).toFixed(1)} KB</span>
        )}
      </div>
      
      <div className="flex gap-2">
        {report.data ? (
          <>
            <form action={`/api/reports/download?file=${report.data.filename}`} method="POST">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
              >
                <Download size={14} />
                Download CSV
              </button>
            </form>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition">
              <Filter size={14} />
              Filter
            </button>
          </>
        ) : (
          <button disabled className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed">
            <FileText size={14} />
                No Data
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-green-200 hover:text-white text-sm mb-4 transition">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Reports & Data Export</h1>
              <p className="text-green-200 text-sm">Generate and download platform analytics reports</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{userData?.length || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Paying Users</p>
            <p className="text-2xl font-bold text-green-600">{revenueData?.length || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Activities Logged</p>
            <p className="text-2xl font-bold text-blue-600">{activityData?.length || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Quiz Attempts</p>
            <p className="text-2xl font-bold text-purple-600">{quizData?.length || 0}</p>
          </div>
        </div>

        {/* Available Reports */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Available Reports</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={14} />
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.map((report) => (
              <ReportCard key={report.title} report={report} />
            ))}
          </div>
        </div>

        {/* Scheduled Reports */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Reports</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Weekly Performance Summary</p>
                <p className="text-sm text-gray-500">Every Monday at 9:00 AM</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                Configure
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Monthly Revenue Report</p>
                <p className="text-sm text-gray-500">1st of each month at 8:00 AM</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                Configure
              </button>
            </div>
          </div>
        </div>

        {/* Export History */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Exports</h2>
          <div className="text-center py-8 text-gray-400">
            <FileText size={40} className="mx-auto mb-3" />
            <p className="font-medium">No recent exports</p>
            <p className="text-sm mt-1">Downloaded reports will appear here</p>
          </div>
        </div>
      </div>
    </div>
  )
}
