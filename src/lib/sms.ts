/**
 * Africa's Talking SMS integration for Zimbabwe.
 * Docs: https://developers.africastalking.com/docs/sms/sending
 *
 * Env vars:
 *   AFRICASTALKING_API_KEY      — production API key
 *   AFRICASTALKING_USERNAME     — AT username (defaults to 'sandbox')
 *   AT_SENDER_ID                — registered sender ID (defaults to 'ZimLearn')
 *
 * Falls back to console.log in development when AFRICASTALKING_API_KEY is not set.
 */

const AT_API_KEY    = process.env.AFRICASTALKING_API_KEY ?? process.env.AT_API_KEY ?? ''
const AT_USERNAME   = process.env.AFRICASTALKING_USERNAME ?? process.env.AT_USERNAME ?? 'sandbox'
const AT_SENDER_ID  = process.env.AT_SENDER_ID ?? 'ZimLearn'

const AT_BASE_URL = AT_USERNAME === 'sandbox'
  ? 'https://api.sandbox.africastalking.com/version1/messaging'
  : 'https://api.africastalking.com/version1/messaging'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface BulkSMSResult {
  sent: number
  failed: number
  errors?: string[]
}

// ── Phone number formatting ───────────────────────────────────────────────────

/**
 * Normalise a Zimbabwe phone number to E.164 format (+263...).
 * Handles:
 *   07xxxxxxxx  → +2637xxxxxxxx
 *   2637xxxxxxx → +2637xxxxxxxx
 *   +2637xxxxxx → returned as-is
 */
export function formatZimbabweNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')

  if (digits.startsWith('263')) return `+${digits}`
  if (digits.startsWith('0'))   return `+263${digits.slice(1)}`

  // Assume local number without leading 0
  return `+263${digits}`
}

// ── Core send function ────────────────────────────────────────────────────────

/**
 * Send an SMS to one or more recipients.
 *
 * When called with a string array, all recipients receive the same message.
 * Gracefully handles a missing API key (logs a warning and returns success: false).
 */
export async function sendSMS(
  to: string | string[],
  message: string
): Promise<SMSResult> {
  const phones = (Array.isArray(to) ? to : [to])
    .map(formatZimbabweNumber)

  // Development / missing-credentials fallback
  if (!AT_API_KEY) {
    console.warn('[SMS] AFRICASTALKING_API_KEY is not set — SMS not sent (dev mode)')
    console.log('[SMS DEV]', { to: phones, message })
    return { success: false, error: 'API key not configured' }
  }

  try {
    const params = new URLSearchParams({
      username: AT_USERNAME,
      to: phones.join(','),
      message,
      from: AT_SENDER_ID,
    })

    const res = await fetch(AT_BASE_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        apiKey: AT_API_KEY,
      },
      body: params.toString(),
    })

    if (!res.ok) {
      const text = await res.text()
      return { success: false, error: `HTTP ${res.status}: ${text}` }
    }

    const json = await res.json() as {
      SMSMessageData?: {
        Message?: string
        Recipients?: { status: string; messageId?: string; number?: string }[]
      }
    }

    const recipients = json.SMSMessageData?.Recipients ?? []
    const failedRecipients = recipients.filter(r => r.status !== 'Success')

    if (failedRecipients.length > 0) {
      return {
        success: false,
        error: `Delivery failed for: ${failedRecipients.map(r => r.number).join(', ')}`,
      }
    }

    // Return the first messageId (useful for single-recipient calls)
    const messageId = recipients[0]?.messageId
    return { success: true, ...(messageId ? { messageId } : {}) }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

// ── Bulk send ─────────────────────────────────────────────────────────────────

/**
 * Send SMS to multiple recipients, each potentially with their own message.
 * Batches in groups of 50 to avoid overwhelming the API.
 */
export async function sendBulkSMS(
  recipients: { phone: string; message: string }[]
): Promise<BulkSMSResult> {
  if (recipients.length === 0) return { sent: 0, failed: 0 }

  // Development fallback
  if (!AT_API_KEY) {
    for (const r of recipients) {
      console.log('[SMS DEV]', { to: formatZimbabweNumber(r.phone), message: r.message })
    }
    return { sent: recipients.length, failed: 0 }
  }

  let sent = 0
  let failed = 0
  const errors: string[] = []

  const BATCH_SIZE = 50

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)

    const results = await Promise.allSettled(
      batch.map(r => sendSMS(r.phone, r.message))
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success) {
        sent++
      } else {
        failed++
        if (result.status === 'fulfilled' && result.value.error) {
          errors.push(result.value.error)
        }
      }
    }
  }

  return { sent, failed, errors }
}

// ── Named helper functions ────────────────────────────────────────────────────

export async function sendWelcomeSMS(
  phone: string,
  name: string
): Promise<void> {
  const { SMS_TEMPLATES } = await import('@/lib/sms-templates')
  await sendSMS(phone, SMS_TEMPLATES.welcome(name))
}

export async function sendTrialEndingSMS(
  phone: string,
  name: string,
  daysLeft: number
): Promise<void> {
  const { SMS_TEMPLATES } = await import('@/lib/sms-templates')
  await sendSMS(phone, SMS_TEMPLATES.trialEnding(name, daysLeft))
}

export async function sendAssignmentDueSMS(
  phone: string,
  studentName: string,
  subject: string,
  dueDate: string
): Promise<void> {
  const { SMS_TEMPLATES } = await import('@/lib/sms-templates')
  await sendSMS(phone, SMS_TEMPLATES.assignmentDue(studentName, subject, dueDate))
}

export async function sendGradePostedSMS(
  phone: string,
  studentName: string,
  subject: string,
  score: string
): Promise<void> {
  const { SMS_TEMPLATES } = await import('@/lib/sms-templates')
  await sendSMS(phone, SMS_TEMPLATES.gradePosted(studentName, subject, score))
}

export async function sendExamReminderSMS(
  phone: string,
  name: string,
  subject: string,
  daysUntil: number
): Promise<void> {
  const { SMS_TEMPLATES } = await import('@/lib/sms-templates')
  await sendSMS(phone, SMS_TEMPLATES.examReminder(name, subject, daysUntil))
}

export async function sendPasswordResetSMS(
  phone: string,
  name: string,
  code: string
): Promise<void> {
  const { SMS_TEMPLATES } = await import('@/lib/sms-templates')
  await sendSMS(phone, SMS_TEMPLATES.passwordReset(name, code))
}

export async function sendParentUpdateSMS(
  phone: string,
  parentName: string,
  childName: string,
  summary: string
): Promise<void> {
  const { SMS_TEMPLATES } = await import('@/lib/sms-templates')
  await sendSMS(phone, SMS_TEMPLATES.parentUpdate(parentName, childName, summary))
}
