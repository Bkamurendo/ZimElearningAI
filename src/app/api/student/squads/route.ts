export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

/**
 * GET /api/student/squads
 * Fetch squads the student is a member of, plus a few public squads.
 */
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // 1. Fetch user's squads
    const { data: membership } = await supabase
      .from('study_squad_members')
      .select('squad_id')
      .eq('user_id', user.id)
    
    const squadIds = membership?.map(m => m.squad_id) || []

    const { data: mySquads } = await supabase
      .from('study_squads')
      .select('*, study_squad_members(count)')
      .in('id', squadIds)

    // 2. Fetch public squads (discovery)
    const { data: publicSquads } = await supabase
      .from('study_squads')
      .select('*, study_squad_members(count)')
      .eq('is_private', false)
      .not('id', 'in', `(${squadIds.join(',') || '00000000-0000-0000-0000-000000000000'})`)
      .limit(3)

    return NextResponse.json({
      mySquads: mySquads || [],
      publicSquads: publicSquads || []
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch squads' }, { status: 500 })
  }
}

/**
 * POST /api/student/squads
 * Create a new study squad
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { name, description, is_private } = await req.json()
    
    // 1. Create Squad
    const { data: squad, error } = await supabase
      .from('study_squads')
      .insert({
        name,
        description,
        is_private,
        created_by: user.id,
        invite_code: nanoid(6).toUpperCase()
      })
      .select()
      .single()

    if (error) throw error

    // 2. Add creator as admin member
    await supabase
      .from('study_squad_members')
      .insert({
        squad_id: squad.id,
        user_id: user.id,
        role: 'admin'
      })

    return NextResponse.json({ success: true, squad })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create squad' }, { status: 500 })
  }
}
