export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/student/learning-sessions
 * Logs a learning session (minutes spent on a specific activity)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { session_type, duration_minutes, subject_code } = await req.json()

    if (!session_type || !duration_minutes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('learning_sessions')
      .insert({
        user_id: user.id,
        session_type,
        duration_minutes,
        subject_code: subject_code || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, session: data })
  } catch (error) {
    console.error('Learning session log error:', error)
    return NextResponse.json({ 
      error: 'Failed to log learning session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/student/learning-sessions
 * Fetches stats for the current user (e.g. today's total minutes)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Default to last 7 days of stats if no range provided
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') ?? '7')
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('learning_sessions')
      .select('session_type, duration_minutes, created_at, subject_code')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ sessions: data ?? [] })
  } catch (error) {
    console.error('Learning session fetch error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
