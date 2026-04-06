/**
 * PATCH /api/admin/users/[id]  — update profile fields (name, role, onboarding)
 * POST  /api/admin/users/[id]  — generate a one-time password-reset link
 *
 * Admin-only. Uses the service-role client to bypass RLS.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const VALID_ROLES = ['student', 'teacher', 'parent', 'admin'] as const

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function guardAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

/* ── PATCH — update profile ──────────────────────────────────────────────── */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await guardAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as {
      full_name?: string
      role?: string
      onboarding_completed?: boolean
    }

    const updates: Record<string, unknown> = {}
    if (typeof body.full_name === 'string') {
      updates.full_name = body.full_name.trim() || null
    }
    if (typeof body.role === 'string' && (VALID_ROLES as readonly string[]).includes(body.role)) {
      updates.role = body.role
    }
    if (typeof body.onboarding_completed === 'boolean') {
      updates.onboarding_completed = body.onboarding_completed
    }
    if (typeof (body as any).plan === 'string' && ['free', 'starter', 'pro', 'elite', 'basic'].includes((body as any).plan)) {
      updates.plan = (body as any).plan
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const svc = serviceClient()
    const { error } = await svc.from('profiles').update(updates).eq('id', params.id)
    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error'
    console.error('[admin/users PATCH]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/* ── POST — generate password reset link ─────────────────────────────────── */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await guardAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const svc = serviceClient()

    // Fetch target user's email via auth admin API
    const { data: authUser, error: authErr } = await svc.auth.admin.getUserById(params.id)
    if (authErr || !authUser?.user?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    const { data: linkData, error: linkErr } = await svc.auth.admin.generateLink({
      type: 'recovery',
      email: authUser.user.email,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    })

    if (linkErr) throw new Error(linkErr.message)

    return NextResponse.json({
      success: true,
      link: linkData.properties?.action_link ?? null,
      email: authUser.user.email,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error'
    console.error('[admin/users POST reset]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
