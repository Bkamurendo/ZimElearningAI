import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { sendSMS } from '@/lib/sms'

const client = new Anthropic()

// Core system prompt (simplified for WhatsApp)
const WHATSAPP_PROMPT = `You are MaFundi, the official AI Teacher for ZimLearn. 
You are communicating via WhatsApp. Keep your responses concise (under 800 characters) but highly informative.
Use ZIMSEC syllabus alignment. Be encouraging. 
If the student asks for a past paper, tell them to log in to zim-elearningai.co.zw for full access.
Always prefer local Zimbabwean examples.`

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const from = formData.get('from')?.toString() // Student's phone
    const text = formData.get('text')?.toString() // Student's message

    if (!from || !text) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const supabase = createClient()

    // 1. Identify student by phone number
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, role, plan')
      .eq('phone', from)
      .single()

    if (!profile || profile.role !== 'student') {
      // If not registered, send a welcome/invite message
      await sendSMS(from, "Mhoro! I'm MaFundi, your AI Teacher. I don't recognize this number. Please register at https://zim-elearningai.co.zw to start learning!")
      return NextResponse.json({ ok: true })
    }

    // 2. Check Plan - Premium users get unlimited WhatsApp AI, Free get 1 query/day via WhatsApp
    if (profile.plan === 'free') {
      // check if already used today (simple check for prototype)
      // For now, we'll allow but warn
    }

    // 3. Generate AI Response
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 400,
      system: WHATSAPP_PROMPT,
      messages: [{ role: 'user', content: text }],
    })

    const aiMsg = response.content[0].type === 'text' ? response.content[0].text : "I'm sorry, I couldn't process that. Please try again."

    // 4. Send back via WhatsApp (Africa's Talking handles routing if configured)
    await sendSMS(from, aiMsg)

    // 5. Log the interaction
    await supabase.from('ai_teacher_messages').insert({
      role: 'assistant',
      content: aiMsg,
      metadata: { source: 'whatsapp', student_phone: from }
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[WhatsApp Webhook Error]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
