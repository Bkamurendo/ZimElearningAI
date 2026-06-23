export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { sendSMS } from '@/lib/sms'
import { KnowledgeEngine } from '@/lib/ai/knowledge-engine'

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
    // Support both Twilio (From/Body/Media) and Africa's Talking
    const from = formData.get('From')?.toString() || formData.get('from')?.toString()
    const text = formData.get('Body')?.toString() || formData.get('text')?.toString() || ''
    const numMedia = parseInt(formData.get('NumMedia')?.toString() || '0')
    const mediaUrl = formData.get('MediaUrl0')?.toString()
    const mediaType = formData.get('MediaContentType0')?.toString() || 'image/jpeg'

    if (!from || (!text && numMedia === 0)) {
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

    // 2. Fetch or Create Unified Conversation Thread
    const { data: recentConv } = await supabase
      .from('ai_teacher_conversations')
      .select('id')
      .eq('student_id', profile.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let convId = recentConv?.id
    if (!convId) {
      const { data: newConv } = await supabase
        .from('ai_teacher_conversations')
        .insert({ student_id: profile.id, title: text.slice(0, 40) })
        .select('id')
        .single()
      convId = newConv?.id
    }

    if (!convId) return NextResponse.json({ ok: false }, { status: 500 })

    // Insert the WhatsApp text into the web database thread
    await supabase.from('ai_teacher_messages').insert({
      conversation_id: convId,
      role: 'user',
      content: numMedia > 0 ? `[Image Sent via WhatsApp]\n${text}` : text,
      metadata: { source: 'whatsapp', student_phone: from, media_url: mediaUrl }
    })

    // Update conversation timestamp
    await supabase.from('ai_teacher_conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId)

    // Fetch unified conversation history (last 5 messages)
    const { data: history } = await supabase
      .from('ai_teacher_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(8)

    const mappedMessages: any[] = (history || []).map(h => ({ role: h.role as 'user' | 'assistant', content: h.content }))

    if (numMedia > 0 && mediaUrl && mappedMessages.length > 0) {
      try {
        const imgRes = await fetch(mediaUrl)
        const arrayBuffer = await imgRes.arrayBuffer()
        const base64Data = Buffer.from(arrayBuffer).toString('base64')
        
        // Replace the plain text DB record locally for the AI inference with the rich image payload
        mappedMessages[mappedMessages.length - 1].content = [
          { type: 'image', source: { type: 'base64', media_type: mediaType === 'image/png' ? 'image/png' : 'image/jpeg', data: base64Data } },
          { type: 'text', text: text || "Please analyze this image. Solve any problems shown or explain the concepts step-by-step." }
        ]
      } catch (e) {
        console.error('Failed to process WhatsApp media', e)
      }
    }

    if (profile.plan === 'free') {
      // Free limits logic placeholder
    }

    // 3. Retrieve ZIMSEC Knowledge Context (RAG)
    let ragContext = ''
    try {
      const semanticChunks = await KnowledgeEngine.search(text, { 
        limit: 3, 
        threshold: 0.25 
      })
      if (semanticChunks && semanticChunks.length > 0) {
        ragContext = "\n\n--- ZIMSEC KNOWLEDGE BASE CONTEXT ---\n" + 
          semanticChunks.map(c => `[From ${c.metadata?.title || 'Notes'}]:\n${c.content}`).join('\n\n')
      }
    } catch (vErr) {
      console.error('[WhatsApp RAG Error]', vErr)
    }

    // 4. Generate AI Response using mapped history (Vision supported)
    const response = await client.messages.create({
      model: numMedia > 0 ? 'claude-sonnet-4-5' : 'claude-3-5-sonnet-20240620',
      max_tokens: 500,
      system: WHATSAPP_PROMPT + ragContext,
      messages: mappedMessages,
    })

    const aiMsg = response.content[0].type === 'text' ? response.content[0].text : "I'm sorry, I couldn't process that. Please try again."

    // 5. Send back via WhatsApp (Twilio/Africa's Talking)
    await sendSMS(from, aiMsg)

    // 6. Log the assistant response to the shared web thread
    await supabase.from('ai_teacher_messages').insert({
      conversation_id: convId,
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
