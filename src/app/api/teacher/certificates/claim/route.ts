import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { certId, certName } = await req.json()

    // check points
    const { data: pointsData } = await supabase
      .from('teacher_cpd_points')
      .select('points')
      .eq('teacher_id', user.id)
    
    const totalPoints = (pointsData ?? []).reduce((acc, curr) => acc + curr.points, 0)
    
    const thresholds: Record<string, number> = {
      'foundation': 50,
      'specialist': 150,
      'master': 500
    }

    if (totalPoints < (thresholds[certId] || 999999)) {
      return NextResponse.json({ error: 'Insufficient CPD points' }, { status: 400 })
    }

    // Check if already claimed
    const { data: existing } = await supabase
      .from('teacher_certificates')
      .select('id')
      .eq('teacher_id', user.id)
      .eq('certificate_type', certId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Certificate already claimed', id: existing.id })
    }

    // Generate certificate
    const { data, error } = await supabase
      .from('teacher_certificates')
      .insert({
        teacher_id: user.id,
        certificate_type: certId,
        verification_code: `ZL-${certId.toUpperCase()}-${nanoid(6).toUpperCase()}`,
        metadata: { name: certName }
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, certificate: data })
  } catch (error: any) {
    console.error('Claim Certificate Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
