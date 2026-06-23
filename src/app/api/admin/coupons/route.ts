export const dynamic = 'force-dynamic';
/**
 * /api/admin/coupons
 *
 * GET  — list all coupons with total use counts (admin only)
 * POST — create a new coupon (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── Auth guard ────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, authorized: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return { supabase, user, authorized: profile?.role === 'admin' }
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  const { supabase, authorized } = await requireAdmin()
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ coupons: coupons ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { supabase, user, authorized } = await requireAdmin()
  if (!authorized || !user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: {
    code?: string
    description?: string
    discount_type?: string
    discount_value?: number
    max_uses?: number | null
    valid_until?: string | null
    applies_to?: string[]
    min_amount_usd?: number
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { code, description, discount_type, discount_value, max_uses, valid_until, applies_to, min_amount_usd } = body

  // Validation
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
  }
  if (!discount_type || !['percent', 'fixed_usd'].includes(discount_type)) {
    return NextResponse.json({ error: 'discount_type must be "percent" or "fixed_usd"' }, { status: 400 })
  }
  if (typeof discount_value !== 'number' || discount_value <= 0) {
    return NextResponse.json({ error: 'discount_value must be a positive number' }, { status: 400 })
  }
  if (discount_type === 'percent' && discount_value > 100) {
    return NextResponse.json({ error: 'Percent discount cannot exceed 100' }, { status: 400 })
  }

  try {
    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert({
        code: code.trim().toUpperCase(),
        description: description ?? null,
        discount_type,
        discount_value,
        max_uses: max_uses ?? null,
        valid_until: valid_until ?? null,
        applies_to: applies_to ?? [],
        min_amount_usd: min_amount_usd ?? 0,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: `Coupon code "${code.toUpperCase()}" already exists` }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── PATCH — toggle active status ──────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const { supabase, authorized } = await requireAdmin()
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { id?: string; is_active?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { id, is_active } = body
  if (!id) return NextResponse.json({ error: 'Coupon id is required' }, { status: 400 })
  if (typeof is_active !== 'boolean') return NextResponse.json({ error: 'is_active must be boolean' }, { status: 400 })

  const { data, error } = await supabase
    .from('coupons')
    .update({ is_active })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ coupon: data })
}
