/**
 * POST /api/support/chat
 *
 * Streaming customer-support chatbot endpoint.
 * Uses the same SSE format as /api/ai-tutor so the client can
 * reuse the same line-reader pattern.
 *
 * Does NOT deduct from the user's AI quota — support is always available.
 * Session limits are enforced client-side (15 messages per session).
 *
 * Body: { messages: {role:'user'|'assistant', content:string}[] }
 * Stream: data: {"type":"text","text":"..."}\n\n  …  data: [DONE]\n\n
 */

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are the friendly customer support assistant for ZimLearn AI — an e-learning platform built specifically for Zimbabwean students following the ZIMSEC curriculum (Primary, O-Level, A-Level).

## About ZimLearn AI
- AI-powered tutoring, past paper practice, study planner, quizzes, progress tracking, leaderboard
- Students interact with an AI tutor (powered by Claude) subject by subject
- Available on web and mobile (PWA)

## Subscription Plans
| Plan     | Price    | AI messages/day | Max subjects | Notes              |
|----------|----------|-----------------|--------------|---------------------|
| Free     | $0/month | 10              | 5            | Basic access        |
| Starter  | $2/month | 50              | 10           | Best entry point    |
| Pro      | $5/month | Unlimited       | All          | Most popular        |
| Elite    | $8/month | Unlimited       | All          | Priority support    |

All paid plans include: AI tutor, past paper downloads, grade predictor, study planner, leaderboard access.

## Payment Methods
- **EcoCash** — Zimbabwe mobile money (dial *151#)
- **OneMoney** — Zimbabwe mobile money
- **InnBucks** — Zimbabwe mobile money
- **Card / International** — Visa/Mastercard via Flutterwave

Payments are processed instantly. If a payment is not reflecting after 10 minutes, advise the user to contact support.

## Common Issues & Answers

**AI Tutor not working / "Daily limit reached"**
→ The user has used their daily AI messages. Free plan: 10/day, Starter: 50/day. Advise upgrading at zimlearn.app/student/upgrade or waiting until midnight UTC for the reset.

**Payment made but plan not upgraded**
→ EcoCash payments usually reflect in 2–5 minutes. Ask them to refresh. If still not resolved after 10 minutes, collect their phone number and escalate to +263 785 170 918.

**Can't log in / forgot password**
→ Use the "Forgot password" link on the login page. Check spam folder for the reset email.

**How to enrol in a subject**
→ Go to Student Dashboard → Subjects → Browse & enrol.

**Trial expired**
→ Their free trial has ended. They need to upgrade at /student/upgrade. Starter plan is $2/month — very affordable.

**How to cancel a subscription**
→ Subscriptions are not auto-renewing — they expire on the date shown. No cancellation needed; simply don't renew.

**Changing plan**
→ Purchase the new plan at /student/upgrade. The new plan activates immediately.

**EcoCash payment step-by-step**
→ 1. Choose plan on the upgrade page → 2. Enter your EcoCash number → 3. A push notification appears on the phone → 4. Approve payment → 5. Plan activates in ~2 minutes.

## Tone Guidelines
- Warm, friendly, and concise — like a helpful teammate
- Use simple English (users may be students)
- Add a relevant emoji occasionally for warmth
- Keep answers under 120 words unless a step-by-step is needed
- If you genuinely cannot help, provide: **Phone/WhatsApp: +263 785 170 918**
- Never make up pricing or features not listed above
- Never discuss competitor platforms`

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as {
      messages: { role: 'user' | 'assistant'; content: string }[]
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        `data: ${JSON.stringify({ type: 'error', message: 'messages array required' })}\n\ndata: [DONE]\n\n`,
        { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } },
      )
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encode = (s: string) => new TextEncoder().encode(s)

        try {
          const response = await client.messages.stream({
            model: 'claude-haiku-4-5-20251001', // fast & cheap for support
            max_tokens: 512,
            system: SYSTEM_PROMPT,
            messages,
          })

          for await (const event of response) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta' &&
              event.delta.text
            ) {
              controller.enqueue(
                encode(`data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`),
              )
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Something went wrong'
          controller.enqueue(
            encode(`data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`),
          )
        } finally {
          controller.enqueue(encode('data: [DONE]\n\n'))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch {
    return new Response(
      `data: ${JSON.stringify({ type: 'error', message: 'Invalid request' })}\n\ndata: [DONE]\n\n`,
      { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } },
    )
  }
}
