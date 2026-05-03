export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * School Leaderboard API
 * Ranks schools based on student "ZIMSEC Readiness Index" (average Pass Pulse).
 * This drives competitive adoption across regions.
 */
export async function GET() {
  const supabase = createClient()
  
  try {
    // 1. Fetch schools and their students' readiness scores
    // We join schools -> student_profiles -> profiles
    const { data: schoolsData, error } = await supabase
      .from('schools')
      .select(`
        id,
        name,
        location,
        student_profiles (
          id,
          user_id
        )
      `)

    if (error) throw error

    // 2. Aggregate Readiness Scores (Pass Pulse) for each school
    const leaderboard = await Promise.all((schoolsData || []).map(async (school) => {
      const studentIds = school.student_profiles?.map((sp: any) => sp.id) || []
      
      if (studentIds.length === 0) {
        return {
          id: school.id,
          name: school.name,
          location: school.location,
          studentCount: 0,
          readinessIndex: 0,
          rank: 'Dormant'
        }
      }

      // Fetch average pulse for these students
      // (This simulates the readiness-audit logic at scale)
      const { data: mastery } = await supabase
        .from('topic_mastery')
        .select('mastery_level')
        .in('student_id', studentIds)

      const masteredCount = mastery?.filter(m => m.mastery_level === 'mastered').length || 0
      const totalTopics = mastery?.length || 1
      const readinessIndex = Math.round((masteredCount / totalTopics) * 100)

      return {
        id: school.id,
        name: school.name,
        location: school.location,
        studentCount: studentIds.length,
        readinessIndex,
        rank: readinessIndex >= 80 ? 'Elite' : readinessIndex >= 50 ? 'Competitive' : 'Rising'
      }
    }))

    // 3. Sort by Readiness Index
    const sortedLeaderboard = leaderboard
      .sort((a, b) => b.readinessIndex - a.readinessIndex)
      .map((entry, index) => ({ ...entry, position: index + 1 }))

    return NextResponse.json({
      success: true,
      lastUpdated: new Date().toISOString(),
      leaderboard: sortedLeaderboard.slice(0, 50) // Top 50 schools
    })

  } catch (err) {
    console.error('[school-leaderboard] Error:', err)
    return NextResponse.json({ error: 'Failed to generate leaderboard' }, { status: 500 })
  }
}
