/**
 * GET /api/cron/expire-subscriptions
 *
 * Called daily by Vercel Cron (see vercel.json).
 * Protected by CRON_SECRET — Vercel injects the Authorization header automatically.
 *
 * 1. Runs expire_pro_subscriptions() to demote overdue paid accounts → free
 * 2. Emails users whose plan just expired (pro_expires_at in last 25 hours)
 * 3. Emails users whose plan expires in 2–3 days as an early warning
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendTrialExpiredEmail,
  sendSubscriptionExpiringSoonEmail,
} from '@/lib/email'

export const runtime = 'nodejs'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(req: NextRequest) {
  // ── Auth: Vercel Cron passes Authorization: Bearer <CRON_SECRET> ──────────
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron] CRON_SECRET env var not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = serviceClient()
  const now = new Date()

  // Time windows
  const h25Ago        = new Date(now.getTime() - 25 * 60 * 60 * 1000)  // 25h ago
  const twoDaysAhead  = new Date(now.getTime() + 2  * 24 * 60 * 60 * 1000)
  const threeDaysAhead = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  // ── Step 1: Run SQL expiry function ──────────────────────────────────────
  const { error: rpcErr } = await supabase.rpc('expire_pro_subscriptions')
  if (rpcErr) {
    console.error('[cron] expire_pro_subscriptions failed:', rpcErr.message)
    // Continue — still try to send emails based on pro_expires_at
  }

  // ── Step 2: Users whose plan expired in the last 25 hours ────────────────
  // After the RPC these users now have plan='free' but pro_expires_at still set
  type ProfileRow = { id: string; email: string; full_name: string | null; plan: string }
  const { data: expiredUsers, error: expiredErr } = await supabase
    .from('profiles')
    .select('id, email, full_name, plan')
    .eq('plan', 'free')
    .not('pro_expires_at', 'is', null)
    .gte('pro_expires_at', h25Ago.toISOString())
    .lt('pro_expires_at', now.toISOString()) as { data: ProfileRow[] | null; error: unknown }

  if (expiredErr) {
    console.error('[cron] querying expired users failed:', expiredErr)
  }

  // ── Step 3: Users expiring in 2–3 days (early warning) ───────────────────
  type ExpiringRow = { id: string; email: string; full_name: string | null; plan: string; pro_expires_at: string }
  const { data: expiringUsers, error: expiringErr } = await supabase
    .from('profiles')
    .select('id, email, full_name, plan, pro_expires_at')
    .neq('plan', 'free')
    .not('pro_expires_at', 'is', null)
    .gte('pro_expires_at', twoDaysAhead.toISOString())
    .lt('pro_expires_at', threeDaysAhead.toISOString()) as { data: ExpiringRow[] | null; error: unknown }

  if (expiringErr) {
    console.error('[cron] querying expiring users failed:', expiringErr)
  }

  // ── Send emails ───────────────────────────────────────────────────────────
  let expiredSent = 0
  let expiringSent = 0
  const errors: string[] = []

  for (const u of expiredUsers ?? []) {
    try {
      await sendTrialExpiredEmail(u.email, u.full_name)
      expiredSent++
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`expired ${u.id}: ${msg}`)
      console.error('[cron] expired email failed for', u.id, msg)
    }
  }

  for (const u of expiringUsers ?? []) {
    const ms = new Date(u.pro_expires_at).getTime() - now.getTime()
    const daysLeft = Math.max(1, Math.ceil(ms / 86400000))
    const planLabel = u.plan === 'starter' ? 'Starter' : u.plan === 'elite' ? 'Elite' : 'Pro'
    try {
      await sendSubscriptionExpiringSoonEmail(u.email, u.full_name, daysLeft, planLabel)
      expiringSent++
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`expiring ${u.id}: ${msg}`)
      console.error('[cron] expiring email failed for', u.id, msg)
    }
  }

  console.log(`[cron] expire-subscriptions: ${expiredSent} expired emails, ${expiringSent} expiring-soon emails`)

  return NextResponse.json({
    ok: true,
    expiredEmails: expiredSent,
    expiringEmails: expiringSent,
    ...(errors.length > 0 ? { errors } : {}),
  })
}
