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

export async function GET() {
  try {
    const { admin, supabase } = await guardAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabase.from('platform_settings').select('*').order('key')
    if (error) throw new Error(error.message)

    // Convert to key-value map
    const settings: Record<string, unknown> = {}
    for (const row of data ?? []) settings[row.key] = row.value
    return NextResponse.json({ settings, rows: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { admin, supabase } = await guardAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as { key: string; value: unknown }
    if (!body.key) return NextResponse.json({ error: 'key is required' }, { status: 400 })

    const { error } = await supabase.from('platform_settings').upsert({
      key: body.key,
      value: body.value,
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    })
    if (error) throw new Error(error.message)

    await supabase.from('audit_logs').insert({
      admin_id: admin.id, action: 'update_setting', resource_type: 'setting',
      resource_id: body.key, details: { key: body.key, value: body.value },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
