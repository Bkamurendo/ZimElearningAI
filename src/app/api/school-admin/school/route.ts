import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getSchoolAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'school_admin' || !profile.school_id) return null
  return { userId: user.id, schoolId: profile.school_id as string }
}

// GET — fetch school settings
export async function GET() {
  const supabase = createClient()
  const ctx = await getSchoolAdmin(supabase)
  if (!ctx) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: school, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', ctx.schoolId)
    .single()

  if (error || !school) return NextResponse.json({ error: 'School not found' }, { status: 404 })
  return NextResponse.json({ school })
}

// PATCH — update school settings
export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const ctx = await getSchoolAdmin(supabase)
  if (!ctx) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { name, address, province, phone, email, logo_url } = body

  if (!name?.trim()) return NextResponse.json({ error: 'School name is required' }, { status: 400 })

  const { data: school, error } = await supabase
    .from('schools')
    .update({ name: name.trim(), address, province, phone, email, logo_url, updated_at: new Date().toISOString() })
    .eq('id', ctx.schoolId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ school })
}
