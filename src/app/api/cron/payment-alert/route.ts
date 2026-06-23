export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

/**
 * GET /api/cron/payment-alert
 * 
 * Scheduled task (e.g. daily) to monitor payment health.
 * Logic: If there are payment attempts in the last 48 hours but ZERO successes,
 * it likely indicates a gateway configuration issue or a silent failure.
 */
export async function GET(req: NextRequest) {
  // Security: Verify CRON_SECRET to prevent public triggering
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // In dev we might skip this but in prod it's vital
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const supabase = createClient()
    
    // Define lookback period (48 hours)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    // 1. Count attempts (any status)
    const { count: totalAttempts, error: attemptErr } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fortyEightHoursAgo)

    if (attemptErr) throw attemptErr

    // 2. Count successes ('paid')
    const { count: totalSuccesses, error: successErr } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'paid')
      .gte('created_at', fortyEightHoursAgo)

    if (successErr) throw successErr

    console.log(`[Payment Monitor] 48h Scan: ${totalAttempts} attempts, ${totalSuccesses} successes.`)

    // 3. Evaluate Alert Condition
    // MUST have attempts (no attempts might just mean no traffic)
    // MUST have zero successes
    if ((totalAttempts ?? 0) > 0 && (totalSuccesses ?? 0) === 0) {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@zim-elearningai.co.zw'
      
      await sendEmail(
        adminEmail,
        '⚠️ CRITICAL: Payment System Alert (ZimLearn)',
        `
        <div style="font-family: sans-serif; color: #1f2937;">
          <h2 style="color: #ef4444;">Payment System Monitoring Alert</h2>
          <p>This is an automated alert from the ZimLearn monitoring service.</p>
          <div style="background: #fef2f2; border: 1px solid #fee2e2; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #991b1b;">Issue Detected: Zero Successful Payments</p>
            <ul style="margin-top: 10px;">
              <li><strong>Window:</strong> Last 48 Hours</li>
              <li><strong>Payment Attempts:</strong> ${totalAttempts}</li>
              <li><strong>Successes ('paid'):</strong> ${totalSuccesses}</li>
            </ul>
          </div>
          <p><strong>Action Required:</strong> Please check the payment gateway logs (Paynow/Flutterwave) and the <code>payments</code> table in Supabase immediately to ensure the initiation and callback routes are functioning correctly.</p>
          <p style="font-size: 12px; color: #6b7280; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 10px;">
            Sent by ZimLearn Monitoring Service · ${new Date().toLocaleString()}
          </p>
        </div>
        `
      )
      
      return NextResponse.json({ 
        alertSent: true, 
        attempts: totalAttempts, 
        successes: totalSuccesses 
      })
    }

    return NextResponse.json({ 
      alertSent: false, 
      attempts: totalAttempts, 
      successes: totalSuccesses 
    })

  } catch (error) {
    console.error('[Payment Monitor] Failure:', error)
    return NextResponse.json({ error: 'Monitor failed' }, { status: 500 })
  }
}
