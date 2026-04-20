export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookOpen, CalendarCheck, AlertTriangle } from 'lucide-react'
import RevisionPackClient from './RevisionPackClient'

export const metadata = { title: 'Revision Pack Generator — MaFundi' }

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

export default async function RevisionPackPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get student profile
  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('id, zimsec_level, grade')
    .eq('user_id', user.id)
    .single()

  if (!studentProfile) redirect('/onboarding')

  // Get enrolled subjects with exam dates
  const { data: enrollments } = await supabase
    .from('student_subjects')
    .select('subject_id, subjects(id, name, code, zimsec_level)')
    .eq('student_id', studentProfile.id)

  // Get exam timetable entries for all enrolled subjects
  const subjectIds = (enrollments ?? []).map((e: any) => e.subject_id)
  const { data: examEntries } = subjectIds.length > 0
    ? await supabase
        .from('exam_timetable')
        .select('subject_id, exam_date')
        .eq('student_id', studentProfile.id)
        .in('subject_id', subjectIds)
        .order('exam_date', { ascending: true })
    : { data: [] }

  // Build exam date lookup (earliest date per subject)
  const examDateMap: Record<string, string> = {}
  for (const entry of examEntries ?? []) {
    if (!examDateMap[entry.subject_id]) {
      examDateMap[entry.subject_id] = entry.exam_date
    }
  }

  // Build subject list for the client
  const subjects = (enrollments ?? [])
    .map((e: any) => {
      const s = e.subjects
      if (!s) return null
      const examDate = examDateMap[s.id] ?? null
      const days = examDate ? daysUntil(examDate) : null
      return {
        id: s.id,
        name: s.name,
        code: s.code,
        zimsecLevel: s.zimsec_level,
        examDate,
        daysUntilExam: days,
      }
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => {
      // Sort by exam proximity: soonest first, then no-date subjects last
      if (a.daysUntilExam !== null && b.daysUntilExam !== null) return a.daysUntilExam - b.daysUntilExam
      if (a.daysUntilExam !== null) return -1
      if (b.daysUntilExam !== null) return 1
      return a.name.localeCompare(b.name)
    })

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen size={24} className="text-emerald-600" />
            Pre-Exam Revision Pack
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            AI-generated revision packs tailored to your weak areas and upcoming ZIMSEC exams
          </p>
        </div>

        {/* Subject cards */}
        {subjects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-10 text-center">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CalendarCheck size={26} className="text-emerald-600" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-slate-200 text-base mb-1">No subjects enrolled</p>
            <p className="text-sm text-gray-400 dark:text-slate-500">
              Enrol in subjects first, then come back to generate your personalised revision packs.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subj: any) => {
              const isUrgent = subj.daysUntilExam !== null && subj.daysUntilExam <= 14
              const isPast = subj.daysUntilExam !== null && subj.daysUntilExam <= 0
              return (
                <div
                  key={subj.id}
                  className={`relative bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-5 flex flex-col gap-3 ${
                    isUrgent
                      ? 'border-red-200 dark:border-red-800'
                      : 'border-gray-100 dark:border-slate-800'
                  }`}
                >
                  {isUrgent && !isPast && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 px-2 py-0.5 rounded-full">
                      <AlertTriangle size={11} /> URGENT
                    </span>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <BookOpen size={18} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{subj.name}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide">{subj.code}</p>
                    </div>
                  </div>

                  {subj.examDate ? (
                    <div className="flex items-center gap-2 text-xs">
                      <CalendarCheck size={13} className="text-gray-400 dark:text-slate-500" />
                      <span className="text-gray-600 dark:text-slate-300">
                        {new Date(subj.examDate).toLocaleDateString('en-ZW', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {subj.daysUntilExam !== null && subj.daysUntilExam > 0 && (
                        <span className={`font-bold px-1.5 py-0.5 rounded-full ${
                          subj.daysUntilExam <= 7
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                            : subj.daysUntilExam <= 14
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                        }`}>
                          {subj.daysUntilExam}d left
                        </span>
                      )}
                      {isPast && (
                        <span className="font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                          Exam passed
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-slate-500 italic">
                      No exam date set — add one in Exam Timetable
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Client component for generating and displaying revision packs */}
        {subjects.length > 0 && (
          <RevisionPackClient subjects={subjects} />
        )}
      </div>
    </div>
  )
}
