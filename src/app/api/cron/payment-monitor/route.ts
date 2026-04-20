export const dynamic = 'force-dynamic';
/**
 * GET /api/cron/payment-monitor
 *
 * Vercel Cron — runs daily at 09:00 Zimbabwe time (UTC+2 → cron 0 7 * * *).
 *
 * Checks for payment system health:
 *   1. If there are payment ATTEMPTS in the last 48h but ZERO successes → ALERT
 *   2. If there are stuck "pending" payments older than 2 hours → ALERT
 *   3. Daily payment summary stats
 *
 * Sends an alert email to the admin when something looks wrong.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL ?? process.env.RESEND_FROM_EMAIL?.replace(/.*</, '').replace(/>/, '') ?? 'admin@zim-elearningai.co.zw'
const CRON_SECRET = process.env.CRON_SECRET ?? ''

// ── Main handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Verify cron secret (Vercel sets this automatically for cron jobs)
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  const alerts: string[] = []
  const now = new Date()
  const h48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
  const h2Ago = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
  const h24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  try {
    // ── Check 1: Payment attempts vs successes in last 48h ───────────────────

    const { count: totalAttempts } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', h48Ago)

    const { count: successfulPayments } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', h48Ago)
      .eq('status', 'paid')

    const { count: failedPayments } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', h48Ago)
      .in('status', ['failed', 'cancelled'])

    const attempts = totalAttempts ?? 0
    const successes = successfulPayments ?? 0
    const failures = failedPayments ?? 0

    if (attempts > 0 && successes === 0) {
      alerts.push(
        `🚨 CRITICAL: ${attempts} payment attempt(s) in the last 48 hours but ZERO successful payments! ` +
        `(${failures} failed/cancelled). Your payment system may be broken.`
      )
    } else if (attempts > 0 && failures > 0 && (failures / attempts) > 0.5) {
      alerts.push(
        `⚠️ WARNING: High payment failure rate — ${failures}/${attempts} payments failed/cancelled in the last 48h ` +
        `(${Math.round((failures / attempts) * 100)}% failure rate).`
      )
    }

    // ── Check 2: Stuck pending payments (older than 2 hours) ─────────────────

    const { data: stuckPayments, count: stuckCount } = await supabase
      .from('payments')
      .select('id, user_id, plan_id, gateway, method, created_at', { count: 'exact' })
      .eq('status', 'pending')
      .lt('created_at', h2Ago)
      .order('created_at', { ascending: false })
      .limit(10)

    if ((stuckCount ?? 0) > 0) {
      const stuckList = (stuckPayments ?? [])
        .map(p => `  • ${p.gateway ?? 'unknown'} / ${p.method ?? 'n/a'} — ${p.plan_id} — created ${p.created_at}`)
        .join('\n')

      alerts.push(
        `⏳ ${stuckCount} payment(s) stuck in "pending" status for over 2 hours:\n${stuckList}\n` +
        `These users may have paid but their accounts were never upgraded.`
      )
    }

    // ── Check 3: Gather 24h summary stats ────────────────────────────────────

    const { count: last24hAttempts } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', h24Ago)

    const { count: last24hPaid } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', h24Ago)
      .eq('status', 'paid')

    const { count: last24hFailed } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', h24Ago)
      .in('status', ['failed', 'cancelled'])

    const { count: last24hPending } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', h24Ago)
      .eq('status', 'pending')

    // ── Check 4: Users who tried to pay but are still on free plan ───────────

    const { data: lostConversions } = await supabase
      .from('payments')
      .select('user_id, profiles!inner(full_name, email, plan)')
      .gte('created_at', h48Ago)
      .in('status', ['failed', 'cancelled', 'pending'])
      .limit(20) as { data: { user_id: string; profiles: { full_name: string; email: string; plan: string } }[] | null }

    const stillFreeUsers = (lostConversions ?? []).filter(
      (r) => r.profiles?.plan === 'free'
    )

    if (stillFreeUsers.length > 0) {
      const userList = stillFreeUsers
        .slice(0, 10)
        .map(r => `  • ${r.profiles.full_name ?? 'Unknown'} (${r.profiles.email ?? 'no email'})`)
        .join('\n')

      alerts.push(
        `💸 ${stillFreeUsers.length} user(s) attempted payment in the last 48h but are still on the FREE plan:\n${userList}\n` +
        `Consider reaching out to help them complete their purchase.`
      )
    }

    // ── Send alert email if there are issues ─────────────────────────────────

    const hasAlerts = alerts.length > 0

    if (hasAlerts) {
      const alertHtml = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#dc2626;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
            <h2 style="margin:0">⚠️ ZimLearn Payment Alert</h2>
            <p style="margin:4px 0 0;opacity:0.9;font-size:14px">${now.toLocaleString('en-ZW', { timeZone: 'Africa/Harare' })}</p>
          </div>

          <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
            ${alerts.map(a => `
              <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;margin-bottom:16px;border-radius:0 4px 4px 0;white-space:pre-line;font-size:14px">
                ${a.replace(/\n/g, '<br>')}
              </div>
            `).join('')}

            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">

            <h3 style="color:#374151;margin-bottom:12px">📊 Last 24 Hours Summary</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr style="background:#f9fafb">
                <td style="padding:8px 12px;border:1px solid #e5e7eb">Total attempts</td>
                <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;text-align:right">${last24hAttempts ?? 0}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;border:1px solid #e5e7eb">✅ Successful</td>
                <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;text-align:right;color:#16a34a">${last24hPaid ?? 0}</td>
              </tr>
              <tr style="background:#f9fafb">
                <td style="padding:8px 12px;border:1px solid #e5e7eb">❌ Failed/Cancelled</td>
                <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;text-align:right;color:#dc2626">${last24hFailed ?? 0}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;border:1px solid #e5e7eb">⏳ Still pending</td>
                <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;text-align:right;color:#d97706">${last24hPending ?? 0}</td>
              </tr>
            </table>

            <div style="margin-top:24px;text-align:center">
              <a href="https://zim-elearningai.co.zw/admin/dashboard"
                 style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">
                Open Admin Dashboard →
              </a>
            </div>

            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
            <p style="color:#9ca3af;font-size:12px;text-align:center">
              ZimLearn Payment Monitor — automated daily check<br>
              To change alert email, set ADMIN_ALERT_EMAIL in Vercel env vars
            </p>
          </div>
        </div>
      `

      await sendEmail(ADMIN_EMAIL, '⚠️ ZimLearn Payment Alert — Action Required', alertHtml)
    } else {
      // All good — send a quiet daily summary (only if there were any payments)
      if ((last24hAttempts ?? 0) > 0) {
        const summaryHtml = `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#16a34a;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
              <h2 style="margin:0">✅ ZimLearn Payments Healthy</h2>
              <p style="margin:4px 0 0;opacity:0.9;font-size:14px">${now.toLocaleString('en-ZW', { timeZone: 'Africa/Harare' })}</p>
            </div>
            <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
              <h3 style="color:#374151;margin-bottom:12px">📊 Last 24 Hours</h3>
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr style="background:#f9fafb">
                  <td style="padding:8px 12px;border:1px solid #e5e7eb">Total attempts</td>
                  <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;text-align:right">${last24hAttempts ?? 0}</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px;border:1px solid #e5e7eb">✅ Successful</td>
                  <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;text-align:right;color:#16a34a">${last24hPaid ?? 0}</td>
                </tr>
                <tr style="background:#f9fafb">
                  <td style="padding:8px 12px;border:1px solid #e5e7eb">❌ Failed</td>
                  <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;text-align:right;color:#dc2626">${last24hFailed ?? 0}</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px;border:1px solid #e5e7eb">⏳ Pending</td>
                  <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;text-align:right;color:#d97706">${last24hPending ?? 0}</td>
                </tr>
              </table>
              <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:20px">
                ZimLearn Payment Monitor — all systems normal
              </p>
            </div>
          </div>
        `
        await sendEmail(ADMIN_EMAIL, '✅ ZimLearn Daily Payment Report', summaryHtml)
      }
    }

    // ── Return summary ───────────────────────────────────────────────────────

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      alerts: alerts.length,
      summary: {
        last48h: { attempts, successes, failures },
        last24h: {
          attempts: last24hAttempts ?? 0,
          paid: last24hPaid ?? 0,
          failed: last24hFailed ?? 0,
          pending: last24hPending ?? 0,
        },
        stuckPending: stuckCount ?? 0,
        lostConversions: stillFreeUsers.length,
      },
    })
  } catch (err) {
    console.error('[PAYMENT-MONITOR]', err)

    // Even on error, try to alert admin that the monitor itself failed
    try {
      await sendEmail(
        ADMIN_EMAIL,
        '🔴 ZimLearn Payment Monitor CRASHED',
        `<p>The payment monitoring cron failed with error:</p><pre>${err instanceof Error ? err.message : 'Unknown error'}</pre><p>Check Vercel logs immediately.</p>`
      )
    } catch { /* ignore email failure */ }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Monitor failed' },
      { status: 500 }
    )
  }
}
