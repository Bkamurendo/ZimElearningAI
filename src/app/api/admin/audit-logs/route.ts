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

export async function GET(req: NextRequest) {
  try {
    const { admin, supabase } = await guardAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const resource_type = searchParams.get('resource_type')
    const admin_id = searchParams.get('admin_id')
    const offset = parseInt(searchParams.get('offset') ?? '0')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)

    let query = supabase
      .from('audit_logs')
      .select('*, profiles!audit_logs_admin_id_fkey(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (resource_type) query = query.eq('resource_type', resource_type)
    if (admin_id) query = query.eq('admin_id', admin_id)

    const { data, count, error } = await query
    if (error) throw new Error(error.message)

    return NextResponse.json({ logs: data ?? [], total: count ?? 0 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
