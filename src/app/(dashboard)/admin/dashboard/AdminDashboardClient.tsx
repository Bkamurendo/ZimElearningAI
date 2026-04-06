'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  BookOpen,
  GraduationCap,
  LayoutList,
  Shield,
  Library,
  Megaphone,
  Globe,
  BarChart2,
  BarChart3,
  Settings,
  Bell,
  ClipboardList,
  HelpCircle,
  Building2,
  CreditCard,
  Clock,
  TrendingUp,
  Activity,
  FileText,
  Monitor,
  Brain,
  MessageSquare,
  AlertTriangle,
  LayoutDashboard,
  Database,
  Cpu,
  ChevronRight,
  LogOut
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tabs, TabContent } from '@/components/ui/Tabs'
import { logout } from '@/app/actions/auth'

// Icon resolver for serializable props
const IconResolver = ({ id, ...props }: { id: string; [key: string]: any }) => {
  const icons: Record<string, any> = {
    Users,
    BookOpen,
    GraduationCap,
    LayoutList,
    Shield,
    Library,
    Megaphone,
    Globe,
    BarChart2,
    BarChart3,
    Settings,
    Bell,
    ClipboardList,
    HelpCircle,
    Building2,
    CreditCard,
    Clock,
    TrendingUp,
    Activity,
    FileText,
    Monitor,
    Brain,
    MessageSquare,
    AlertTriangle,
    LayoutDashboard,
    Database,
    Cpu,
    ChevronRight,
    LogOut
  }
  const Icon = icons[id] || HelpCircle
  return <Icon {...props} />
}

interface AdminDashboardClientProps {
  user: any
  profile: any
  stats: any[]
  endingTodayCount: number
  expiringSoon: any[]
  cohortByMonth: Record<string, number>
  totalUsers: number
  liveActiveUsers: number
  currentMRR: number
  potentialMRR: number
  activeTrials: any[]
  paidUsers: any[]
  eliteUsers: any[]
  pendingModeration: number
  totalDocuments: number
  publishedDocuments: number
  pendingTeachers: number
  activeAnnouncements: number
  totalQuestions: number
}

