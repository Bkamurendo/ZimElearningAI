export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 120

const client = new Anthropic()

// POST — PREMIUM ONLY: MaFundi generates a complete annotated example SBP project as inspiration
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check premium plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single() as { data: { plan: string | null } | null; error: unknown }

    if (profile?.plan !== 'pro') {
      return NextResponse.json({ error: 'Premium required', upgrade: true }, { status: 403 })
    }

    const body = await req.json()
    const { subject, grade, topic, heritage_theme } = body as {
      subject?: string
      grade?: string
      topic?: string
      heritage_theme?: string
    }

    // Validate required fields
    if (!subject || !grade || !topic) {
      return NextResponse.json(
        { error: 'subject, grade, and topic are required' },
        { status: 400 }
      )
    }

    const resolvedHeritageTheme = heritage_theme ?? 'Zimbabwe heritage and local community'

    const systemPrompt = `You are MaFundi, the official AI Teacher for ZimLearn — Zimbabwe's heritage-based e-learning platform. You are generating a COMPLETE EXAMPLE ZIMSEC School-Based Project (SBP) to serve as inspiration and a learning template for a Zimbabwe student.

## CRITICAL RULES
- This example is NOT for copying. It is an annotated model showing what excellent work looks like.
- Write the project content AS IF written by a Zimbabwe student at the specified grade level.
- Every section must be SPECIFIC to the topic — never generic.
- Include [EXAMPLE — adapt this to your own experience and context] labels throughout the project content sections.
- The MaFundi annotation notes (🔍) are written in your voice as a teacher, explaining what makes each section strong.
- Use authentic Zimbabwean context: local place names, community practices, traditional knowledge, local institutions.
- Language should be appropriate for the specified grade level.

## FORMAT
Use the EXACT structure provided. Do not skip any section. Do not add extra sections not in the format.`

    const userMessage = `Generate a complete example ZIMSEC School-Based Project for:
Subject: ${subject}
Grade/Level: ${grade}
Topic/Title: ${topic}
Heritage Theme: ${resolvedHeritageTheme}

Format EXACTLY as:

# 📚 MaFundi Example Project
## ⚠️ This is a model example — use it as inspiration and guidance, adapt everything to YOUR own community, observations and experiences.

---

## STAGE 1: PROPOSAL
[Full proposal text — 200-300 words, written as if by a Zimbabwe student, specific to the topic, with aims, hypothesis, heritage significance. Include [EXAMPLE — adapt this to your own experience and context] at the start.]

### 🔍 MaFundi Notes on This Proposal:
[50-word annotation explaining what makes this proposal strong]

---

## STAGE 2: RESEARCH
[Research content — 200-250 words, with specific sources, community interviews, traditional knowledge connection. Include [EXAMPLE — adapt this to your own experience and context] at the start.]

### 🔍 MaFundi Notes on This Research:
[50-word annotation]

---

## STAGE 3: PLANNING
[Planning content — materials list, step-by-step methodology, variables. Include [EXAMPLE — adapt this to your own experience and context] at the start.]

### 🔍 MaFundi Notes on This Planning:
[50-word annotation]

---

## STAGE 4: IMPLEMENTATION
[Implementation content — specific data, measurements, observations, unexpected results. Include [EXAMPLE — adapt this to your own experience and context] at the start.]

### 🔍 MaFundi Notes on This Implementation:
[50-word annotation]

---

## STAGE 5: EVALUATION
[Evaluation content — analysis, limitations, heritage reflection, specific community recommendation. Include [EXAMPLE — adapt this to your own experience and context] at the start.]

### 🔍 MaFundi Notes on This Evaluation:
[50-word annotation]

---

## 🎯 Key Success Factors in This Example:
- [4-5 bullet points of what makes this example strong]

## ⚠️ Common Mistakes to Avoid for This Topic:
- [3-4 bullet points]`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const template = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ template, subject, grade, topic })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
