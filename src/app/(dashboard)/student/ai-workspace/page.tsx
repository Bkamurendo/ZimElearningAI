import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Sparkles, BookOpen, ClipboardList, FileText, AlertTriangle,
  TrendingUp, CalendarCheck, ChevronRight, Brain, Target,
  Clock, Zap, Bot, Trophy,
} from 'lucide-react'
import WorkspaceActions from './WorkspaceActions'
import { MasteryHeatmap } from '@/components/MasteryHeatmap'

type SubjectCtx = {
  id: string; name: string; code: string; zimsec_level: string
  progress_pct: number; lessons_done: number; lessons_total: number
  quiz_avg: number | null; assignment_avg: number | null
}
type WeakTopic = { topic: string; subject_id: string; subject_name: string; mastery_level: string }
type UpcomingExam = { subject_id: string; subject_name: string; paper_number: string; exam_date: string; days_until: number }
type ContentLogRow = { id: string; content_type: string; content_id: string | null; topic: string | null; created_at: string; subject_id: string | null; subjects: { name: string } | null }
type SyllabusProgress = { subject_id: string; total_topics: number; mastered_topics: number; percentage: number }

function daysChip(days: number) {
  if (days <= 0) return { label: 'Today!', cls: 'bg-red-100 text-red-700' }
  if (days <= 7) return { label: `${days} days`, cls: 'bg-red-100 text-red-700' }
  if (days <= 14) return { label: `${days} days`, cls: 'bg-amber-100 text-amber-700' }
  return { label: `${days} days`, cls: 'bg-green-100 text-green-700' }
}

