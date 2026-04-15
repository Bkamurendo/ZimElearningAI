/**
 * Paynow Zimbabwe payment gateway utility.
 *
 * Supports:
 *  - EcoCash mobile money (USSD push to phone)
 *  - OneMoney mobile money
 *  - InnBucks mobile money
 *  - Web checkout (ZimSwitch / Visa / Mastercard via Paynow redirect)
 *
 * Env vars required:
 *   PAYNOW_INTEGRATION_ID   — from Paynow merchant dashboard
 *   PAYNOW_INTEGRATION_KEY  — from Paynow merchant dashboard
 *   NEXT_PUBLIC_SITE_URL    — e.g. https://zimlearn.co.zw
 */

import { Paynow } from 'paynow'

export type MobileMethod = 'ecocash' | 'onemoney' | 'innbucks'

export interface CreatePaymentOptions {
  reference: string          // unique order ref, e.g. `pro-${userId}-${Date.now()}`
  email: string              // payer's email
  amountUsd: number          // amount in USD
  description: string        // line item description shown on Paynow checkout
  method?: 'web' | MobileMethod
  phone?: string             // required for mobile money (EcoCash etc.)
}

export interface PaynowInitResult {
  success: boolean
  /** For web: URL to redirect browser to; for EcoCash: empty (USSD push sent) */
  redirectUrl?: string
  /** Paynow poll URL — use this to check payment status */
  pollUrl?: string
  /** Raw error message if success === false */
  error?: string
}

export interface PaynowPollResult {
  paid: boolean
  status: string   // e.g. 'Paid', 'Pending', 'Cancelled', 'Failed'
  amount?: number
}

// ── Build client ──────────────────────────────────────────────────────────────

function buildClient() {
  const id  = process.env.PAYNOW_INTEGRATION_ID
  const key = process.env.PAYNOW_INTEGRATION_KEY
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  if (!id || !key) {
    throw new Error('PAYNOW_INTEGRATION_ID or PAYNOW_INTEGRATION_KEY is not set')
  }

  const pn = new Paynow(id, key)
  pn.resultUrl = `${base}/api/payments/callback`  // server-to-server webhook
  pn.returnUrl = `${base}/student/upgrade?status=return` // browser redirect after payment
  return pn
}

// ── Create & initiate a payment ───────────────────────────────────────────────

export async function createPaynowPayment(opts: CreatePaymentOptions): Promise<PaynowInitResult> {
  const pn = buildClient()

  // Paynow requires a valid email for all payment types.
  // In test mode it must match the merchant's registered email (PAYNOW_MERCHANT_EMAIL).
  // For web checkout use the customer email for auto-login; for mobile use merchant email.
  const merchantEmail = process.env.PAYNOW_MERCHANT_EMAIL ?? opts.email
  const authEmail = opts.method === 'web' ? opts.email : merchantEmail
  const payment = pn.createPayment(opts.reference, authEmail)
  payment.add(opts.description, opts.amountUsd)

  try {
    if (opts.method && opts.method !== 'web') {
      // Mobile money (EcoCash / OneMoney / InnBucks) — USSD push
      if (!opts.phone) return { success: false, error: 'Phone number required for mobile money' }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await pn.sendMobile(payment, opts.phone, opts.method)

      if (!res.success) {
        return { success: false, error: res.error ?? 'Payment initiation failed' }
      }

      return {
        success: true,
        pollUrl: res.pollUrl ?? '',
        redirectUrl: undefined,
      }
    } else {
      // Web checkout (redirect to Paynow hosted page)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await pn.send(payment)

      if (!res.success) {
        return { success: false, error: res.error ?? 'Payment initiation failed' }
      }

      return {
        success: true,
        redirectUrl: res.redirectUrl ?? '',
        pollUrl: res.pollUrl ?? '',
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown payment error',
    }
  }
}

// ── Poll payment status ───────────────────────────────────────────────────────

export async function pollPaynowStatus(pollUrl: string): Promise<PaynowPollResult> {
  const pn = buildClient()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status: any = await pn.pollTransaction(pollUrl)

    return {
      paid: typeof status.paid === 'function' ? status.paid() : status.paid === true,
      status: status.status ?? 'Unknown',
      amount: status.amount,
    }
  } catch {
    return { paid: false, status: 'Error' }
  }
}

// ── Parse Paynow server callback (URL-encoded POST body) ──────────────────────

export function parsePaynowCallback(
  body: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _integrationKey: string
): { valid: boolean; reference?: string; status?: string; paynowReference?: string; amount?: number } {
  const pn = buildClient()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed: any = pn.parseStatusUpdate(body)

    // Verify hash
    if (!pn.verifyHash(parsed)) {
      return { valid: false }
    }

    return {
      valid: true,
      reference: parsed.reference,
      status: parsed.status,
      paynowReference: parsed.paynowreference,
      amount: parseFloat(parsed.amount ?? '0'),
    }
  } catch {
    return { valid: false }
  }
}

// ── Plan pricing ──────────────────────────────────────────────────────────────

export const PLANS = {
  starter_monthly: {
    id: 'starter_monthly',
    label: 'Starter',
    amountUsd: 2.00,
    days: 30,
    tier: 'starter' as const,
    description: 'ZimLearn Starter — 1 Month Access',
  },
  pro_monthly: {
    id: 'pro_monthly',
    label: 'Pro Monthly',
    amountUsd: 5.00,
    days: 30,
    tier: 'pro' as const,
    description: 'ZimLearn Pro — 1 Month Access',
  },
  pro_quarterly: {
    id: 'pro_quarterly',
    label: 'Pro Quarterly',
    amountUsd: 12.00,
    days: 90,
    tier: 'pro' as const,
    description: 'ZimLearn Pro — 3 Months Access',
  },
  pro_yearly: {
    id: 'pro_yearly',
    label: 'Pro Yearly',
    amountUsd: 35.00,
    days: 365,
    tier: 'pro' as const,
    description: 'ZimLearn Pro — 1 Year Access',
  },
} as const

export type PlanId = keyof typeof PLANS
