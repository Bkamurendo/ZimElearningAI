export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function guardAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { admin: null, supabase }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { admin: profile?.role === 'admin' ? user : null, supabase }
}

/* ── GET — list all subjects ───────────────────────────────── */
export async function GET() {
  try {
    const { admin, supabase } = await guardAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('zimsec_level')
      .order('name')

    if (error) throw new Error(error.message)
    return NextResponse.json({ subjects: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

/* ── POST — create subject ─────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const { admin, supabase } = await guardAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as { name: string; code: string; zimsec_level: string; description?: string }
    if (!body.name?.trim() || !body.code?.trim() || !body.zimsec_level) {
      return NextResponse.json({ error: 'name, code and zimsec_level are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('subjects')
      .insert({ name: body.name.trim(), code: body.code.trim().toUpperCase(), zimsec_level: body.zimsec_level, description: body.description?.trim() ?? null })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Audit log
    await supabase.from('audit_logs').insert({
      admin_id: admin.id, action: 'create_subject', resource_type: 'subject',
      resource_id: data.id, details: { name: data.name, code: data.code, level: data.zimsec_level },
    })

    return NextResponse.json({ subject: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
