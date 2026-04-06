import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const filename = searchParams.get('file')

    if (!filename) {
      return NextResponse.json({ error: 'Filename required' }, { status: 400 })
    }

    // Generate the CSV content based on the requested file
    let csvContent = ''
    const contentType = 'text/csv'

    switch (filename) {
      case 'users_report.csv':
        const { data: users } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, plan, created_at, last_sign_in_at')
        
        csvContent = [
          'ID,Name,Email,Role,Plan,Created At,Last Login',
          ...(users || []).map(u => 
            `${u.id},"${u.full_name || ''}",${u.email},${u.role},${u.plan || 'free'},${u.created_at},${u.last_sign_in_at || 'Never'}`
          )
        ].join('\n')
        break

      case 'revenue_report.csv':
        const { data: revenue } = await supabase
          .from('profiles')
          .select('plan, subscription_expires_at, created_at')
          .not('plan', 'is', null)
        
        csvContent = [
          'Plan,Subscription Expires,Created At,Monthly Value',
          ...(revenue || []).map(r => {
            const monthlyValue = r.plan === 'premium' ? '$15' : r.plan === 'basic' ? '$5' : '$0'
            return `${r.plan},${r.subscription_expires_at || 'Lifetime'},${r.created_at},${monthlyValue}`
          })
        ].join('\n')
        break

      case 'activity_report.csv':
        const { data: activity } = await supabase
          .from('user_activity')
          .select('user_id, activity_type, created_at')
          .order('created_at', { ascending: false })
          .limit(10000)
        
        csvContent = [
          'User ID,Activity Type,Timestamp',
          ...(activity || []).map(a => `${a.user_id},${a.activity_type},${a.created_at}`)
        ].join('\n')
        break

      case 'performance_report.csv':
        const { data: performance } = await supabase
          .from('quiz_attempts')
          .select('score, total, subject_id, created_at, student_id')
          .order('created_at', { ascending: false })
          .limit(10000)
        
        csvContent = [
          'Student ID,Subject ID,Score,Total,Percentage,Attempt Date',
          ...(performance || []).map(p => {
            const percentage = Math.round((p.score / p.total) * 100)
            return `${p.student_id},${p.subject_id},${p.score},${p.total},${percentage}%,${p.created_at}`
          })
        ].join('\n')
        break

      default:
        return NextResponse.json({ error: 'Invalid file requested' }, { status: 400 })
    }

    // Log the download
    await supabase.from('admin_exports').insert({
      admin_id: user.id,
      filename,
      downloaded_at: new Date().toISOString()
    })

    // Return the CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (err) {
    console.error('[REPORTS DOWNLOAD]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
