import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin only
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  const { action, notes, visibility } = await req.json() as {
    action: 'approve' | 'reject' | 'reprocess'
    notes?: string
    visibility?: 'private' | 'subject' | 'public'
  }

  if (!['approve', 'reject', 'reprocess'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  if (action === 'reprocess') {
    // Trigger re-processing
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    await fetch(`${baseUrl}/api/documents/process/${params.id}`, {
      method: 'POST',
      headers: { Cookie: req.headers.get('cookie') ?? '' },
    })
    return NextResponse.json({ message: 'Reprocessing triggered' })
  }

  const updateData: Record<string, string> = {
    moderation_status: action === 'approve' ? 'published' : 'rejected',
    moderation_notes: notes
      ? `Human review: ${notes}`
      : action === 'approve'
        ? 'Approved by admin'
        : 'Rejected by admin',
  }

  if (action === 'approve') {
    updateData.visibility = visibility ?? 'public'
  }

  const { error } = await supabase
    .from('uploaded_documents')
    .update(updateData)
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, status: updateData.moderation_status })
}
