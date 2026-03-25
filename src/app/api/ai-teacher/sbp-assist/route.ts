import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const client = new Anthropic()

const STAGE_GUIDANCE: Record<string, string> = {
  proposal: `The student is writing their PROJECT PROPOSAL.
Guide them to:
- Clearly identify a real problem in their local community that connects to their subject
- Explain WHY this problem matters to their community and Zimbabwean heritage
- State what they intend to investigate or create
- Write a clear, specific project title
- Draft initial aims/objectives

Ask probing questions like: "What specific problem in your local area inspired this?", "How does this connect to Zimbabwe's heritage or resources?", "Who will benefit from your project?"`,

  research: `The student is in the RESEARCH stage.
Guide them to:
- Gather information from multiple sources: textbooks, community elders, local experts, field observations
- Document their sources (books, interviews, observations)
- Identify what the existing knowledge/practice says about their topic
- Note any gaps or problems they observe in their community
- Connect their research to the Zimbabwean context (local names for plants, local farming methods, etc.)

Ask: "What sources have you consulted?", "What do local community members or elders say about this?", "How does the theory connect to what you observe locally?"`,

  planning: `The student is in the PLANNING stage.
Guide them to:
- Design a clear methodology (step-by-step plan for how they will carry out their project)
- List all materials needed — prioritise locally available resources
- Create a realistic timeline with milestones
- Identify variables (for science/geography projects)
- Plan how they will collect and record data
- Anticipate challenges and plan solutions

Ask: "What steps will you take in order?", "What local materials could you use instead of expensive ones?", "How will you record your observations?", "What could go wrong and how will you handle it?"`,

  implementation: `The student is in the IMPLEMENTATION stage — they are carrying out their project.
Guide them to:
- Record observations systematically (measurements, quantities, dates, times)
- Document every significant step with details
- Note unexpected results or deviations from their plan
- Describe what they are seeing, hearing, measuring with precision
- Include quantitative data where possible

Ask: "What exactly did you observe/measure?", "Did anything happen differently from your plan?", "Can you record specific numbers/quantities?", "What evidence are you collecting?"`,

  evaluation: `The student is writing their EVALUATION/CONCLUSION.
Guide them to:
- Analyse their results: What patterns do they see? Do results support their hypothesis?
- Connect findings back to their research
- Reflect on what they learned
- Identify limitations of their project
- Suggest improvements for the future
- Explain the heritage/community value of their findings
- Write a clear, evidence-based conclusion

Ask: "What do your results tell you?", "Did your results match your hypothesis — why or why not?", "What would you do differently?", "What is the real-world value of your findings for your community?"`,
}

