/**
 * POST /api/admin/send-sms
 *
 * Admin-only endpoint to send bulk SMS messages to platform audiences.
 *
 * Body:
 *   {
 *     audience: 'all' | 'students' | 'teachers' | 'trial_ending' | 'schools',
 *     message: string
 *   }
 *
 * Returns:
 *   { sent: number, failed: number, errors: string[] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendBulkSMS } from '@/lib/sms'

// ── Auth guard ────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, supabase }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return {
    user: profile?.role === 'admin' ? user : null,
    supabase,
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase } = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    // Parse and validate body
    let body: { audience: string; message: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { audience, message } = body

    const VALID_AUDIENCES = ['all', 'students', 'teachers', 'trial_ending', 'schools'] as const
    type Audience = typeof VALID_AUDIENCES[number]

    if (!VALID_AUDIENCES.includes(audience as Audience)) {
      return NextResponse.json(
        { error: `audience must be one of: ${VALID_AUDIENCES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    // ── Resolve phone numbers by audience ─────────────────────────────────────

    type PhoneRow = { phone_number: string }
    const phones: string[] = []

    if (audience === 'all' || audience === 'students' || audience === 'teachers') {
      // Fetch from profiles — assumes a `phone` column exists (may be null)
      type ProfilePhoneRow = { phone: string | null }
      const query = supabase
        .from('profiles')
        .select('phone')
        .eq('suspended', false)
        .not('phone', 'is', null)

      if (audience === 'students') {
        const { data } = await query.eq('role', 'student') as { data: ProfilePhoneRow[] | null }
        if (data) phones.push(...data.map(r => r.phone!))
      } else if (audience === 'teachers') {
        const { data } = await query.eq('role', 'teacher') as { data: ProfilePhoneRow[] | null }
        if (data) phones.push(...data.map(r => r.phone!))
      } else {
        // all — grab every non-null phone across all roles
        const { data } = await query as { data: ProfilePhoneRow[] | null }
        if (data) phones.push(...data.map(r => r.phone!))
      }

      // Also include parent phone numbers from parent_profiles
      if (audience === 'all') {
        const { data: parentRows } = await supabase
          .from('parent_profiles')
          .select('phone_number')
          .not('phone_number', 'is', null) as { data: PhoneRow[] | null }
        if (parentRows) phones.push(...parentRows.map(r => r.phone_number))
      }
    }

    if (audience === 'trial_ending') {
      // Students whose trial ends within the next 3 days
      const now = new Date()
      const cutoff = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()

      type TrialRow = { phone: string | null }
      const { data } = await supabase
        .from('profiles')
        .select('phone')
        .eq('role', 'student')
        .eq('suspended', false)
        .not('trial_ends_at', 'is', null)
        .lte('trial_ends_at', cutoff)
        .gte('trial_ends_at', now.toISOString())
        .not('phone', 'is', null) as { data: TrialRow[] | null }

      if (data) phones.push(...data.map(r => r.phone!))
    }

    if (audience === 'schools') {
      // School admin phone numbers from school_licenses joined to profiles
      type SchoolAdminRow = { phone: string | null }
      const { data } = await supabase
        .from('profiles')
        .select('phone')
        .eq('role', 'school_admin')
        .eq('suspended', false)
        .not('phone', 'is', null) as { data: SchoolAdminRow[] | null }

      if (data) phones.push(...data.map(r => r.phone!))
    }

    // Deduplicate
    const uniquePhones = Array.from(new Set(phones.filter(Boolean)))

    if (uniquePhones.length === 0) {
      return NextResponse.json(
        { sent: 0, failed: 0, errors: ['No phone numbers found for the selected audience'] }
      )
    }

    // ── Send ──────────────────────────────────────────────────────────────────

    const recipients = uniquePhones.map(phone => ({ phone, message: message.trim() }))
    const result = await sendBulkSMS(recipients)

    // Audit log
    await supabase.from('audit_logs').insert({
      admin_id: user.id,
      action: 'bulk_sms',
      resource_type: 'sms',
      details: {
        audience,
        total: uniquePhones.length,
        sent: result.sent,
        failed: result.failed,
      },
    })

    return NextResponse.json({
      sent: result.sent,
      failed: result.failed,
      errors: result.errors ?? [],
    })
  } catch (err) {
    console.error('[/api/admin/send-sms]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
