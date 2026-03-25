import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id, zimsec_level, grade')
      .eq('user_id', user.id)
      .single() as { data: { id: string; zimsec_level: string; grade: string } | null; error: unknown }

    if (!studentProfile) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })

    const body = await req.json()
    const { subject_id, topic, subtopics, level } = body
    if (!subject_id || !topic) return NextResponse.json({ error: 'subject_id and topic are required' }, { status: 400 })

    // Get subject details
    const { data: subject } = await supabase
      .from('subjects')
      .select('name, code, zimsec_level')
      .eq('id', subject_id)
      .single() as { data: { name: string; code: string; zimsec_level: string } | null; error: unknown }

    if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

    const zimsecLevel = level ?? studentProfile.zimsec_level
    const grade = studentProfile.grade
    const levelLabel = zimsecLevel === 'primary' ? 'Primary' : zimsecLevel === 'olevel' ? 'O-Level' : 'A-Level'

    const prompt = `You are MaFundi, an expert ZIMSEC teacher. Draft comprehensive, exam-ready notes for a ${levelLabel} (${grade}) student on the following:

Subject: ${subject.name}
Topic: ${topic}
${subtopics ? `Subtopics to cover: ${Array.isArray(subtopics) ? subtopics.join(', ') : subtopics}` : ''}

Write the notes in this exact structure using Markdown:

# ${topic}
**Subject:** ${subject.name} | **Level:** ${levelLabel} | **Grade:** ${grade}

## Learning Objectives
- (3–5 clear, measurable objectives starting with action verbs: Define, Explain, Calculate, Analyse, Evaluate)

## Key Definitions
| Term | Definition |
|------|-----------|
(All key terms with precise ZIMSEC-standard definitions)

## Core Content
(Detailed, well-structured notes covering all examinable content. Use subheadings, bullet points, numbered steps for processes. Include Zimbabwean examples — e.g. Kariba Dam, tobacco farming, Great Zimbabwe, local companies, ZWL currency where relevant.)

## Worked Examples
(2–4 fully worked examples for calculation topics, or model answers for descriptive topics. Show full working.)

## Common ZIMSEC Exam Questions on This Topic
(List 5–8 actual-style ZIMSEC questions with mark allocations in brackets. Include both Paper 1 MCQ style and Paper 2 structured style.)

## Model Answers to Common Questions
(Full model answers for 3 of the above questions, written to earn maximum marks.)

## Common Mistakes Students Make
- (List 4–6 specific mistakes students lose marks for, with the correction)

## Exam Tips
- (4–6 targeted tips for maximising marks on this topic in ZIMSEC exams)

## Quick Revision Summary
(A concise 5–8 bullet point summary of the most important points to remember)

Write clearly, accurately, and at the right depth for ${levelLabel} ${grade}. Use $inline math$ and $$block math$$ for any equations.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = (message.content[0] as { type: string; text: string }).text

    const noteTitle = `MaFundi Notes: ${topic} (${subject.name})`

    // Save directly to student_notes (courses table is teacher-only via RLS)
    const { data: note, error: noteErr } = await supabase
      .from('student_notes')
      .insert({
        student_id: studentProfile.id,
        subject_id,
        title: noteTitle,
        content,
      })
      .select('id')
      .single()

    if (noteErr || !note) return NextResponse.json({ error: 'Failed to save notes' }, { status: 500 })

    // Log to ai_content_log
    await supabase.from('ai_content_log').insert({
      student_id: studentProfile.id,
      subject_id,
      content_type: 'notes',
      content_id: note.id,
      topic,
      trigger: 'manual',
    })

    return NextResponse.json({ note_id: note.id, title: noteTitle, content })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
