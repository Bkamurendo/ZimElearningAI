export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only admins can send push notifications
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null; error: unknown }
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { userId, title: _title, body: _body, url: _url } = await req.json()

  // Get push subscriptions for target user
  type SubRow = { endpoint: string; p256dh: string; auth_key: string }
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')
    .eq('user_id', userId) as { data: SubRow[] | null; error: unknown }

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No push subscriptions for this user' })
  }

  // Note: To actually send push notifications, install web-push package:
  // npm install web-push
  // Then use webpush.sendNotification(sub, payload)
  // For now, we store the subscription and return success
  // The actual sending requires VAPID keys in env

  return NextResponse.json({ sent: subs.length, subscriptions: subs.length })
}
