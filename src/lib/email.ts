/**
 * Resend email integration for Zimbabwe E-Learning.
 * Docs: https://resend.com/docs
 *
 * Env vars:
 *   RESEND_API_KEY      — production API key
 *
 * Falls back to console.log in development when RESEND_API_KEY is not set.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'ZimLearn <admin@zim-elearningai.co.zw>'

export interface EmailResult {
  success: boolean
  id?: string
  error?: string
}

export async function sendEmail(to: string, subject: string, html: string): Promise<EmailResult> {
  if (!RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY is not set — Email not sent (dev mode)')
    console.log('[EMAIL DEV]', { to, subject })
    return { success: false, error: 'API key not configured' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`[EMAIL FATAL] Resend API rejected payload. Status: ${res.status}, Details:`, text)
      return { success: false, error: `HTTP ${res.status}: ${text}` }
    }

    const { id } = (await res.json()) as { id: string }
    return { success: true, id }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export async function sendTrialExpiredEmail(
  to: string,
  name: string | null,
): Promise<EmailResult> {
  const displayName = name ?? 'Student'
  const html = `
    <h2>Your ZimLearn subscription has expired</h2>
    <p>Hi ${displayName},</p>
    <p>Your paid plan has expired and your account has been moved to the free tier.</p>
    <p>Renew your subscription to regain full access to AI tutoring, past papers, and more.</p>
    <p><a href="https://zim-elearningai.co.zw/student/upgrade">Renew now</a></p>
    <p>The ZimLearn Team</p>
  `
  return sendEmail(to, 'Your ZimLearn subscription has expired', html)
}

export async function sendSubscriptionExpiringSoonEmail(
  to: string,
  name: string | null,
  daysLeft: number,
  planLabel: string,
): Promise<EmailResult> {
  const displayName = name ?? 'Student'
  const html = `
    <h2>Your ZimLearn ${planLabel} plan expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}</h2>
    <p>Hi ${displayName},</p>
    <p>Your ${planLabel} subscription will expire in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>.</p>
    <p>Renew now to keep uninterrupted access to AI tutoring, past papers, and all premium features.</p>
    <p><a href="https://zim-elearningai.co.zw/student/upgrade">Renew my subscription</a></p>
    <p>The ZimLearn Team</p>
  `
  return sendEmail(to, `Your ZimLearn ${planLabel} plan expires soon`, html)
}
