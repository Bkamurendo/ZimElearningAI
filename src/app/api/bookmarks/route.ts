import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET — list current user's bookmarks
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      id,
      created_at,
      document:uploaded_documents(
        id, title, document_type, zimsec_level, year, paper_number,
        ai_summary, topics, file_size, moderation_status,
        subject:subjects(name, code)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bookmarks: data ?? [] })
}

// POST — add bookmark
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { document_id } = await req.json()
  if (!document_id) return NextResponse.json({ error: 'document_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('bookmarks')
    .upsert({ user_id: user.id, document_id }, { onConflict: 'user_id,document_id' })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id, message: 'Bookmarked' })
}

// DELETE — remove bookmark
export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { document_id } = await req.json()
  if (!document_id) return NextResponse.json({ error: 'document_id required' }, { status: 400 })

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', user.id)
    .eq('document_id', document_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'Bookmark removed' })
}
