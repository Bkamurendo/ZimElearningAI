export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const challengeId = searchParams.get('challengeId')
  if (!challengeId) return NextResponse.json({ error: 'Missing challengeId' }, { status: 400 })

  // Fetch top 10 attempts ordered by score desc, then time asc
  const { data: attempts, error } = await supabase
    .from('daily_challenge_attempts')
    .select('user_id, score, xp_earned, time_taken_seconds, completed_at')
    .eq('challenge_id', challengeId)
    .order('score', { ascending: false })
    .order('time_taken_seconds', { ascending: true })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 })
  }

  if (!attempts || attempts.length === 0) {
    return NextResponse.json({ entries: [] })
  }

  // Fetch profiles for user names
  const userIds = attempts.map((a) => a.user_id as string)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds) as { data: { id: string; full_name: string }[] | null; error: unknown }

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

  const entries = attempts.map((a) => ({
    user_id: a.user_id,
    score: a.score,
    xp_earned: a.xp_earned,
    time_taken_seconds: a.time_taken_seconds,
    completed_at: a.completed_at,
    profiles: profileMap[a.user_id as string] ? { full_name: profileMap[a.user_id as string].full_name } : null,
  }))

  return NextResponse.json({ entries })
}
