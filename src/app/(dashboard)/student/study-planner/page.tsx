export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudyPlannerClient from './StudyPlannerClient'

export default async function StudyPlannerPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('id, zimsec_level, grade')
    .eq('user_id', user.id)
    .single() as { data: { id: string; zimsec_level: string; grade: string } | null; error: unknown }

  if (!studentProfile) redirect('/student/dashboard')

  type SubjectRow = { name: string; code: string } | null
  const { data: enrolments } = await supabase
    .from('student_subjects')
    .select('subject:subjects(name, code)')
    .eq('student_id', studentProfile.id) as { data: { subject: SubjectRow }[] | null; error: unknown }

  const subjects = (enrolments?.map((e) => e.subject).filter(Boolean) ?? []) as NonNullable<SubjectRow>[]

  // Get weak topics (mastery = 'learning' or 'not_started')
  const { data: weakMastery } = await supabase
    .from('topic_mastery')
    .select('topic, mastery_level')
    .eq('student_id', studentProfile.id)
    .in('mastery_level', ['learning', 'not_started']) as {
      data: { topic: string; mastery_level: string }[] | null
      error: unknown
    }

  // Existing plan if any
  const { data: existingPlan } = await supabase
    .from('study_plans')
    .select('exam_date, plan_data, updated_at')
    .eq('student_id', studentProfile.id)
    .single() as {
      data: { exam_date: string | null; plan_data: Record<string, unknown>; updated_at: string } | null
      error: unknown
    }

  return (
    <StudyPlannerClient
      subjects={subjects}
      weakTopics={weakMastery?.map((m) => m.topic) ?? []}
      level={studentProfile.zimsec_level}
      existingPlan={existingPlan ?? null}
    />
  )
}
