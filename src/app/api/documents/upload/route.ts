import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get uploader role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const {
    title,
    description,
    document_type,
    subject_id,
    zimsec_level,
    year,
    paper_number,
    file_path,
    file_name,
    file_size,
  } = await req.json()

  // Validate required fields
  if (!title || !document_type || !file_path || !file_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Insert document record
  const { data: doc, error } = await supabase
    .from('uploaded_documents')
    .insert({
      title,
      description: description || null,
      document_type,
      subject_id: subject_id || null,
      zimsec_level: zimsec_level || null,
      year: year ? parseInt(year) : null,
      paper_number: paper_number ? parseInt(paper_number) : null,
      file_path,
      file_name,
      file_size: file_size || null,
      file_url: '', // will be populated with signed URL on demand
      uploaded_by: user.id,
      uploader_role: profile.role,
      moderation_status: 'pending',
      visibility: 'private',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Document insert error:', error)
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
  }

  // Trigger AI processing in background (fire-and-forget)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  fetch(`${baseUrl}/api/documents/process/${doc.id}`, {
    method: 'POST',
    headers: { Cookie: req.headers.get('cookie') ?? '' },
  }).catch(() => {
    // Background processing — failure is non-blocking
  })

  return NextResponse.json({ id: doc.id, message: 'Document uploaded. AI processing started.' })
}
