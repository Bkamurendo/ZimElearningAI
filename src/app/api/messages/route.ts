import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/messages — inbox (messages sent to me)
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const box = searchParams.get('box') ?? 'inbox' // inbox | sent

  try {
    const query = supabase
      .from('messages')
      .select('id, content, read, created_at, subject_id, sender:profiles!sender_id(full_name, role), recipient:profiles!recipient_id(full_name, role), subject:subjects(name, code)')
      .order('created_at', { ascending: false })
      .limit(50)

    const { data, error } = box === 'sent'
      ? await query.eq('sender_id', user.id)
      : await query.eq('recipient_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ messages: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Messages table not found' }, { status: 500 })
  }
}

// POST /api/messages — send a message
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { recipient_id, content, subject_id } = await req.json() as {
    recipient_id: string
    content: string
    subject_id?: string
  }

  if (!recipient_id || !content?.trim()) {
    return NextResponse.json({ error: 'recipient_id and content are required' }, { status: 400 })
  }

  // Verify recipient exists
  const { data: recipient } = await supabase
    .from('profiles').select('id, role').eq('id', recipient_id).single()
  if (!recipient) return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, recipient_id, content: content.trim(), subject_id: subject_id ?? null })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message_id: data.id })
  } catch {
    return NextResponse.json({ error: 'Messages table not found — run migration first' }, { status: 500 })
  }
}