// POST — MaFundi gives Socratic feedback on a student's SBP stage entry
// mode: 'feedback' (default) | 'structure' (give project outline) | 'example' (show what good looks like)
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { submission_id, stage, entry_content, question, entry_id, mode = 'feedback' } = body

    if (!submission_id || !stage) {
      return NextResponse.json({ error: 'submission_id and stage required' }, { status: 400 })
    }
    if (mode === 'feedback' && !entry_content) {
      return NextResponse.json({ error: 'entry_content required for feedback mode' }, { status: 400 })
    }

    // Fetch submission + assignment context
    // Try with new columns first (requires migration 014); fall back to base columns if they don't exist yet
    type SubData = {
      id: string
      project_title: string | null
      current_stage: string
      self_initiated?: boolean
      subject_name?: string | null
      heritage_theme?: string | null
      assignment: {
        title: string
        description: string | null
        guidelines: string | null
        heritage_theme: string | null
        max_marks: number
        subject: { name: string; code: string } | null
      } | null
    }

    let sub: SubData | null = null
    const { data: subFull, error: subErr } = await supabase
      .from('sbp_submissions')
      .select(`
        id, project_title, current_stage, self_initiated, subject_name, heritage_theme,
        assignment:sbp_assignments(title, description, guidelines, heritage_theme, max_marks,
          subject:subjects(name, code))
      `)
      .eq('id', submission_id)
      .single() as { data: SubData | null; error: { message?: string } | null }

    if (subErr || !subFull) {
      // Fallback: query without new columns (migration not yet run)
      const { data: subBase } = await supabase
        .from('sbp_submissions')
        .select(`
          id, project_title, current_stage,
          assignment:sbp_assignments(title, description, guidelines, heritage_theme, max_marks,
            subject:subjects(name, code))
        `)
        .eq('id', submission_id)
        .single() as { data: SubData | null; error: unknown }
      sub = subBase
    } else {
      sub = subFull
    }

    if (!sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })

    // Fetch previous entries for context
    const { data: prevEntries } = await supabase
      .from('sbp_stage_entries')
      .select('stage, content, created_at')
      .eq('submission_id', submission_id)
      .order('created_at', { ascending: true })
      .limit(10) as { data: { stage: string; content: string; created_at: string }[] | null; error: unknown }

    // Resolve context — works for both assigned and self-initiated projects
    const asgn = sub.assignment
    const subject = asgn?.subject?.name ?? sub.subject_name ?? 'their subject'
    const heritageTheme = asgn?.heritage_theme ?? sub.heritage_theme ?? 'Zimbabwe heritage and community'
    const projectTitle = sub.project_title ?? asgn?.title ?? 'School-Based Project'
    const guidelines = asgn?.guidelines ?? null

    // Build context summary of previous work
    const prevWork = (prevEntries ?? [])
      .map(e => `[${e.stage.toUpperCase()}]: ${e.content.substring(0, 300)}`)
      .join('\n\n')

    const stageGuidance = STAGE_GUIDANCE[stage] ?? ''

    // ── Mode: STRUCTURE — give topic-specific project outline ─────────────────
    if (mode === 'structure') {
      const structurePrompt = `You are MaFundi, AI Teacher for ZimLearn — Zimbabwe's HBC e-learning platform.

A student is working on this ZIMSEC School-Based Project:
- Title: "${projectTitle}"
- Subject: ${subject}
- Heritage Theme: ${heritageTheme}
- Current Stage: ${stage.toUpperCase()}
${sub.self_initiated ? '- This is a SELF-INITIATED project (no teacher assignment)' : ''}

Provide a TOPIC-SPECIFIC project structure guide. This must be tailored to their EXACT title and subject — not generic SBP advice.

Respond in this format:
## 📋 Suggested Structure for "${projectTitle}"

### What Makes This Topic Unique
[1-2 sentences explaining what's special about this type of project]

### Suggested Outline (all 5 active stages)
**Proposal:** [specific advice for THIS topic's proposal — what local problem to identify, what aims]
**Research:** [specific sources and traditional knowledge angle for THIS topic]
**Planning:** [specific methodology, local materials, measurements for THIS topic]
**Implementation:** [what to record/measure/observe for THIS specific type of project]
**Evaluation:** [what kind of conclusion and community recommendation to aim for]

### 🇿🇼 Zimbabwe Heritage Angles for This Topic
[3 specific Zimbabwean connections — name specific communities, practices, places, institutions]

### 💡 What Separates Good from Great for This Topic
[2-3 specific things that will make this project stand out to a ZIMSEC marker]

### ⚠️ Common Pitfalls for This Topic
[2-3 mistakes students make on this specific type of project]

Keep the whole response under 400 words. Be specific to their EXACT project, not generic.`

      const response = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 700,
        system: structurePrompt,
        messages: [{ role: 'user', content: `Give me a structure guide for my project: "${projectTitle}"` }],
      })
      const feedback = response.content[0].type === 'text' ? response.content[0].text : ''
      return NextResponse.json({ feedback, mode: 'structure' })
    }

    // ── Mode: EXAMPLE — show what good looks like for this stage/topic ────────
    if (mode === 'example') {
      const examplePrompt = `You are MaFundi, AI Teacher for ZimLearn — Zimbabwe's HBC e-learning platform.

A student needs to see what GOOD WORK looks like for their SBP stage:
- Project Title: "${projectTitle}"
- Subject: ${subject}
- Stage: ${stage.toUpperCase()}
- Heritage Theme: ${heritageTheme}

Write a SHORT EXAMPLE of what strong ${stage} stage content looks like for a project on this specific topic.
IMPORTANT:
- Label it clearly as an EXAMPLE
- Make it specific to their exact topic and Zimbabwe context
- Keep it to 150-200 words
- After the example, in 2-3 bullet points, explain WHY this example is strong

Format:
## 📝 Example ${stage.charAt(0).toUpperCase() + stage.slice(1)} Entry for a Project Like Yours

> [Example content here — 150-200 words, written as if by a Zimbabwe student on this exact topic]

### Why This Works:
- [strength 1]
- [strength 2]
- [strength 3]

### Now Apply It to Your Work:
[1-2 sentences telling them how to adapt this example to their own observations and community context]

⚠️ *This is an example — your project must be based on YOUR own observations, community, and experiences.*`

      const response = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 600,
        system: examplePrompt,
        messages: [{ role: 'user', content: `Show me an example ${stage} entry for a project on "${projectTitle}"` }],
      })
      const feedback = response.content[0].type === 'text' ? response.content[0].text : ''
      return NextResponse.json({ feedback, mode: 'example' })
    }

    // ── Mode: FEEDBACK (default) — Socratic review of student's entry ─────────
    const systemPrompt = `You are MaFundi, the official AI Teacher for ZimLearn — Zimbabwe's heritage-based e-learning platform. You are helping a student with their ZIMSEC School-Based Project (SBP), which is a formal continuous assessment component of the Zimbabwe Heritage-Based Curriculum 2024-2030.

## PROJECT CONTEXT
- Subject: ${subject}
- Project Title: "${projectTitle}"
- Heritage Theme: ${heritageTheme}
${sub.self_initiated ? '- This is a SELF-INITIATED project (student chose their own topic)' : `- Assignment: ${asgn?.title ?? 'School-Based Project'}`}
${guidelines ? `- Teacher Guidelines: ${guidelines}` : ''}
- Current Stage: ${stage.toUpperCase()}

## PREVIOUS WORK
${prevWork || 'This is the student\'s first entry.'}

## YOUR ROLE AS MAFUNDI FOR SBPs
1. Use the SOCRATIC METHOD — ask questions that deepen thinking rather than giving answers
2. NEVER write the project for the student — guide them to think and discover themselves
3. Give SPECIFIC, constructive feedback TIED TO THEIR EXACT TOPIC ("${projectTitle}") — not generic SBP advice
4. Reference ZIMBABWEAN HERITAGE contexts relevant to their specific topic
5. Acknowledge what they have done well before suggesting improvements
6. Keep feedback encouraging, warm, and professional
7. Point out if required elements are missing from their current entry
8. Suggest what to include in their NEXT entry or how to improve this one
9. If the student hasn't mentioned LOCAL COMMUNITY CONTEXT yet, prompt them to add it

## STAGE-SPECIFIC GUIDANCE
${stageGuidance}

## RESPONSE FORMAT
Structure your response as:
**✅ What You Did Well:**
[acknowledge strengths — be specific about WHAT they wrote, not generic praise]

**💭 Questions to Deepen Your Thinking:**
[2-3 Socratic questions tied to THEIR SPECIFIC TOPIC AND COMMUNITY — not generic questions]

**📝 Suggestions for This Stage:**
[2-3 specific, actionable improvements for THIS topic at THIS stage]

**🇿🇼 Heritage Connection for "${projectTitle}":**
[specific suggestion for how THIS exact project connects to Zimbabwean heritage, local resources, or community — name a specific community, practice, or institution if possible]

Keep your total response under 320 words. Be warm, encouraging, and TOPIC-SPECIFIC.`

    const userMessage = question
      ? `My project entry for the ${stage} stage:\n\n${entry_content}\n\nMy question: ${question}`
      : `Please review my ${stage} stage entry:\n\n${entry_content}`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 650,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const feedback = response.content[0].type === 'text' ? response.content[0].text : ''

    // Save feedback to the entry if entry_id provided
    if (entry_id) {
      await supabase
        .from('sbp_stage_entries')
        .update({ ai_feedback: feedback })
        .eq('id', entry_id)
    }

    return NextResponse.json({ feedback, mode: 'feedback' })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
