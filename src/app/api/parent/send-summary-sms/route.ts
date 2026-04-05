import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendSMS } from '@/lib/sms';
import { SMS_TEMPLATES } from '@/lib/sms-templates';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { student_id, phone_number, student_name, average_pulse } = await req.json();

    if (!student_id || !phone_number || !student_name || average_pulse === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify parent has access to this student
    const { data: student } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('id', student_id)
      .eq('parent_id', user.id)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Student not found or access denied' }, { status: 403 });
    }

    // Generate and send SMS
    const message = SMS_TEMPLATES.readyPulse(student_name, Math.round(average_pulse));
    const result = await sendSMS(phone_number, message);

    if (result.success) {
      return NextResponse.json({ success: true, message: 'SMS summary sent to your phone' });
    } else {
      return NextResponse.json({ error: result.error || 'Failed to send SMS' }, { status: 500 });
    }
  } catch (err) {
    console.error('SMS Summary error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
