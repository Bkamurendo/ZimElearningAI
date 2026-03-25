import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function serviceClient() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function guardAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { admin: null, supabase }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { admin: profile?.role === 'admin' ? user : null, supabase }
}

/* ── POST — suspend or unsuspend a user ───────────────────────
   Body: { action: 'suspend' | 'unsuspend', reason?: string }
*/
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { admin, supabase } = await guardAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as { action: 'suspend' | 'unsuspend'; reason?: string }
    if (!['suspend', 'unsuspend'].includes(body.action)) {
      return NextResponse.json({ error: 'action must be suspend or unsuspend' }, { status: 400 })
    }

    // Prevent admin from suspending themselves
    if (params.id === admin.id) {
      return NextResponse.json({ error: 'Cannot suspend your own account' }, { status: 400 })
    }

    const isSuspending = body.action === 'suspend'
    const svc = serviceClient()

    const updates: Record<string, unknown> = {
      suspended: isSuspending,
      suspension_reason: isSuspending ? (body.reason?.trim() ?? null) : null,
      suspended_at: isSuspending ? new Date().toISOString() : null,
      suspended_by: isSuspending ? admin.id : null,
    }

    const { error } = await svc.from('profiles').update(updates).eq('id', params.id)
    if (error) throw new Error(error.message)

    // Notify user
    const message = isSuspending
      ? `Your account has been suspended. ${body.reason ? `Reason: ${body.reason}` : 'Contact support for assistance.'}`
      : 'Your account suspension has been lifted. You can now access ZimLearn again.'

    await supabase.from('notifications').insert({
      user_id: params.id,
      type: isSuspending ? 'alert' : 'success',
      title: isSuspending ? '⚠️ Account Suspended' : '✅ Account Reinstated',
      message,
      metadata: { action: body.action, by: admin.id },
    })

    await supabase.from('audit_logs').insert({
      admin_id: admin.id,
      action: body.action === 'suspend' ? 'suspend_user' : 'unsuspend_user',
      resource_type: 'user',
      resource_id: params.id,
      details: { reason: body.reason ?? null },
    })

    return NextResponse.json({ success: true, action: body.action })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
