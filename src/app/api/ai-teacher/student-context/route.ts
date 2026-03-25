import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id, zimsec_level, grade')
      .eq('user_id', user.id)
      .single() as { data: { id: string; zimsec_level: string; grade: string } | null; error: unknown }

    if (!studentProfile) return NextResponse.json({ context: null })

    const sid = studentProfile.id

    // Enrolled subjects
    const { data: enrolments } = await supabase
      .from('student_subjects')
      .select('subject_id, subjects(id, name, code, zimsec_level)')
      .eq('student_id', sid) as {
      data: { subject_id: string; subjects: { id: string; name: string; code: string; zimsec_level: string } | null }[] | null
      error: unknown
    }
    const subjects = (enrolments ?? [])
      .map(e => e.subjects as unknown as { id: string; name: string; code: string; zimsec_level: string } | null)
      .filter(Boolean) as { id: string; name: string; code: string; zimsec_level: string }[]
    const subjectIds = subjects.map(s => s.id)

    // Lesson progress per subject
    const progressMap: Record<string, { done: number; total: number }> = {}
    if (subjectIds.length > 0) {
      for (const subj of subjects) {
        const { data: courses } = await supabase
          .from('courses')
          .select('id')
          .eq('subject_id', subj.id)
          .eq('published', true)
        const courseIds = (courses ?? []).map(c => c.id as string)
        if (courseIds.length === 0) { progressMap[subj.id] = { done: 0, total: 0 }; continue }
        const { count: total } = await supabase
          .from('lessons')
          .select('id', { count: 'exact', head: true })
          .in('course_id', courseIds)
        const { data: lessonRows } = await supabase
          .from('lessons')
          .select('id')
          .in('course_id', courseIds)
        const lessonIds = (lessonRows ?? []).map(l => l.id as string)
        const { count: done } = lessonIds.length > 0
          ? await supabase.from('lesson_progress').select('id', { count: 'exact', head: true })
              .eq('student_id', sid).in('lesson_id', lessonIds)
          : { count: 0 }
        progressMap[subj.id] = { done: done ?? 0, total: total ?? 0 }
      }
    }

    // Weak and strong topics
    const { data: topicMastery } = await supabase
      .from('topic_mastery')
      .select('topic, mastery_level, subject_id')
      .eq('student_id', sid) as {
      data: { topic: string; mastery_level: string; subject_id: string }[] | null
      error: unknown
    }
    const weakTopics = (topicMastery ?? []).filter(t => ['not_started', 'learning'].includes(t.mastery_level))
    const strongTopics = (topicMastery ?? []).filter(t => t.mastery_level === 'mastered')

    // Quiz avg per subject
    const quizAvgMap: Record<string, number> = {}
    if (subjectIds.length > 0) {
      const { data: quizzes } = await supabase
        .from('quiz_attempts')
        .select('subject_id, score, total')
        .eq('student_id', sid)
        .in('subject_id', subjectIds) as {
        data: { subject_id: string; score: number; total: number }[] | null
        error: unknown
      }
      for (const subj of subjects) {
        const attempts = (quizzes ?? []).filter(q => q.subject_id === subj.id)
        if (attempts.length === 0) continue
        const avg = attempts.reduce((sum, a) => sum + (a.total > 0 ? (a.score / a.total) * 100 : 0), 0) / attempts.length
        quizAvgMap[subj.id] = Math.round(avg)
      }
    }

    // Assignment avg per subject
    const assignAvgMap: Record<string, number> = {}
    if (subjectIds.length > 0) {
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, subject_id, max_score')
        .in('subject_id', subjectIds) as {
        data: { id: string; subject_id: string; max_score: number }[] | null
        error: unknown
      }
      const assignIds = (assignments ?? []).map(a => a.id)
      if (assignIds.length > 0) {
        const { data: submissions } = await supabase
          .from('assignment_submissions')
          .select('assignment_id, score')
          .eq('student_id', sid)
          .in('assignment_id', assignIds)
          .not('score', 'is', null) as {
          data: { assignment_id: string; score: number }[] | null
          error: unknown
        }
        for (const subj of subjects) {
          const subjAssigns = (assignments ?? []).filter(a => a.subject_id === subj.id)
          const subjSubs = (submissions ?? []).filter(s =>
            subjAssigns.some(a => a.id === s.assignment_id)
          )
          if (subjSubs.length === 0) continue
          const avg = subjSubs.reduce((sum, s) => {
            const assign = subjAssigns.find(a => a.id === s.assignment_id)
            return sum + (assign && assign.max_score > 0 ? (s.score / assign.max_score) * 100 : 0)
          }, 0) / subjSubs.length
          assignAvgMap[subj.id] = Math.round(avg)
        }
      }
    }

    // Upcoming exams (next 60 days)
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
    const upcomingExams = (exams ?? []).map(e => {
      const subj = e.subjects as unknown as { name: string; code: string } | null
      const days = Math.ceil((new Date(e.exam_date).getTime() - Date.now()) / 86400000)
      return {
        subject_id: e.subject_id,
        subject_name: subj?.name ?? '',
        paper_number: e.paper_number,
        exam_date: e.exam_date,
        days_until: days,
      }
    })

    // Streak + XP
    const { data: streak } = await supabase
      .from('student_streaks')
      .select('current_streak, total_xp')
      .eq('student_id', sid)
      .single() as { data: { current_streak: number; total_xp: number } | null; error: unknown }

    // Recently completed lessons (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const { data: recentProgress } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed_at, lessons(title, course_id, courses(title))')
      .eq('student_id', sid)
      .gte('completed_at', sevenDaysAgo)
      .order('completed_at', { ascending: false })
      .limit(5) as {
      data: { lesson_id: string; completed_at: string; lessons: { title: string; course_id: string; courses: { title: string } | null } | null }[] | null
      error: unknown
    }

    const context = {
      zimsec_level: studentProfile.zimsec_level,
      grade: studentProfile.grade,
      subjects: subjects.map(s => ({
        ...s,
        progress_pct: progressMap[s.id]
          ? progressMap[s.id].total > 0
            ? Math.round((progressMap[s.id].done / progressMap[s.id].total) * 100)
            : 0
          : 0,
        lessons_done: progressMap[s.id]?.done ?? 0,
        lessons_total: progressMap[s.id]?.total ?? 0,
        quiz_avg: quizAvgMap[s.id] ?? null,
        assignment_avg: assignAvgMap[s.id] ?? null,
      })),
      weak_topics: weakTopics.map(t => ({
        topic: t.topic,
        subject_name: subjects.find(s => s.id === t.subject_id)?.name ?? '',
        mastery_level: t.mastery_level,
      })),
      strong_topics: strongTopics.map(t => ({
        topic: t.topic,
        subject_name: subjects.find(s => s.id === t.subject_id)?.name ?? '',
      })),
      upcoming_exams: upcomingExams,
      streak: streak?.current_streak ?? 0,
      total_xp: streak?.total_xp ?? 0,
      recent_lessons: (recentProgress ?? []).map(p => {
        const lesson = p.lessons as unknown as { title: string; courses: { title: string } | null } | null
        return {
          title: lesson?.title ?? '',
          course: lesson?.courses?.title ?? '',
          completed_at: p.completed_at,
        }
      }),
    }

    return NextResponse.json({ context })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
