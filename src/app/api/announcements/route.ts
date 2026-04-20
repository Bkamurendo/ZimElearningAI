export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET — list active announcements (all roles)
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch user role to filter announcements by audience (security: no cross-role data leakage)
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const userRole = callerProfile?.role ?? 'student'

  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, body, audience, priority, created_at, posted_by, profiles:profiles(full_name, role)')
    .eq('is_active', true)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    // Only return announcements targeted at this user's role or broadcast to 'all'
    .or(`audience.eq.all,audience.eq.${userRole}`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ announcements: data ?? [] })
}

// POST — create announcement (admin/teacher only)
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'teacher'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, body, audience, priority, expires_at } = await req.json()
  if (!title || !body) {
    return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title: title.trim(),
      body: body.trim(),
      audience: audience ?? 'all',
      priority: priority ?? 'normal',
      expires_at: expires_at || null,
      posted_by: user.id,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id, message: 'Announcement created' })
}
