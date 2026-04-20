export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Admin-only endpoint to correct document metadata (fix mislabeled docs)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  const body = await req.json() as Record<string, unknown>

  // Whitelist of editable fields — never allow file_path, uploaded_by, etc.
  const ALLOWED = [
    'title', 'description', 'document_type', 'subject_id',
    'zimsec_level', 'year', 'paper_number',
    'moderation_status', 'visibility',
  ]

  const updates: Record<string, unknown> = {}
  for (const field of ALLOWED) {
    if (field in body) {
      // Normalise empties → null for optional numeric/foreign-key fields
      const val = body[field]
      if ((field === 'year' || field === 'paper_number') && val !== null) {
        updates[field] = val ? Number(val) : null
      } else if ((field === 'subject_id' || field === 'zimsec_level') && val === '') {
        updates[field] = null
      } else {
        updates[field] = val ?? null
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  const { error } = await supabase
    .from('uploaded_documents')
    .update(updates)
    .eq('id', params.id)

  if (error) {
    console.error('Document update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