export default function AdminDashboardClient({
  user,
  profile,
  stats = [],
  endingTodayCount = 0,
  expiringSoon = [],
  cohortByMonth = {},
  totalUsers = 0,
  liveActiveUsers = 0,
  currentMRR = 0,
  potentialMRR = 0,
  activeTrials = [],
  paidUsers = [],
  eliteUsers = [],
  pendingModeration = 0,
  totalDocuments = 0,
  publishedDocuments = 0,
  pendingTeachers = 0,
  activeAnnouncements = 0,
  totalQuestions = 0
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Admin'

  const adminTabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={14} /> },
    { id: 'platform', label: 'Platform', icon: <Cpu size={14} /> },
    { id: 'content', label: 'Content', icon: <Database size={14} /> },
    { id: 'analytics', label: 'Insights', icon: <TrendingUp size={14} /> }
  ]

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      {/* Premium Admin Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 dark:bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-black text-slate-900 dark:text-white tracking-tight uppercase text-sm">ZimLearn HQ</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/admin/settings" className="hidden sm:block text-right group">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-none group-hover:text-emerald-500 transition-colors">{profile?.full_name}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Super Administrator</p>
            </Link>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="icon" className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                <LogOut size={18} />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
           <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Welcome back, <span className="text-emerald-500">{firstName}</span>.
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                Here&apos;s the latest intelligence from MaFundi platform.
              </p>
           </div>
           
           <div className="flex gap-2">
              <Tabs tabs={adminTabs} activeTab={activeTab} onChange={setActiveTab} className="bg-white dark:bg-slate-900 shadow-sm" />
           </div>
        </div>

        {/* Urgent Alerts */}
        <div className="space-y-4">
          {endingTodayCount > 0 && (
            <div className="bg-rose-500 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-rose-500/20 animate-pulse">
               <div className="flex items-center gap-3">
                 <AlertTriangle size={20} />
                 <div>
                    <p className="font-black uppercase tracking-tight text-sm">{endingTodayCount} TRIALS EXPIRING TODAY</p>
                    <p className="text-xs font-medium text-rose-100">Immediate action recommended to prevent student churn.</p>
                 </div>
               </div>
               <Link href="/admin/trials">
                 <Button variant="secondary" size="sm" className="bg-white text-rose-600 border-none font-black shadow-sm">MANAGE</Button>
               </Link>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {pendingTeachers > 0 && (
               <Card glass className="bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20">
                  <CardContent className="p-4 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600">
                           <GraduationCap size={18} />
                        </div>
                        <div>
                           <p className="text-xs font-black text-blue-900 dark:text-blue-100 uppercase tracking-widest leading-none">{pendingTeachers} TEACHER APPLICATIONS</p>
                           <p className="text-[11px] text-blue-600 font-medium mt-1">Awaiting your approval to start teaching.</p>
                        </div>
                     </div>
                     <Link href="/admin/teachers">
                        <Button variant="ghost" size="icon"><ChevronRight size={16} /></Button>
                     </Link>
                  </CardContent>
               </Card>
             )}

             {pendingModeration > 0 && (
               <Card glass className="bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20">
                  <CardContent className="p-4 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center text-amber-600">
                           <FileText size={18} />
                        </div>
                        <div>
                           <p className="text-xs font-black text-amber-900 dark:text-amber-100 uppercase tracking-widest leading-none">{pendingModeration} DOCS IN MODERATION</p>
                           <p className="text-[11px] text-amber-600 font-medium mt-1">Content needs human review before publishing.</p>
                        </div>
                     </div>
                     <Link href="/admin/documents">
                        <Button variant="ghost" size="icon"><ChevronRight size={16} /></Button>
                     </Link>
                  </CardContent>
               </Card>
             )}
          </div>
        </div>

        {/* Tab Contents */}
        <TabContent id="overview" activeTab={activeTab}>
          <div className="space-y-8">
            {/* Core Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.slice(0, 4).map((s, idx) => (
                  <Link key={s.label} href={s.href ?? '#'}>
                    <Card hover className={`p-6 border-t-4 ${s.border ?? 'border-t-slate-800'}`}>
                        <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center mb-4`}>
                          <IconResolver id={s.iconId} size={22} className={s.color} />
                        </div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{s.value}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">{s.label}</p>
                    </Card>
                  </Link>
                ))}
                {stats.slice(4, 8).map((s, idx) => (
                  <Link key={s.label} href={s.href ?? '#'}>
                    <Card hover className={`p-6 border-t-4 ${s.border ?? 'border-t-slate-800'}`}>
                        <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center mb-4`}>
                          <IconResolver id={s.iconId} size={22} className={s.color} />
                        </div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{s.value}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">{s.label}</p>
                    </Card>
                  </Link>
                ))}
            </div>

            {/* Conversion Analysis Card */}
            <Card glass className="p-8 border-slate-200/50 dark:border-slate-800/50">
                <div className="flex flex-col md:flex-row items-center gap-12">
                  <div className="flex-1 space-y-6">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Growth Insights</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Active (15m)</p>
                            <p className="text-4xl font-black text-emerald-500 mt-1">{liveActiveUsers}</p>
                            <p className="text-[10px] text-slate-500 mt-2">Potential MRR: ${potentialMRR.toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real Monthly MRR</p>
                            <p className="text-4xl font-black text-blue-500 mt-1">${currentMRR.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500 mt-2">
                                {totalUsers > 0 ? ((paidUsers.length / totalUsers) * 100).toFixed(1) : 0}% Real Conversion Rate
                            </p>
                        </div>
                      </div>
                  </div>
                  
                  {/* Visual Cohort Bar Chart (Real Data) */}
                  <div className="w-full md:w-1/3 space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration Trends (Real)</h4>
                      <div className="flex items-end gap-3 h-32 pt-4">
                        {Object.entries(cohortByMonth).slice(-3).map(([month, count]) => (
                            <div key={month} className="flex-1 space-y-2 group">
                              <div className="relative w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden h-full flex flex-col justify-end">
                                  <div 
                                    className="bg-emerald-500 w-full rounded-t-lg transition-all duration-1000 group-hover:bg-emerald-400" 
                                    style={{ height: `${(count / Math.max(1, ...Object.values(cohortByMonth))) * 100}%` }}
                                  />
                              </div>
                              <p className="text-[10px] font-bold text-center text-slate-500">{month}</p>
                            </div>
                        ))}
                      </div>
                  </div>
                </div>
            </Card>
          </div>
        </TabContent>

        <TabContent id="platform" activeTab={activeTab}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { href: '/admin/users', title: 'User HQ', desc: `${totalUsers} Registered Students`, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { href: '/admin/teachers', title: 'Teacher Approvals', desc: pendingTeachers > 0 ? `${pendingTeachers} Pending Applications` : 'Fully Staffed', icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                { href: '/admin/announcements', title: 'Broadcasts', desc: `${activeAnnouncements} Active Announcements`, icon: Megaphone, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { href: '/admin/notifications/send', title: 'Push Comms', desc: 'Global Notification System', icon: Bell, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                { href: '/admin/notifications/sms', title: 'SMS Gateway', desc: "Africa's Talking Integration", icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { href: '/admin/schools', title: 'License Center', desc: 'B2B School Subscriptions', icon: Building2, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                { href: '/admin/settings', title: 'Global Settings', desc: 'Feature Flags & Limits', icon: Settings, color: 'text-slate-500', bg: 'bg-slate-500/10' },
                { href: '/admin/security', title: 'Watchtower', desc: 'Audit Logs & Security Logs', icon: Shield, color: 'text-rose-500', bg: 'bg-rose-500/10' },
              ].map((item) => (
                <Link key={item.title} href={item.href}>
                  <Card hover glass className="p-6 group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                            <item.icon size={22} />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">{item.title}</h4>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wide">{item.desc}</p>
                        </div>
                      </div>
                  </Card>
                </Link>
              ))}
            </div>
        </TabContent>

        <TabContent id="content" activeTab={activeTab}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { href: '/admin/subjects', title: 'ZIMSEC Syllabus', desc: 'Curriculum & Subjects Manager', icon: LayoutList, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { href: '/admin/seed-content', title: 'Harvest Engine', desc: 'Ingest Courses & Lessons', icon: BookOpen, color: 'text-green-500', bg: 'bg-green-500/10' },
                { href: '/admin/questions', title: 'Exam Bank', desc: `${totalQuestions} Curated Questions`, icon: HelpCircle, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { href: '/admin/documents', title: 'Knowledge Base', desc: `${totalDocuments} Uploaded Documents`, icon: Library, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { href: '/admin/documents/fetch-web', title: 'Orbital Fetcher', desc: 'Scrape External Content', icon: Globe, color: 'text-sky-500', bg: 'bg-sky-500/10' },
                { href: '/admin/content', title: 'Bulk Operations', desc: 'Mass Moderation & Edits', icon: Database, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              ].map((item) => (
                <Link key={item.title} href={item.href}>
                  <Card hover glass className="p-6 group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                            <item.icon size={22} />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">{item.title}</h4>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wide">{item.desc}</p>
                        </div>
                      </div>
                  </Card>
                </Link>
              ))}
            </div>
        </TabContent>

        <TabContent id="analytics" activeTab={activeTab}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { href: '/admin/analytics', title: 'MaFundi Intelligence', desc: 'Platform behavior insights', icon: Brain, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                { href: '/admin/engagement', title: 'Retention Heat', desc: 'User stickiness metrics', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                { href: '/admin/monitoring', title: 'System Pulse', desc: 'Real-time performance', icon: Monitor, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                { href: '/admin/payments', title: 'Treasury', desc: 'Revenue & Subscription tracking', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { href: '/admin/cohort', title: 'Cohort Science', desc: 'Advanced conversion funnels', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { href: '/admin/reports', title: 'Data Foundry', desc: 'Export & Custom Reporting', icon: BarChart3, color: 'text-slate-500', bg: 'bg-slate-500/10' },
              ].map((item) => (
                <Link key={item.title} href={item.href}>
                  <Card hover glass className="p-6 group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                            <item.icon size={22} />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">{item.title}</h4>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wide">{item.desc}</p>
                        </div>
                      </div>
                  </Card>
                </Link>
              ))}
            </div>
        </TabContent>

      </main>
    </div>
  )
}
