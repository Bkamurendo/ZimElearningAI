import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { language } = await request.json()

  if (!['english', 'shona', 'ndebele'].includes(language)) {
    return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ preferred_language: language })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
