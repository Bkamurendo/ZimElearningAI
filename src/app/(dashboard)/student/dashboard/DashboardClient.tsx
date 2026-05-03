'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  BarChart3,
  CheckCircle2,
  Zap,
  ChevronRight,
  Trophy,
  Bell,
  ClipboardList,
  PlayCircle,
  CalendarCheck,
  Sparkles,
  LayoutDashboard,
  GraduationCap,
  ListTodo,
  Brain,
  Star,
  MessageSquare,
  Lock,
} from 'lucide-react'

// Icons mapped by stat label — avoids passing component functions across the server/client boundary
const STAT_ICONS: Record<string, React.ElementType> = {
  'Subjects': BookOpen,
  'Lessons done': CheckCircle2,
  'Quizzes done': Brain,
  'Topics mastered': Star,
}import MaFundiMissionCard from '@/components/dashboard/MaFundiMissionCard'
import GettingStartedChecklist from '@/components/GettingStartedChecklist'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabContent } from '@/components/ui/Tabs'
import PassPulseRings from './PassPulseRings'
import { fireConfetti } from '@/lib/confetti'
import LearningMinutesTracker from './LearningMinutesTracker'
import AdaptivePath from './AdaptivePath'
import ParentSyncDialog from '@/components/ParentSyncDialog'
import SquadsWidget from './SquadsWidget'

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
  hasExamDates?: boolean
  hasUsedMaFundi?: boolean
  learningMinutesToday: number
}

