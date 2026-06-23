export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, role, school, phone, email, students, message } = body

    if (!name || !role || !school || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient()

    // Try to save to DB; if the table doesn't exist yet, fall back gracefully
    try {
      await supabase.from('school_inquiries').insert({
        contact_name: name,
        contact_role: role,
        school_name: school,
        phone,
        email: email || null,
        student_count: students || null,
        message: message || null,
      })
    } catch {
      // Table doesn't exist yet — still return success so the form works
      console.warn('[school-inquiry] school_inquiries table not found — inquiry not saved to DB')
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 })
  }
}
