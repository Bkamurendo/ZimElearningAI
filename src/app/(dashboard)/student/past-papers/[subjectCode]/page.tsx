import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PastPaperClient from './PastPaperClient'
import UpgradeWall from '@/components/UpgradeWall'

export default async function PastPaperPage({
  params,
}: {
  params: { subjectCode: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, code, zimsec_level')
    .eq('code', params.subjectCode)
    .single() as { data: { id: string; name: string; code: string; zimsec_level: string } | null; error: unknown }

  if (!subject) redirect('/student/dashboard')
  const subjectData = subject as { id: string; name: string; code: string; zimsec_level: string }

  const { data: planProfile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const isPaid = ['starter', 'pro', 'elite'].includes(planProfile?.plan ?? 'free')

  if (!isPaid) {
    return (
      <UpgradeWall
        feature="Past Papers"
        description="Practice with AI-generated ZIMSEC-style exam papers and get instant marking and feedback."
        benefits={[
          'AI-generated full ZIMSEC-style past papers',
          'Timed exam mode with countdown timer',
          'Instant AI marking with detailed feedback',
          'Grade prediction per question',
          'Track your improvement over time',
        ]}
      />
    )
  }

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single() as { data: { id: string } | null; error: unknown }

  // Get recent past paper attempts for this subject
  const { data: recentAttempts } = await supabase
    .from('quiz_attempts')
    .select('score, total, topic, created_at')
    .eq('student_id', studentProfile?.id ?? '')
    .eq('subject_id', subject.id)
    .ilike('topic', 'Past Paper%')
    .order('created_at', { ascending: false })
    .limit(5) as { data: { score: number; total: number; topic: string; created_at: string }[] | null; error: unknown }

  return (
    <PastPaperClient
      subject={subjectData}
      recentAttempts={recentAttempts ?? []}
    />
  )
}