export default function DashboardClient({
  user: _user,
  profile,
  studentProfile,
  subjects,
  stats,
  notifications,
  recentBadges,
  continueItems,
  upcomingExams,
  studyPlan: _studyPlan,
  pendingAssignmentsCount,
  dailyChallengeCompleted,
  dailyChallengeScore: _dailyChallengeScore,
  hasExamDates = false,
  hasUsedMaFundi = false,
  learningMinutesToday = 0,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState('learning') // Default to learning for better engagement

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Student'  const levelLabel = studentProfile?.zimsec_level?.toUpperCase() ?? 'O-LEVEL'

  const dashboardTabs = [
    { id: 'learning', label: 'My Lessons', icon: <GraduationCap size={16} /> },
    { id: 'overview', label: 'Fun Zone', icon: <LayoutDashboard size={16} /> },
    { id: 'tasks', label: 'Homework', icon: <ListTodo size={16} /> }
  ]

  const primaryMission = continueItems[0]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-8">
      
      {/* Parental Engagement Loop */}
      <ParentSyncDialog existingPhone={(profile as any)?.parent_phone} />
      
      {/* Trial Status Banner */}
      {profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date() && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-amber-200/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white shrink-0">
              <Zap size={20} className="animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase tracking-tight italic">PRO TRIAL ACTIVE</p>
              <p className="text-[10px] text-amber-100 font-bold uppercase tracking-widest">
                Ends {new Date(profile.trial_ends_at).toLocaleDateString('en-ZW', { day: 'numeric', month: 'short' })} · UNLIMITED AI ACCESS
              </p>
            </div>
          </div>
          <Link href="/student/upgrade">
            <Button size="sm" className="bg-white text-orange-600 border-none font-black text-[10px] uppercase tracking-widest">
              Keep Pro
            </Button>
          </Link>
        </div>
      )}
      
      {/* ── THE MAFUNDI COMMAND CENTER (CORE) ── */}
      <MaFundiMissionCard 
        studentName={firstName}
        currentSubject={primaryMission?.subjectName}
        nextLesson={primaryMission?.lessonTitle}
        lessonId={primaryMission?.lessonId}
        progress={Math.round((stats?.find(s => s?.label === 'Topics mastered')?.value ?? 0) * 1.5) % 100 || 15}
      />

      {/* Modern Tabbed Navigation */}
      <div className="sticky top-4 z-40 flex justify-center">
        <Tabs tabs={dashboardTabs} activeTab={activeTab} onChange={setActiveTab} className="shadow-2xl shadow-slate-900/10" />
      </div>

      {/* Tab Contents */}
      <div className="space-y-8">
        <TabContent id="learning" activeTab={activeTab}>
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Adaptive Path & Continue Studying (Left) */}
            <div className="lg:col-span-2 space-y-8">
               <AdaptivePath />

               <div className="flex items-center justify-between px-1">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <PlayCircle size={14} /> Back to My Book
                 </h3>
               </div>

               {continueItems.length > 0 ? (
                 <div className="grid gap-3">
                    {continueItems.map((item, idx) => (
                      <Link key={item.lessonId} href={`/student/lessons/${item.lessonId}`}>
                        <Card hover className="group p-5 flex items-center gap-4 border-slate-100 hover:border-emerald-300 transition-all">
                          <div className={`w-14 h-14 bg-gradient-to-br ${SUBJECT_COLORS[idx % SUBJECT_COLORS.length]} rounded-2xl flex items-center justify-center shadow-lg text-white font-black shrink-0`}>
                             {item.subjectCode.split('-')[1]?.slice(0, 2) ?? 'Z'}
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{item.subjectName}</p>
                             <h4 className="text-lg font-black text-slate-800 dark:text-white truncate uppercase tracking-tight">{item.lessonTitle}</h4>
                          </div>
                          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <ChevronRight size={18} />
                          </div>
                        </Card>
                      </Link>
                    ))}
                 </div>
               ) : (
                 <Card className="p-12 text-center border-dashed bg-slate-50/50">
                   <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Pick a book below to start!</p>
                 </Card>
               )}

               {/* Subjects Grid */}
               <div className="flex items-center justify-between px-1 pt-4">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <BookOpen size={14} /> My School Books
                 </h3>
                 <Link href="/student/subjects" className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">See All</Link>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {subjects.map((s, idx) => (
                    <Link key={s.code} href={`/student/subjects/${s.code}`}>
                      <Card hover glass className="p-5 flex flex-col gap-4 border-slate-100">
                        <div className="flex items-center justify-between">
                           <div className={`w-12 h-12 bg-gradient-to-br ${SUBJECT_COLORS[idx % SUBJECT_COLORS.length]} rounded-2xl flex items-center justify-center shadow-xl text-white font-black text-sm`}>
                              {s.code.split('-')[1]?.slice(0, 2) ?? 'Z'}
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.code}</p>
                              <p className="text-sm font-black text-emerald-600 uppercase italic">
                                {Math.round((stats?.find(st => st.label === 'Topics mastered')?.value || 0) / (subjects.length || 1) + (idx * 5)) % 100}% DONE
                              </p>
                           </div>
                        </div>
                        <h4 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">{s.name}</h4>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                           <div 
                             className={`h-full bg-gradient-to-r ${SUBJECT_COLORS[idx % SUBJECT_COLORS.length]} rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]`} 
                             style={{ width: `${Math.round((stats?.find(st => st.label === 'Topics mastered')?.value || 0) / (subjects.length || 1) + (idx * 5)) % 100}%` }} 
                           />
                        </div>
                      </Card>
                    </Link>
                  ))}
               </div>
            </div>

            {/* Growth Center (Right) */}
            <div className="space-y-6">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Study Tools</h3>
               <div className="grid grid-cols-1 gap-3">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                    <Link href="https://wa.me/263782876599?text=Mhoro MaFundi! I am registered on ZimLearn AI and I need help with my studies." target="_blank">
                      <Card className="relative p-6 group flex items-center justify-between border-emerald-500/30 bg-white/80 backdrop-blur-xl">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                               <MessageSquare size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-black text-sm uppercase tracking-tight text-slate-900">WhatsApp Help</p>
                                <Badge variant="emerald" size="xs">ACTIVE</Badge>
                              </div>
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Talk to MaFundi</p>
                            </div>
                         </div>
                         <ChevronRight className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
                      </Card>
                    </Link>
                  </div>

                  <Link href="/student/progress">
                    <Card hover className="p-6 group flex items-center justify-between border-slate-100">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                             <BarChart3 size={20} />
                          </div>
                          <div>
                            <p className="font-black text-sm uppercase tracking-tight text-slate-900">How am I doing?</p>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">My Progress</p>
                          </div>
                       </div>
                       <ChevronRight className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </Card>
                  </Link>

                  <Link href="/student/offline">
                    <Card hover className="p-6 group flex items-center justify-between border-slate-100">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600">
                             <LayoutDashboard size={20} />
                          </div>
                          <div>
                            <p className="font-black text-sm uppercase tracking-tight text-slate-900">Saved Books</p>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Study Offline</p>
                          </div>
                       </div>
                       <ChevronRight className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </Card>
                  </Link>
               </div>

               {/* Recent Trophies */}
               {recentBadges.length > 0 && (
                 <Card glass className="border-slate-100 rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                       <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">My Stars</h3>
                       <Trophy size={14} className="text-amber-500" />
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                       {recentBadges.map((b, i) => (
                         <div key={i} className="flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">⭐</div>
                            <div className="min-w-0">
                               <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">{b.badge_name}</p>
                               <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">You won a Star!</p>
                            </div>
                         </div>
                       ))}
                    </CardContent>
                 </Card>
               )}
            </div>
          </div>
        </TabContent>

        <TabContent id="overview" activeTab={activeTab}>
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Pass Pulse & Heatmap */}
               <Card glass className="border-emerald-100 rounded-[2.5rem] p-8">
                  <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-tight mb-8">My Weekly Progress</h2>
                  <PassPulseRings />
               </Card>

               <div className="space-y-8">
                  {/* Daily Focus */}
                  <LearningMinutesTracker minutesToday={learningMinutesToday} targetMinutes={60} />
                  
                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                      {stats.map(({ label, value, color, bg, border }, _idx) => {
                        const Icon = STAT_ICONS[label] ?? BookOpen
                        // Rename labels for UI
                        const displayLabel = label === 'Topics mastered' ? 'Books Finished' : label === 'Lessons done' ? 'Lessons Read' : label
                        return (
                        <Card key={label} className={`p-6 border-t-4 ${border} rounded-[2rem]`}>
                          <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-4 shadow-inner`}>
                            <Icon size={24} className={color} />
                          </div>
                          <p className={`text-4xl font-black ${color} tracking-tighter`}>{value}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">{displayLabel}</p>
                        </Card>
                        )
                      })}
                  </div>
               </div>
            </div>

            {/* Daily Challenge Promo */}
            <Link href="/student/challenges">
              <Card className="bg-slate-900 border-none relative overflow-hidden group rounded-[2.5rem] p-1">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 blur-[100px] -translate-y-1/2 translate-x-1/4 group-hover:scale-110 transition-transform duration-1000" />
                <CardContent className="flex flex-col md:flex-row items-center justify-between p-10 gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-amber-500/20 group-hover:rotate-12 transition-transform duration-500">
                       <Zap size={40} className="text-white animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white italic tracking-tight uppercase">Play & Win!</h3>
                      <p className="text-amber-500 text-sm font-black uppercase tracking-widest mt-1">
                        5 Fun Questions · Win 50 Points · Be the Best!
                      </p>
                    </div>
                  </div>
                  <Button className="h-16 px-10 rounded-2xl bg-amber-500 text-white font-black uppercase tracking-widest shadow-xl shadow-amber-900/40 hover:bg-amber-400 hover:scale-105 transition-all">
                    Play Now →
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Social Squads */}
            <SquadsWidget />
          </div>
        </TabContent>

        <TabContent id="tasks" activeTab={activeTab}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Exams Center */}
             <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <CalendarCheck size={14} /> My Exam Dates
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
                                 <p className={`text-2xl font-black text-${urgencyStatus}-600 leading-none`}>{days <= 0 ? 'NOW!' : days}</p>
                                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Days Left</p>
                              </div>
                           </div>
                           <Link href="/student/ai-workspace" className="mt-4 inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                              <Sparkles size={12} /> Get Ready with MaFundi
                           </Link>
                         </Card>
                       )
                     })}
                  </div>
                ) : (
                  <Card className="p-10 text-center border-dashed">
                     <p className="text-slate-400 text-sm italic font-medium">No exams yet. Add them in settings!</p>
                  </Card>
                )}
             </div>

             {/* Missions & Tasks */}
             <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ListTodo size={14} /> My Homework
                </h3>
                <Link href="/student/assignments">
                  <Card hover className="p-8 text-center group cursor-pointer border-t-8 border-orange-500">
                     <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform">
                        <ClipboardList size={28} className="text-orange-500" />
                     </div>
                     <p className="text-2xl font-black text-slate-800 dark:text-white">{pendingAssignmentsCount}</p>
                     <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Tasks to do</p>
                     <Button variant="outline" size="sm" className="mt-4 border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-600">
                        See All Homework
                     </Button>
                  </Card>
                </Link>

                {/* Notifications Quick-Access */}
                <Card className="overflow-hidden">
                   <CardHeader className="bg-slate-50 dark:bg-slate-900/50 flex flex-row items-center justify-between py-3">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">News from Teacher</h4>
                      <Bell size={14} className="text-slate-400" />
                   </CardHeader>
                   <CardContent className="divide-y divide-slate-50 dark:divide-slate-800 p-0">
                      {notifications.map(n => (
                        <div key={n.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition flex gap-3">
                           <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                           <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{n.title}</p>
                              <p className="text-xs text-slate-500 truncate">{n.message}</p>
                           </div>
                        </div>
                      ))}
                      <Link href="/student/notifications" className="block text-center py-2 text-xs font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                         See all News
                      </Link>
                   </CardContent>
                </Card>
             </div>
          </div>
        </TabContent>
   </TabContent>
      </div>

    </div>
  )
}
