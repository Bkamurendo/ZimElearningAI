export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SolverClient from './SolverClient'

type EnrolledSubject = {
  subject: {
    id: string
    name: string
    code: string
    zimsec_level: string
  } | null
}

export default async function SolverPage({
  searchParams,
}: {
  searchParams: { subject?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get student profile
  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single() as { data: { id: string } | null; error: unknown }

  // Get enrolled subjects
  const { data: enrolments } = await supabase
    .from('student_subjects')
    .select('subject:subjects(id, name, code, zimsec_level)')
    .eq('student_id', studentProfile?.id ?? '') as { data: EnrolledSubject[] | null; error: unknown }

  const subjects = (enrolments ?? [])
    .map((e) => e.subject)
    .filter((s): s is NonNullable<typeof s> => s !== null)

  // Get published documents for context
  const { data: documents } = await supabase
    .from('uploaded_documents')
    .select('id, title, document_type, year, paper_number, subject_id')
    .eq('moderation_status', 'published')
    .order('created_at', { ascending: false }) as {
    data: { id: string; title: string; document_type: string; year: number | null; paper_number: number | null; subject_id: string | null }[] | null
    error: unknown
  }

  const initialSubject = searchParams.subject ?? (subjects[0]?.code ?? '')

  return (
    <SolverClient
      subjects={subjects}
      initialSubjectCode={initialSubject}
      publishedDocuments={documents ?? []}
    />
  )
}
