export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

// GET — list all schools
export async function GET() {
  const supabase = createClient()
  if (!await requireAdmin(supabase)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: schools, error } = await supabase
    .from('schools')
    .select(`
      id, name, slug, province, phone, email, subscription_plan,
      subscription_expires_at, max_students, is_active, created_at,
      admin:profiles!admin_user_id(id, full_name, email)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ schools })
}

// POST — create a school and assign a school_admin
export async function POST(req: NextRequest) {
  const supabase = createClient()
  if (!await requireAdmin(supabase)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { name, province, phone, email, subscription_plan, max_students, admin_email, admin_name, admin_password } = body

  if (!name?.trim()) return NextResponse.json({ error: 'School name required' }, { status: 400 })

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  // 1. Create school record
  const { data: school, error: schoolErr } = await supabase
    .from('schools')
    .insert({
      name: name.trim(),
      slug,
      province,
      phone,
      email,
      subscription_plan: subscription_plan ?? 'basic',
      max_students: max_students ?? 50,
      subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single()

  if (schoolErr) return NextResponse.json({ error: schoolErr.message }, { status: 500 })

  // 2. Create school_admin user if credentials provided
  let adminUser = null
  if (admin_email && admin_password) {
    const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
      email: admin_email,
      password: admin_password,
      options: { data: { full_name: admin_name ?? 'School Admin', role: 'school_admin' } },
    })

    if (signUpErr) {
      // School was created; admin creation failed — still return school
      return NextResponse.json({ school, adminError: signUpErr.message })
    }

    if (signUp.user) {
      await supabase.from('profiles').update({
        role: 'school_admin',
        full_name: admin_name ?? 'School Admin',
        school_id: school.id,
        onboarding_completed: true,
      }).eq('id', signUp.user.id)

      // Link school → admin
      await supabase.from('schools').update({ admin_user_id: signUp.user.id }).eq('id', school.id)
      adminUser = { id: signUp.user.id, email: admin_email }
    }
  }

  return NextResponse.json({ school, adminUser }, { status: 201 })
}
