import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendBulkSMS } from '@/lib/sms'

interface SMSRequestBody {
  userIds?: string[]
  phones?: string[]
  message: string
  type?: string
}

/**
 * POST /api/notifications/sms
 *
 * Auth: admin session OR x-internal-key header matching INTERNAL_API_KEY env var.
 *
 * Body:
 *   { userIds?, phones?, message, type? }
 *
 * If userIds are provided the handler looks up phone numbers from
 *   parent_profiles.phone_number  (for parents)
 *   profiles (future: phone column)
 * then merges them with any directly supplied phone numbers.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const internalKey = req.headers.get('x-internal-key')
  const isInternalCall =
    internalKey &&
    process.env.INTERNAL_API_KEY &&
    internalKey === process.env.INTERNAL_API_KEY

  if (!isInternalCall) {
    // Fall back to Supabase session auth — must be admin
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }
  }

  // ── Parse body ───────────────────────────────────────────────────────────────
  let body: SMSRequestBody
  try {
    body = (await req.json()) as SMSRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { userIds, phones, message } = body

  if (!message || message.trim().length === 0) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  const resolvedPhones: string[] = phones ? [...phones] : []

  // ── Resolve userIds → phone numbers ─────────────────────────────────────────
  if (userIds && userIds.length > 0) {
    const supabase = createClient()

    // Look up parent_profiles for phone numbers
    const { data: parentPhones } = await supabase
      .from('parent_profiles')
      .select('phone_number')
      .in('id', userIds)

    if (parentPhones) {
      for (const row of parentPhones) {
        if (row.phone_number) {
          resolvedPhones.push(row.phone_number as string)
        }
      }
    }

    // Future: look up profiles.phone if that column is added
    // const { data: profilePhones } = await supabase
    //   .from('profiles')
    //   .select('phone')
    //   .in('id', userIds)
  }

  if (resolvedPhones.length === 0) {
    return NextResponse.json(
      { error: 'No phone numbers found for the given userIds/phones' },
      { status: 400 }
    )
  }

  // Deduplicate
  const uniquePhones = Array.from(new Set(resolvedPhones))

  // ── Send ─────────────────────────────────────────────────────────────────────
  const recipients = uniquePhones.map(phone => ({ phone, message }))
  const result = await sendBulkSMS(recipients)

  return NextResponse.json(result, { status: 200 })
}
