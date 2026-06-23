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
  const id  = process.env.PAYNOW_INTEGRATION_ID?.trim()
  const key = process.env.PAYNOW_INTEGRATION_KEY?.trim()
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').trim().replace(/\/+$/, '')

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
  // ── Starter ────────────────────────────────────────────────────────────────
  starter_monthly: {
    id: 'starter_monthly',
    label: 'Starter Monthly',
    tier: 'starter' as const,
    amountUsd: 2.00,
    days: 30,
    description: 'ZimLearn Starter — 1 Month Access',
  },
  starter_yearly: {
    id: 'starter_yearly',
    label: 'Starter Yearly',
    tier: 'starter' as const,
    amountUsd: 15.00,
    days: 365,
    description: 'ZimLearn Starter — 1 Year Access',
  },
  // ── Pro Scholar ────────────────────────────────────────────────────────────
  pro_monthly: {
    id: 'pro_monthly',
    label: 'Pro Monthly',
    tier: 'pro' as const,
    amountUsd: 5.00,
    days: 30,
    description: 'ZimLearn Pro — 1 Month Access',
  },
  pro_yearly: {
    id: 'pro_yearly',
    label: 'Pro Yearly',
    tier: 'pro' as const,
    amountUsd: 40.00,
    days: 365,
    description: 'ZimLearn Pro — 1 Year Access',
  },
  // ── Elite ──────────────────────────────────────────────────────────────────
  elite_monthly: {
    id: 'elite_monthly',
    label: 'Elite Monthly',
    tier: 'elite' as const,
    amountUsd: 12.00,
    days: 30,
    description: 'ZimLearn Elite — 1 Month Access',
  },
  elite_yearly: {
    id: 'elite_yearly',
    label: 'Elite Yearly',
    tier: 'elite' as const,
    amountUsd: 90.00,
    days: 365,
    description: 'ZimLearn Elite — 1 Year Access',
  },
  // ── Ultimate ───────────────────────────────────────────────────────────────
  ultimate_monthly: {
    id: 'ultimate_monthly',
    label: 'Ultimate Monthly',
    tier: 'ultimate' as const,
    amountUsd: 25.00,
    days: 30,
    description: 'ZimLearn Ultimate — 1 Month Access',
  },
  ultimate_yearly: {
    id: 'ultimate_yearly',
    label: 'Ultimate Yearly',
    tier: 'ultimate' as const,
    amountUsd: 200.00,
    days: 365,
    description: 'ZimLearn Ultimate — 1 Year Access',
  },
  // ── Exam Bootcamp (seasonal) ────────────────────────────────────────────────
  bootcamp_2week: {
    id: 'bootcamp_2week',
    label: 'Exam Bootcamp 2-Week',
    tier: 'pro' as const,
    amountUsd: 3.00,
    days: 14,
    description: 'ZimLearn Exam Bootcamp — 2 Weeks Pro Access (ZIMSEC Prep)',
  },
  bootcamp_4week: {
    id: 'bootcamp_4week',
    label: 'Exam Bootcamp 4-Week',
    tier: 'pro' as const,
    amountUsd: 5.00,
    days: 28,
    description: 'ZimLearn Exam Bootcamp — 4 Weeks Pro Access (ZIMSEC Prep)',
  },
  // ── School Licensing ────────────────────────────────────────────────────────
  school_basic_monthly: {
    id: 'school_basic_monthly',
    label: 'School Basic Monthly',
    tier: 'pro' as const,
    amountUsd: 50.00,
    days: 30,
    description: 'ZimLearn School Basic — Up to 50 Students (1 Month)',
  },
  school_pro_monthly: {
    id: 'school_pro_monthly',
    label: 'School Pro Monthly',
    tier: 'elite' as const,
    amountUsd: 120.00,
    days: 30,
    description: 'ZimLearn School Pro — Unlimited Students (1 Month)',
  },
  school_pro_yearly: {
    id: 'school_pro_yearly',
    label: 'School Pro Yearly',
    tier: 'elite' as const,
    amountUsd: 1000.00,
    days: 365,
    description: 'ZimLearn School Pro — Unlimited Students (1 Year)',
  },
  // ── Parent Monitoring (NEW) ────────────────────────────────────────────────
  parent_monitoring_monthly: {
    id: 'parent_monitoring_monthly',
    label: 'Premium Parent Monitoring',
    tier: 'pro' as const,
    amountUsd: 3.00,
    days: 30,
    description: 'ZimLearn Parent — Weekly Reports & Detailed Student Activity',
  },
  // ── One-time Purchases (NEW) ───────────────────────────────────────────────
  ai_grade_report: {
    id: 'ai_grade_report',
    label: 'Comprehensive AI Grade Report',
    tier: 'pro' as const,
    amountUsd: 2.00,
    days: 0,
    description: 'Full AI-generated study action plan & predicted grade report (PDF)',
  },
  subject_pack: {
    id: 'subject_pack',
    label: 'Single Subject Study Pack',
    amountUsd: 1.50,
    days: 365,
    tier: 'pro' as const,
    description: 'Lifetime access to one ZIMSEC subject for a single year.',
  },
  
  // TEACHER PREMIUM
  teacher_pro: {
    id: 'teacher_pro',
    label: 'Teacher Pro Scholar',
    amountUsd: 5.00,
    days: 30,
    tier: 'pro' as const,
    description: 'Unlock AI Auto-Grader, Bulk Test Generator, and CPD Certificates.',
  },

  // SCHOOL INSTITUTIONAL
  school_elite_basic: {
    id: 'school_elite_basic',
    label: 'School Elite (Starter)',
    amountUsd: 100.00,
    days: 30,
    tier: 'pro' as const,
    description: 'Full school dashboard for up to 10 teachers and 100 students.',
  },
  school_elite_unlimited: {
    id: 'school_elite_unlimited',
    label: 'School Elite (Unlimited)',
    amountUsd: 1000.00,
    days: 365,
    tier: 'elite' as const,
    description: 'Unlimited access for all teachers and students + custom branding.',
  },

  // CORPORATE CSR
  corporate_gold: {
    id: 'corporate_gold',
    label: 'Corporate Scholarship Partner',
    amountUsd: 500.00,
    days: 365,
    tier: 'elite' as const,
    description: 'Fund a pool of 50 student scholarships for 1 year + branding.',
  },
  
  // MICRO-PASS (NEW)
  exam_micro_pass: {
    id: 'exam_micro_pass',
    label: '24-Hour Exam Micro-Pass',
    amountUsd: 0.50,
    days: 1,
    tier: 'pro' as const,
    description: '24 hours of full Pro access for emergency ZIMSEC exam preparation.',
  },
} as const

export type PlanId = keyof typeof PLANS
