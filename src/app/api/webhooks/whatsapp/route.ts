import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAIResponse } from '@/lib/ai/chat' // Assuming this helper exists from previous phases

/**
 * ZIMLEARN WHATSAPP BRIDGE (WEBHOOK)
 * This endpoint handles incoming messages from students via WhatsApp.
 * It identifies the student by their phone number and returns a MaFundi AI response.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  
  try {
    // 1. Parse incoming WhatsApp payload (assuming Twilio/Meta format)
    const data = await req.formData()
    const fromPhone = data.get('From')?.toString().replace('whatsapp:', '') || ''
    const body = data.get('Body')?.toString() || ''

    if (!fromPhone || !body) {
      return NextResponse.json({ error: 'Missing phone or body' }, { status: 400 })
    }

    // 2. Identify Student Profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('phone', fromPhone)
      .single()

    if (profileError || !profile) {
      console.warn(`[WhatsApp Bridge] Unknown number: ${fromPhone}`)
      return NextResponse.json({ 
        message: 'Welcome to ZimLearn! We couldn\'t find your number in our system. Please register at zimlearn.co.zw to start chatting with MaFundi.' 
      })
    }

    // 3. Get Student Context (Grade, Level, etc.)
    const { data: student } = await supabase
      .from('student_profiles')
      .select('zimsec_level, current_stage')
      .eq('user_id', profile.id)
      .single()

    // 4. Route to MaFundi AI
    const aiResponse = await generateAIResponse({
      userId: profile.id,
      message: body,
      context: {
        grade: student?.zimsec_level || 'Grade 7',
        name: profile.full_name,
        channel: 'whatsapp'
      }
    })

    // 5. Send Response Back (Mocking the external WhatsApp API call)
    // In production, you would use: await twilio.messages.create({ body: aiResponse, from: '...', to: `whatsapp:${fromPhone}` })
    console.info(`[WhatsApp Bridge] MaFundi responding to ${profile.full_name}: ${aiResponse.substring(0, 50)}...`)

    // Return TwiML or similar format for the WhatsApp provider
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
       <Response>
         <Message>MaFundi: ${aiResponse}</Message>
       </Response>`,
      {
        headers: { 'Content-Type': 'application/xml' }
      }
    )

  } catch (err) {
    console.error('[WhatsApp Bridge] Fatal Error:', err)
    return NextResponse.json({ error: 'Internal Bridge Failure' }, { status: 500 })
  }
}

/**
 * Verification for webhook setup (e.g., Meta/Twilio verification)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const challenge = searchParams.get('hub.challenge')
  return new Response(challenge || 'ZimLearn WhatsApp Bridge Active')
}
