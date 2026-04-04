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
const FROM_EMAIL = 'ZimLearn <admin@zim-elearningai.co.zw>'

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
