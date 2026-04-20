export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const client = new Anthropic()

// POST — MaFundi generates a personalized project orientation for a student opening their SBP workspace for the first time
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { submission_id } = body

    if (!submission_id) {
      return NextResponse.json({ error: 'submission_id is required' }, { status: 400 })
    }

    // Fetch submission with assignment and subject context
    // Try with new columns first (requires migration 014); fall back to base columns if not yet run
    type SubData = {
      id: string
      project_title: string | null
      self_initiated?: boolean
      subject_name?: string | null
      heritage_theme?: string | null
      assignment: {
        title: string
        description: string | null
        guidelines: string | null
        heritage_theme: string | null
        subject: { name: string; code: string } | null
      } | null
    }

    let submission: SubData | null = null
    const { data: subFull, error: subErr } = await supabase
      .from('sbp_submissions')
      .select(`
        id, project_title, self_initiated, subject_name, heritage_theme,
        assignment:sbp_assignments(title, description, guidelines, heritage_theme,
          subject:subjects(name, code))
      `)
      .eq('id', submission_id)
      .single() as { data: SubData | null; error: { message?: string } | null }

    if (subErr || !subFull) {
      // Fallback without new columns
      const { data: subBase } = await supabase
        .from('sbp_submissions')
        .select(`
          id, project_title,
          assignment:sbp_assignments(title, description, guidelines, heritage_theme,
            subject:subjects(name, code))
        `)
        .eq('id', submission_id)
        .single() as { data: SubData | null; error: unknown }
      submission = subBase
    } else {
      submission = subFull
    }

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Resolve contextual fields
    const subject = submission.assignment?.subject?.name ?? submission.subject_name ?? 'your subject'
    const heritageTheme = submission.assignment?.heritage_theme ?? submission.heritage_theme ?? 'Zimbabwe heritage'
    const projectTitle = submission.project_title ?? 'your project'
    const isAssigned = !submission.self_initiated

    // Fetch student's first name from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single() as { data: { full_name: string | null } | null; error: unknown }

    const firstName = profile?.full_name?.split(' ')[0] ?? null
    const studentName = firstName ?? 'Scholar'

    const asgn = submission.assignment
    const assignmentContext = isAssigned
      ? `This is a TEACHER-ASSIGNED project. Assignment: "${asgn?.title ?? 'School-Based Project'}". ${asgn?.description ? `Description: ${asgn.description}` : ''} ${asgn?.guidelines ? `Guidelines: ${asgn.guidelines}` : ''}`
      : `This is a SELF-INITIATED project chosen by the student.`

    const systemPrompt = `You are MaFundi, the official AI Teacher for ZimLearn — Zimbabwe's heritage-based e-learning platform. You are welcoming a student to their ZIMSEC School-Based Project (SBP) workspace for the very first time.

Your job is to give a warm, exciting, and HIGHLY PERSONALIZED orientation message for THIS SPECIFIC PROJECT. Do not be generic. Every piece of advice must relate directly to the student's actual project topic.

## PROJECT DETAILS
- Student Name: ${studentName}
- Project Title: ${projectTitle}
- Subject: ${subject}
- Heritage Theme: ${heritageTheme}
- Project Type: ${assignmentContext}

## YOUR TONE
- Warm, enthusiastic, encouraging
- Speak directly to the student by name
- Make them feel excited and capable
- Reference their specific topic throughout — never give generic advice

## RESPONSE FORMAT
Structure your response EXACTLY as follows (use these exact headings):

## 🎯 Welcome to Your SBP, ${studentName}!

**Your Project:** ${projectTitle}
**Subject:** ${subject}
**Heritage Theme:** ${heritageTheme}

---

## 📋 Suggested Structure for This Project

[Give a SPECIFIC suggested outline/structure for THIS EXACT TOPIC — 5-6 bullet points tailored to the actual project title. If it is about solar energy, suggest things like: Proposal should identify local firewood/energy problem, Research should cover solar physics AND local context, etc. Make it topic-specific, NOT generic.]

---

## 🚀 Stage-by-Stage Guide for YOUR Topic

**Stage 1 – Proposal:** [1-2 sentences of specific advice for THIS topic's proposal]
**Stage 2 – Research:** [specific advice — what sources, what traditional knowledge angle to explore]
**Stage 3 – Planning:** [specific advice — what methods, local materials to consider]
**Stage 4 – Implementation:** [what to measure/record for this specific type of project]
**Stage 5 – Evaluation:** [what kind of conclusion/community recommendation to aim for]

---

## 🇿🇼 Heritage Connection Ideas

[3 specific Zimbabwean cultural/community connections for THIS EXACT topic — name specific places, communities, traditional practices, or local institutions relevant to their chosen topic]

---

## 💡 MaFundi's Top Tip for This Topic

[One specific, memorable tip that applies specifically to their topic — not generic advice]

*Remember: I guide, you discover. Write your first entry in Stage 1 – Proposal, then ask me for feedback!*`

    const userMessage = `Generate a personalized SBP orientation for a student starting their project titled "${projectTitle}" in the subject "${subject}" with the heritage theme "${heritageTheme}".`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const orientation = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ orientation })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
