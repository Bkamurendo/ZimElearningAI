import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditDocumentForm from './EditDocumentForm'

// ── Types passed to client form ──────────────────────────────────────────────

export type SubjectOption = {
  id: string
  name: string
  code: string
  zimsec_level: string
}

export type DocData = {
  id: string
  title: string
  description: string | null
  document_type: string
  subject_id: string | null
  zimsec_level: string | null
  year: number | null
  paper_number: number | null
  moderation_status: string
  visibility: string
  uploader_role: string
  file_name: string
  created_at: string
  subject: { name: string; code: string; zimsec_level: string } | null
}

export default async function EditDocumentPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  // Load the document
  const { data: doc } = await supabase
    .from('uploaded_documents')
    .select('id, title, description, document_type, subject_id, zimsec_level, year, paper_number, moderation_status, visibility, uploader_role, file_name, created_at, subject:subjects(name, code, zimsec_level)')
    .eq('id', params.id)
    .single() as { data: DocData | null; error: unknown }

  if (!doc) redirect('/admin/documents')

  // Load all subjects (for the subject picker)
  const { data: subjectsRaw } = await supabase
    .from('subjects')
    .select('id, name, code, zimsec_level')
    .order('zimsec_level')
    .order('name') as { data: SubjectOption[] | null; error: unknown }

  const subjects = subjectsRaw ?? []

  return <EditDocumentForm doc={doc} subjects={subjects} />
}