export default async function AIWorkspacePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('id, zimsec_level, grade')
    .eq('user_id', user.id)
    .single() as { data: { id: string; zimsec_level: string; grade: string } | null; error: unknown }

  if (!studentProfile) redirect('/student/dashboard')

  const sid = studentProfile.id

  // Fetch student context from API (reuse the aggregated data)
  let subjects: (SubjectCtx & { syllabus_pct: number })[] = []
  let weakTopics: WeakTopic[] = []
  let upcomingExams: UpcomingExam[] = []
  let syllabusStats: SyllabusProgress[] = []
  let streak = 0
  let xp = 0

  try {
    // Enrolled subjects
    const { data: enrolments } = await supabase
      .from('student_subjects')
      .select('subject_id, subjects(id, name, code, zimsec_level)')
      .eq('student_id', sid) as {
      data: { subject_id: string; subjects: { id: string; name: string; code: string; zimsec_level: string } | null }[] | null
      error: unknown
    }
    const rawSubjects = (enrolments ?? [])
      .map(e => e.subjects as unknown as { id: string; name: string; code: string; zimsec_level: string } | null)
      .filter(Boolean) as { id: string; name: string; code: string; zimsec_level: string }[]

    // Weak topics
    const { data: topicMastery } = await supabase
      .from('topic_mastery')
      .select('topic, mastery_level, subject_id')
      .eq('student_id', sid)
      .in('mastery_level', ['not_started', 'learning']) as {
      data: { topic: string; mastery_level: string; subject_id: string }[] | null
      error: unknown
    }
    weakTopics = (topicMastery ?? []).map(t => ({
      topic: t.topic,
      subject_id: t.subject_id,
      subject_name: rawSubjects.find(s => s.id === t.subject_id)?.name ?? '',
      mastery_level: t.mastery_level,
    }))

    // Upcoming exams
    const today = new Date().toISOString().split('T')[0]
    const in60 = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]
    const { data: exams } = await supabase
      .from('exam_timetable')
      .select('id, exam_date, paper_number, subject_id, subjects(name, code)')
      .eq('student_id', sid)
      .gte('exam_date', today)
      .lte('exam_date', in60)
      .order('exam_date', { ascending: true }) as {
      data: { id: string; exam_date: string; paper_number: string; subject_id: string; subjects: { name: string; code: string } | null }[] | null
      error: unknown
    }
    upcomingExams = (exams ?? []).map(e => {
      const subj = e.subjects as unknown as { name: string; code: string } | null
      return {
        subject_id: e.subject_id,
        subject_name: subj?.name ?? '',
        paper_number: e.paper_number,
        exam_date: e.exam_date,
        days_until: Math.ceil((new Date(e.exam_date).getTime() - Date.now()) / 86400000),
      }
    })

    // Quick progress per subject (lesson count only for speed)
    subjects = await Promise.all(rawSubjects.map(async s => {
      const { data: courses } = await supabase.from('courses').select('id').eq('subject_id', s.id).eq('published', true)
      const cIds = (courses ?? []).map(c => c.id as string)
      let done = 0, total = 0
      if (cIds.length > 0) {
        const { count: t } = await supabase.from('lessons').select('id', { count: 'exact', head: true }).in('course_id', cIds)
        const { data: lRows } = await supabase.from('lessons').select('id').in('course_id', cIds)
        const lIds = (lRows ?? []).map(l => l.id as string)
        if (lIds.length > 0) {
          const { count: d } = await supabase.from('lesson_progress').select('id', { count: 'exact', head: true }).eq('student_id', sid).in('lesson_id', lIds)
          done = d ?? 0
        }
        total = t ?? 0
      }

      // Syllabus progress calculation
      const { count: totalTopics } = await supabase.from('subject_topics').select('id', { count: 'exact', head: true }).eq('subject_id', s.id)
      const { count: masteredTopics } = await supabase.from('topic_mastery').select('id', { count: 'exact', head: true }).eq('student_id', sid).eq('subject_id', s.id).eq('mastery_level', 'mastered')
      const syllPct = (totalTopics ?? 0) > 0 ? Math.round(((masteredTopics ?? 0) / (totalTopics ?? 0)) * 100) : 0
      
      syllabusStats.push({ subject_id: s.id, total_topics: totalTopics ?? 0, mastered_topics: masteredTopics ?? 0, percentage: syllPct })

      return { ...s, progress_pct: total > 0 ? Math.round((done / total) * 100) : 0, lessons_done: done, lessons_total: total, quiz_avg: null, assignment_avg: null, syllabus_pct: syllPct }
    }))

    const { data: streakData } = await supabase.from('student_streaks').select('current_streak, total_xp').eq('student_id', sid).single() as { data: { current_streak: number, total_xp: number } | null; error: unknown }
    streak = streakData?.current_streak ?? 0
    xp = streakData?.total_xp ?? 0
  } catch (err) { console.error('[workspace] Context fetch error:', err) }

  // AI content log
  const { data: contentLog } = await supabase
    .from('ai_content_log')
    .select('id, content_type, content_id, topic, created_at, subject_id, subjects(name)')
    .eq('student_id', sid)
    .order('created_at', { ascending: false })
    .limit(50) as { data: ContentLogRow[] | null; error: unknown }

  const aiNotes = (contentLog ?? []).filter(l => l.content_type === 'notes')
  const aiExams = (contentLog ?? []).filter(l => l.content_type === 'mock_exam')
  const aiRevision = (contentLog ?? []).filter(l => l.content_type === 'revision')

  const levelLabel = studentProfile.zimsec_level === 'primary' ? 'Primary' : studentProfile.zimsec_level === 'olevel' ? 'O-Level' : 'A-Level'

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/3 translate-x-1/4 opacity-20"
            style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">MaFundi&apos;s Workspace</h1>
                <p className="text-purple-200 text-sm">Your personal AI teacher — {levelLabel} · {studentProfile.grade}</p>
              </div>
            </div>
            <p className="text-purple-100 text-sm mt-2">MaFundi creates personalised study materials based on your subjects, performance and upcoming exams.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {streak > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  <Zap size={12} className="text-yellow-300" /> {streak} day streak
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                <Trophy size={12} className="text-blue-300" /> {xp.toLocaleString()} XP
              </span>
            </div>
          </div>
        </div>

        {/* Generate buttons */}
        <WorkspaceActions 
          subjects={subjects.map(s => ({ id: s.id, name: s.name, code: s.code }))} 
          weakTopics={weakTopics}
        />

        {/* Upcoming exams */}
        {upcomingExams.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CalendarCheck size={14} /> Upcoming ZIMSEC Exams
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {upcomingExams.slice(0, 3).map((e, i) => {
                const chip = daysChip(e.days_until)
                return (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{e.subject_name}</p>
                        <p className="text-xs text-gray-500">Paper {e.paper_number}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(e.exam_date).toLocaleDateString('en-ZW', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${chip.cls}`}>
                        <Clock size={10} className="inline mr-0.5" />{chip.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-2 text-right">
              <Link href="/student/exam-timetable" className="text-xs text-teal-600 font-semibold hover:text-teal-700 flex items-center justify-end gap-1">
                Manage timetable <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        )}

        {upcomingExams.length === 0 && (
          <Link href="/student/exam-timetable"
            className="flex items-center gap-4 bg-teal-50 border border-teal-200 rounded-2xl p-4 hover:bg-teal-100 transition">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <CalendarCheck size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-teal-900 text-sm">Add your ZIMSEC exam timetable</p>
              <p className="text-xs text-teal-700">MaFundi will prepare personalised revision and mock exams for each exam</p>
            </div>
            <ChevronRight size={16} className="text-teal-600 ml-auto flex-shrink-0" />
          </Link>
        )}

        {/* Subject performance */}
        {subjects.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp size={14} /> Your Performance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subjects.map(s => (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900 text-sm truncate">{s.name}</p>
                    <span className="text-xs font-bold text-blue-600 flex-shrink-0">{s.progress_pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${s.progress_pct}%` }} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{s.lessons_done}/{s.lessons_total} lessons</span>
                    {s.quiz_avg !== null && <span>Quiz: {s.quiz_avg}%</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MaFundi Recommendations */}
        {subjects.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 flex-shrink-0 relative">
               <Bot size={32} className="text-indigo-600" />
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div className="flex-1 text-center sm:text-left relative">
              <h3 className="font-black text-indigo-900 text-lg mb-1 leading-tight">MaFundi&apos;s Recommendation</h3>
              <p className="text-indigo-700 text-sm mb-0">
                You should focus on <strong>Agricultural Science - Soil Fertility</strong>. 
                Your current mastery is <span className="font-bold">42%</span>. 
                Shall we push it to 80% today?
              </p>
            </div>
            <Link href="/student/ai-teacher" className="bg-indigo-600 text-white rounded-xl py-3 px-6 text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-200 hover:scale-105 active:scale-95 flex-shrink-0 relative">
              Start Learning
            </Link>
          </div>
        )}

        {/* Syllabus Mastery Heatmap Section */}
        {subjects.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
              <BookOpen size={14} /> Interactive Syllabus Mastery
            </h2>
            <div className="space-y-8">
              {subjects.map(async (s) => {
                // Fetch dynamic topics for this subject
                const { data: topics } = await supabase
                  .from('subject_topics')
                  .select('id, topic_name, importance')
                  .eq('subject_id', s.id)
                
                const { data: memory } = await supabase
                  .from('student_teaching_memory')
                  .select('*')
                  .eq('student_id', sid)
                  .eq('subject_id', s.id)
                
                // Map topics to their mastery state
                const mappedTopics = (topics ?? []).map(t => {
                  const m = (memory ?? []).find(mem => mem.topic.toLowerCase() === t.topic_name.toLowerCase())
                  return {
                    id: t.id,
                    topic_name: t.topic_name,
                    importance: t.importance as any,
                    mastery_level: m ? m.mastery_level : 0,
                    confidence_score: m ? [m.confidence_score] : [0.5],
                    common_mistakes: m ? m.common_mistakes : []
                  }
                })

                return (
                  <MasteryHeatmap 
                    key={s.id} 
                    subjectName={s.name} 
                    topics={mappedTopics} 
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* AI-Generated Notes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={14} /> AI-Generated Notes
            </h2>
            <span className="text-xs text-gray-400">{aiNotes.length} notes</span>
          </div>
          {aiNotes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <Brain size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No AI notes yet — click &ldquo;Generate Notes&rdquo; above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {aiNotes.slice(0, 5).map(note => {
                const subj = note.subjects as unknown as { name: string } | null
                return (
                  <Link key={note.id} href={note.content_id ? `/student/lessons/${note.content_id}` : '#'}
                    className="group flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{note.topic ?? 'Notes'}</p>
                      <p className="text-xs text-gray-400">{subj?.name ?? ''} · {new Date(note.created_at).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* AI-Generated Mock Exams */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <ClipboardList size={14} /> Mock Exams
            </h2>
            <span className="text-xs text-gray-400">{aiExams.length} exams</span>
          </div>
          {aiExams.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <Target size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No mock exams yet — click &ldquo;Generate Mock Exam&rdquo; above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {aiExams.slice(0, 5).map(exam => {
                const subj = exam.subjects as unknown as { name: string } | null
                return (
                  <div key={exam.id} className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ClipboardList size={16} className="text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{subj?.name ?? ''} — Paper {exam.topic}</p>
                      <p className="text-xs text-gray-400">{new Date(exam.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-700 font-medium px-2 py-0.5 rounded-full flex-shrink-0">Generated</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* AI Revision Sheets */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} /> Revision Sheets
            </h2>
            <span className="text-xs text-gray-400">{aiRevision.length} sheets</span>
          </div>
          {aiRevision.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <FileText size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No revision sheets yet — click &ldquo;Generate Revision Sheet&rdquo; above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {aiRevision.slice(0, 5).map(rev => {
                const subj = rev.subjects as unknown as { name: string } | null
                return (
                  <Link key={rev.id} href="/student/notes"
                    className="group flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-emerald-300 hover:shadow-md transition-all">
                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{rev.topic ?? 'Revision'}</p>
                      <p className="text-xs text-gray-400">{subj?.name ?? ''} · {new Date(rev.created_at).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-emerald-500 flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* MaFundi Mini Assistant Floating Button */}
      <Link href="/student/ai-teacher"
        className="fixed bottom-20 lg:bottom-8 right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all z-40 group">
        <Bot size={24} className="group-hover:animate-bounce" />
        <div className="absolute right-full mr-3 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Ask MaFundi anything
        </div>
      </Link>
    </div>
  )
}
