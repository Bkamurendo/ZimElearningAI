import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function guardAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { admin: null, supabase }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { admin: profile?.role === 'admin' ? user : null, supabase }
}

/* ── POST — approve or reject a teacher ──────────────────────
   Body: { action: 'approve' | 'reject', notes?: string }
   params.id = teacher_profiles.user_id (the user's UUID)
*/
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { admin, supabase } = await guardAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as { action: 'approve' | 'reject'; notes?: string }
    if (!['approve', 'reject'].includes(body.action)) {
      return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
    }

    const isApproved = body.action === 'approve'

    // Update teacher_profiles
    const { error: tErr } = await supabase
      .from('teacher_profiles')
      .update({
        is_approved: isApproved,
        approval_notes: body.notes?.trim() ?? null,
        approved_by: admin.id,
        approved_at: new Date().toISOString(),
      })
      .eq('user_id', params.id)

    if (tErr) throw new Error(tErr.message)

    // Send notification to teacher
    const message = isApproved
      ? 'Your teacher account has been approved. You can now create courses and upload resources.'
      : `Your teacher account application was not approved. ${body.notes ? `Reason: ${body.notes}` : 'Please contact support for more information.'}`

    await supabase.from('notifications').insert({
      user_id: params.id,
      type: isApproved ? 'success' : 'alert',
      title: isApproved ? '🎉 Teacher Account Approved' : 'Account Application Update',
      message,
      metadata: { action: body.action, reviewed_by: admin.id },
    })

    // Audit log
    await supabase.from('audit_logs').insert({
      admin_id: admin.id,
      action: `${body.action}_teacher`,
      resource_type: 'user',
      resource_id: params.id,
      details: { action: body.action, notes: body.notes ?? null },
    })

    return NextResponse.json({ success: true, action: body.action })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
