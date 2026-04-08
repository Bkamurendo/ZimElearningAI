/**
 * Flutterwave payment gateway utility.
 *
 * Supports: Visa, Mastercard, Google Pay, Apple Pay, M-Pesa, and more.
 * Works for international clients worldwide.
 *
 * Env vars required:
 *   FLUTTERWAVE_SECRET_KEY  — from Flutterwave dashboard (Settings → API Keys)
 *   NEXT_PUBLIC_SITE_URL    — e.g. https://zimlearn.co.zw
 */

const FLW_BASE = 'https://api.flutterwave.com/v3'

function getSecretKey(): string {
  const key = process.env.FLUTTERWAVE_SECRET_KEY?.trim()
  if (!key) throw new Error('FLUTTERWAVE_SECRET_KEY is not set')
  return key
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FlutterwaveInitOptions {
  txRef: string         // unique transaction reference (our internal ID)
  amount: number        // amount in USD
  email: string         // customer email
  name: string          // customer name
  planId: string        // for our DB records
  redirectUrl: string   // where Flutterwave sends the user after payment
  description: string   // shown on Flutterwave checkout page
}

export interface FlutterwaveInitResult {
  success: boolean
  paymentLink?: string   // URL to redirect user to
  error?: string
}

export interface FlutterwaveVerifyResult {
  success: boolean
  paid: boolean
  txRef?: string
  amount?: number
  currency?: string
  status?: string
  error?: string
}

// ── Create a hosted payment link ──────────────────────────────────────────────

export async function createFlutterwavePayment(
  opts: FlutterwaveInitOptions
): Promise<FlutterwaveInitResult> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    const payload = {
      tx_ref: opts.txRef,
      amount: opts.amount,
      currency: 'USD',
      redirect_url: opts.redirectUrl,
      payment_options: 'card,googlepay,applepay',
      customer: {
        email: opts.email,
        name: opts.name,
      },
      customizations: {
        title: 'ZimLearn Pro',
        description: opts.description,
        logo: `${base}/logo.png`,
      },
      meta: {
        plan_id: opts.planId,
        source: 'zimlearn-web',
      },
    }

    const res = await fetch(`${FLW_BASE}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json() as { status: string; data?: { link: string }; message?: string }

    if (data.status === 'success' && data.data?.link) {
      return { success: true, paymentLink: data.data.link }
    }

    return { success: false, error: data.message ?? 'Failed to create payment link' }

  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown Flutterwave error',
    }
  }
}

// ── Verify a completed transaction ────────────────────────────────────────────

export async function verifyFlutterwavePayment(
  transactionId: string
): Promise<FlutterwaveVerifyResult> {
  try {
    const res = await fetch(`${FLW_BASE}/transactions/${transactionId}/verify`, {
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
      },
    })

    const data = await res.json() as {
      status: string
      data?: {
        status: string
        currency: string
        amount: number
        tx_ref: string
      }
      message?: string
    }

    if (data.status !== 'success' || !data.data) {
      return { success: false, paid: false, error: data.message ?? 'Verification failed' }
    }

    const tx = data.data
    const paid = tx.status === 'successful' && tx.currency === 'USD'

    return {
      success: true,
      paid,
      txRef: tx.tx_ref,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status,
    }

  } catch (err) {
    return {
      success: false,
      paid: false,
      error: err instanceof Error ? err.message : 'Unknown verification error',
    }
  }
}
