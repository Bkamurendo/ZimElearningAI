export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GradePredictorClient from './GradePredictorClient'
import UpgradeWall from '@/components/UpgradeWall'

export default async function GradePredictorPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: planProfile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const isPaid = ['starter', 'pro', 'elite'].includes(planProfile?.plan ?? 'free')

  if (!isPaid) {
    return (
      <UpgradeWall
        feature="Grade Predictor"
        description="Get an AI-powered prediction of your ZIMSEC exam grade based on your quiz performance and topic mastery."
        benefits={[
          'AI-predicted ZIMSEC grade (A–U scale)',
          'Confidence rating based on your data',
          'Personalised improvement recommendations',
          'Track your exam readiness score',
          'Subject-by-subject performance breakdown',
        ]}
      />
    )
  }

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('id, zimsec_level, grade')
    .eq('user_id', user.id)
    .single() as { data: { id: string; zimsec_level: string; grade: string } | null; error: unknown }

  if (!studentProfile) redirect('/student/dashboard')

  // All enrolled subjects with their IDs
  type SubjectEnrolment = {
    subject: { id: string; name: string; code: string; zimsec_level: string } | null
  }
  const { data: enrolments } = await supabase
    .from('student_subjects')
    .select('subject:subjects(id, name, code, zimsec_level)')
    .eq('student_id', studentProfile.id) as { data: SubjectEnrolment[] | null; error: unknown }

  type Subject = { id: string; name: string; code: string; zimsec_level: string }
  const subjects = (enrolments?.map((e) => e.subject).filter(Boolean) ?? []) as Subject[]

  // Quiz attempt counts per subject to show readiness
  const attemptCounts: Record<string, number> = {}
  for (const s of subjects) {
    const { count } = await supabase
      .from('quiz_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentProfile.id)
      .eq('subject_id', s.id)
    attemptCounts[s.id] = count ?? 0
  }

  return (
    <GradePredictorClient
      studentId={studentProfile.id}
      subjects={subjects}
      attemptCounts={attemptCounts}
    />
  )
}
