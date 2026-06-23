export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuizEngine from './QuizEngine'

export default async function QuizPage({ params }: { params: { subjectCode: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, code, zimsec_level')
    .eq('code', params.subjectCode)
    .single()

  if (!subject) redirect('/student/dashboard')

  // Get recent mastery for this subject to show progress
  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const { data: mastery } = await supabase
    .from('topic_mastery')
    .select('topic, mastery_level')
    .eq('student_id', studentProfile?.id ?? '')
    .eq('subject_id', subject.id)
    .order('updated_at', { ascending: false })

  return (
    <QuizEngine
      subject={subject}
      existingMastery={mastery ?? []}
    />
  )
}
