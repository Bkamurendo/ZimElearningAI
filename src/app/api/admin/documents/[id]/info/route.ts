export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: doc } = await supabase
      .from('uploaded_documents')
      .select('id, title, document_type, moderation_status, uploader_role, created_at')
      .eq('id', params.id)
      .single()

    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(doc)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
