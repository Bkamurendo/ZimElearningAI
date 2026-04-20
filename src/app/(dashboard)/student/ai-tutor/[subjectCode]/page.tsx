export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AiTutorChat from './AiTutorChat'

export default async function AiTutorPage({
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
    .single() as {
    data: { id: string; name: string; code: string; zimsec_level: string } | null
    error: unknown
  }

  if (!subject) redirect('/student/dashboard')

  const [historyResult, profileResult, studentResult] = await Promise.all([
    supabase
      .from('ai_chat_messages')
      .select('role, content, created_at')
      .eq('user_id', user.id)
      .eq('subject_id', subject.id)
      .order('created_at', { ascending: true })
      .limit(100),
    supabase
      .from('profiles')
      .select('plan, ai_requests_today, ai_quota_reset_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('student_profiles')
      .select('grade')
      .eq('user_id', user.id)
      .single(),
  ])

  const initialMessages = ((historyResult.data ?? []) as { role: string; content: string }[]).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const profileData = profileResult.data as { plan: string; ai_requests_today: number; ai_quota_reset_at: string } | null
  const isPaid = ['starter', 'pro', 'elite'].includes(profileData?.plan ?? 'free')

  // Reset counter if it's a new day
  const now = new Date()
  const resetAt = new Date(profileData?.ai_quota_reset_at ?? now)
  const isNewDay = now.getTime() - resetAt.getTime() >= 24 * 60 * 60 * 1000
  const aiUsedToday = isNewDay ? 0 : (profileData?.ai_requests_today ?? 0)

  const grade = (studentResult.data as { grade: string | null } | null)?.grade ?? null

  return (
    <AiTutorChat
      subjectName={subject.name}
      subjectCode={subject.code}
      level={subject.zimsec_level}
      grade={grade}
      initialMessages={initialMessages}
      isPaid={isPaid}
      aiUsedToday={aiUsedToday}
    />
  )
}
