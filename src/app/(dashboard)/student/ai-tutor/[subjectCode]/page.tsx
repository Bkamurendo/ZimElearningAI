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
  const {
    data: { user },
  } = await supabase.auth.getUser()
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

  // Load chat history
  const { data: history } = await supabase
    .from('ai_chat_messages')
    .select('role, content, created_at')
    .eq('user_id', user.id)
    .eq('subject_id', subject.id)
    .order('created_at', { ascending: true })
    .limit(100) as {
    data: { role: string; content: string; created_at: string }[] | null
    error: unknown
  }

  const initialMessages = (history ?? []).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  return (
    <AiTutorChat
      subjectName={subject.name}
      subjectCode={subject.code}
      level={subject.zimsec_level}
      initialMessages={initialMessages}
    />
  )
}
