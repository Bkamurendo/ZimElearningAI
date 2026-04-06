'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Brain,
  BarChart3,
  CalendarDays,
  Star,
  CheckCircle2,
  Zap,
  ChevronRight,
  Trophy,
  Bell,
  ClipboardList,
  PlayCircle,
  CalendarCheck,
  Clock,
  Sparkles,
  LayoutDashboard,
  GraduationCap,
  ListTodo
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabContent } from '@/components/ui/Tabs'
import PassPulseRings from './PassPulseRings'
import { fireConfetti } from '@/lib/confetti'

const SUBJECT_COLORS = [
  'from-emerald-400 to-emerald-600',
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
  'from-indigo-400 to-indigo-600',
  'from-teal-400 to-teal-600',
  'from-red-400 to-red-600',
]

interface DashboardClientProps {
  user: any
  profile: any
  studentProfile: any
  subjects: any[]
  stats: any[]
  notifications: any[]
  recentBadges: any[]
  continueItems: any[]
  upcomingExams: any[]
  studyPlan: any
  pendingAssignmentsCount: number
  dailyChallengeCompleted: boolean
  dailyChallengeScore: number | null
}

export default function DashboardClient({
  user,
  profile,
  studentProfile,
  subjects,
  stats,
  notifications,
  recentBadges,
  continueItems,
  upcomingExams,
  studyPlan,
  pendingAssignmentsCount,
  dailyChallengeCompleted,
  dailyChallengeScore
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Student'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const levelLabel = studentProfile?.zimsec_level?.toUpperCase() ?? 'O-LEVEL'

  const dashboardTabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'learning', label: 'My Learning', icon: <GraduationCap size={16} /> },
    { id: 'tasks', label: 'Exams & Tasks', icon: <ListTodo size={16} /> }
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-6">
      
      {/* Premium Welcome Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge variant="emerald" size="sm" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mb-2">
               {studentProfile?.grade} · {levelLabel}
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {greeting}, <span className="text-emerald-400">{firstName}</span>!
            </h1>
            <p className="text-slate-400 text-sm sm:text-base font-medium max-w-md">
              You're making great progress. Ready to tackle today's ZIMSEC revision?
            </p>
          </div>

          <div className="flex items-center gap-4">
             {/* Dynamic Stats Pill */}
             <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-4 rounded-3xl text-center min-w-[100px]">
                <Zap size={20} className="text-yellow-400 mx-auto mb-1 animate-pulse" />
                <p className="text-xl font-black text-white">
                  {stats?.find(s => s?.label === 'Topics mastered')?.value ?? 0}
                </p>
                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Mastered</p>
             </div>
             
             {/* Streak Pill */}
             <div className="bg-orange-500/10 backdrop-blur-md border border-orange-500/20 p-4 rounded-3xl text-center min-w-[100px]">
                <p className="text-xl font-black text-orange-500">🔥 {studentProfile?.current_streak ?? profile?.current_streak ?? 0}</p>
                <p className="text-[10px] uppercase font-black text-orange-500/60 tracking-widest">Day Streak</p>
             </div>

             <Button 
                onClick={() => {
                  try {
                    fireConfetti()
                  } catch (e) {
                    console.error('Confetti failed', e)
                  }
                }} 
                variant="premium" 
                size="icon" 
                className="rounded-full w-12 h-12 shrink-0 animate-bounce"
                title="Celebrate your progress!"
              >
                🎉
              </Button>
          </div>
        </div>
      </div>

      {/* Modern Tabbed Navigation */}
      <div className="sticky top-4 z-40 flex justify-center">
        <Tabs tabs={dashboardTabs} activeTab={activeTab} onChange={setActiveTab} className="shadow-xl shadow-slate-900/5" />
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        <TabContent id="overview" activeTab={activeTab}>
          <div className="space-y-6">
            {/* Mission Hub (Mastery Heatmap) */}
            <Card glass className="border-emerald-100/50 dark:border-emerald-900/20">
               <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
                       <CheckCircle2 size={16} className="text-white" />
                    </div>
                    <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">Syllabus Mastery Hub</h2>
                  </div>
                  <Badge variant="blue">Real-time ZIMSEC Alignment</Badge>
               </CardHeader>
               <CardContent>
                  <div className="min-h-[100px]">
                    <PassPulseRings />
                  </div>
               </CardContent>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map(({ label, value, icon: Icon, color, bg, border }, idx) => (
                  <Card key={label} hover className={`p-5 border-t-4 ${border}`}>
                    <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3 shadow-inner`}>
                      <Icon size={20} className={color} />
                    </div>
                    <p className={`text-3xl font-black ${color}`}>{value}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{label}</p>
                  </Card>
                ))}
            </div>

            {/* Daily Challenge Promo */}
            <Link href="/student/challenges">
              <Card className="bg-gradient-to-r from-amber-500 to-orange-600 border-none relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:scale-110 transition-transform duration-500" />
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-[1.25rem] flex items-center justify-center shadow-lg">
                       <Zap size={24} className="text-yellow-300 animate-bounce" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white italic tracking-tight">DAILY SURVIVAL CHALLENGE</h3>
                      <p className="text-amber-100 text-sm font-medium">
                        {dailyChallengeCompleted ? 'You survived today! Check your ranking.' : '5 Questions · 50 XP Reward · One Life.'}
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary" size="md" className="bg-white text-orange-600 border-none font-black shadow-lg">
                    {dailyChallengeCompleted ? 'Leaderboard' : 'Start Mission'}
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabContent>

        <TabContent id="learning" activeTab={activeTab}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Continue Studying (Left) */}
            <div className="lg:col-span-2 space-y-4">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <PlayCircle size={14} /> Resume Learning Path
               </h3>
               {continueItems.length > 0 ? (
                 <div className="grid gap-3">
                    {continueItems.map((item, idx) => (
                      <Link key={item.lessonId} href={`/student/lessons/${item.lessonId}`}>
                        <Card hover className="group p-4 flex items-center gap-4 hover:border-emerald-300">
                          <div className={`w-12 h-12 bg-gradient-to-br ${SUBJECT_COLORS[idx % SUBJECT_COLORS.length]} rounded-2xl flex items-center justify-center shadow-md text-white font-black shrink-0`}>
                             {item.subjectCode.split('-')[1]?.slice(0, 2) ?? 'Z'}
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.subjectName}</p>
                             <h4 className="text-base font-bold text-slate-800 dark:text-white truncate">{item.lessonTitle}</h4>
                          </div>
                          <ChevronRight className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                        </Card>
                      </Link>
                    ))}
                 </div>
               ) : (
                 <Card className="p-8 text-center border-dashed">
                   <p className="text-slate-400 text-sm font-medium">Ready to start your journey? Pick a subject below.</p>
                 </Card>
               )}

               {/* Subjects Grid */}
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pt-4">
                 <BookOpen size={14} /> My ZIMSEC Subjects
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {subjects.map((s, idx) => (
                    <Link key={s.code} href={`/student/subjects/${s.code}`}>
                      <Card hover glass className="p-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                           <div className={`w-10 h-10 bg-gradient-to-br ${SUBJECT_COLORS[idx % SUBJECT_COLORS.length]} rounded-xl flex items-center justify-center shadow-lg text-white font-black text-xs`}>
                              {s.code.split('-')[1]?.slice(0, 2) ?? 'Z'}
                           </div>
                           <Badge variant="emerald">82% Prep</Badge>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800 dark:text-white">{s.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.code}</p>
                        </div>
                        <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500 w-4/5 rounded-full" />
                        </div>
                      </Card>
                    </Link>
                  ))}
               </div>
            </div>

            {/* Quick Actions & Recent Achievements (Right) */}
            <div className="space-y-6">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Growth Center</h3>
               <div className="grid grid-cols-1 gap-3">
                  <Link href="/student/ai-workspace">
                    <Card hover className="bg-slate-900 border-slate-800 p-5 group flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                             <Sparkles size={18} />
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">Ask MaFundi AI</p>
                            <p className="text-slate-400 text-[10px] uppercase font-black">24/7 Personal Tutor</p>
                          </div>
                       </div>
                       <ChevronRight className="text-slate-600" />
                    </Card>
                  </Link>

                  <Link href="/student/progress">
                    <Card hover className="p-5 group flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                             <BarChart3 size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-sm">My Progress</p>
                            <p className="text-slate-400 text-[10px] uppercase font-black">In-depth Analytics</p>
                          </div>
                       </div>
                       <ChevronRight className="text-slate-300" />
                    </Card>
                  </Link>
               </div>

               {/* Recent Achievements Card */}
               {recentBadges.length > 0 && (
                 <Card glass className="border-amber-100/50 dark:border-amber-900/20">
                   <CardHeader className="flex flex-row items-center justify-between">
                      <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Recent Trophies</h3>
                      <Trophy size={14} className="text-amber-500" />
                   </CardHeader>
                   <CardContent className="space-y-3">
                      {recentBadges.map((b, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white/50 dark:bg-slate-900/50 p-2 rounded-xl border border-amber-50 dark:border-amber-900/10">
                           <span className="text-xl">🏅</span>
                           <div className="min-w-0">
                              <p className="text-xs font-bold text-amber-900 dark:text-amber-100 truncate">{b.badge_name}</p>
                              <p className="text-[10px] text-amber-600/60 font-bold uppercase tracking-tighter">Achievement Unlocked</p>
                           </div>
                        </div>
                      ))}
                   </CardContent>
                 </Card>
               )}
            </div>
          </div>
        </TabContent>

        <TabContent id="tasks" activeTab={activeTab}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Exams Center */}
             <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <CalendarCheck size={14} /> Official ZIMSEC Timetable
                </h3>
                {upcomingExams.length > 0 ? (
                  <div className="grid gap-3">
                     {upcomingExams.map(exam => {
                       const subj = exam.subjects as any
                       const days = Math.ceil((new Date(exam.exam_date).getTime() - Date.now()) / 86400000)
                       const urgencyStatus = days <= 7 ? 'rose' : days <= 14 ? 'amber' : 'emerald'
                       
                       return (
                         <Card key={exam.id} hover className={`p-5 relative border-l-8 border-l-${urgencyStatus}-500 overflow-hidden`}>
                           <div className="flex items-start justify-between">
                              <div>
                                 <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{subj?.name ?? 'Exam'}</h4>
                                 <div className="flex items-center gap-4 mt-1">
                                    <Badge variant="slate" size="xs">Paper {exam.paper_number}</Badge>
                                    <p className="text-xs text-slate-400 font-bold">{new Date(exam.exam_date).toLocaleDateString('en-ZW', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className={`text-2xl font-black text-${urgencyStatus}-600 leading-none`}>{days <= 0 ? 'GO!' : days}</p>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Days Left</p>
                              </div>
                           </div>
                           <Link href="/student/ai-workspace" className="mt-4 inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                              <Sparkles size={12} /> Personalized Prep
                           </Link>
                         </Card>
                       )
                     })}
                  </div>
                ) : (
                  <Card className="p-10 text-center border-dashed">
                     <p className="text-slate-400 text-sm italic font-medium">No official exams added yet. Sync your timetable in settings.</p>
                  </Card>
                )}
             </div>

             {/* Missions & Tasks */}
             <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ListTodo size={14} /> Training Missions (Assignments)
                </h3>
                <Link href="/student/assignments">
                  <Card hover className="p-8 text-center group cursor-pointer border-t-8 border-orange-500">
                     <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform">
                        <ClipboardList size={28} className="text-orange-500" />
                     </div>
                     <p className="text-2xl font-black text-slate-800 dark:text-white">{pendingAssignmentsCount}</p>
                     <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Pending Assignments</p>
                     <Button variant="outline" size="sm" className="mt-4 border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-600">
                        View All Tasks
                     </Button>
                  </Card>
                </Link>

                {/* Notifications Quick-Access */}
                <Card className="overflow-hidden">
                   <CardHeader className="bg-slate-50 dark:bg-slate-900/50 flex flex-row items-center justify-between py-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intelligence Briefing</h4>
                      <Bell size={14} className="text-slate-400" />
                   </CardHeader>
                   <CardContent className="divide-y divide-slate-50 dark:divide-slate-800 p-0">
                      {notifications.map(n => (
                        <div key={n.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition flex gap-3">
                           <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                           <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{n.title}</p>
                              <p className="text-[10px] text-slate-500 truncate">{n.message}</p>
                           </div>
                        </div>
                      ))}
                      <Link href="/student/notifications" className="block text-center py-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                         View All Intelligence
                      </Link>
                   </CardContent>
                </Card>
             </div>
          </div>
        </TabContent>
      </div>

    </div>
  )
}
