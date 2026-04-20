export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const REVISION_PROMPTS: Record<string, (subjectName: string, topicsStr: string, level: string, grade: string) => string> = {
  summary: (subjectName, topicsStr, level, grade) =>
    `Create a concise, exam-focused revision sheet for a ZIMSEC ${level} (${grade}) student on:
Subject: ${subjectName}
Topics: ${topicsStr}

Format as:
# Quick Revision: ${topicsStr}

## Key Points to Remember
(Bullet points — only the most examinable facts, definitions, and principles)

## Essential Formulas / Key Equations
(If applicable — with units)

## Important Processes / Sequences
(Any step-by-step processes the examiner loves to test)

## Must-Know Diagrams / Tables
(Describe key diagrams or draw ASCII tables for comparisons)

## Last-Minute Reminders
(5 things to double-check in the exam hall)

Keep it concise — this is a revision sheet, not full notes.`,

  common_questions: (subjectName, topicsStr, level, grade) =>
    `You are a ZIMSEC examiner with 20 years of experience. Identify the most commonly examined questions for:
Subject: ${subjectName}
Topics: ${topicsStr}
Level: ZIMSEC ${level} (${grade})

Format as:
# Most Common ZIMSEC Questions: ${topicsStr}

## Frequently Examined Question Patterns
(List 8–12 question patterns with their typical mark allocations and which paper they appear in)

## High-Probability Questions for Next Exam
(5 specific questions likely to appear, with mark allocations, written in authentic ZIMSEC style)

## Model Answers
(Full mark-earning answers for 3 of the high-probability questions above)

## Examiner's Favourite Contexts
(The real-world contexts ZIMSEC uses repeatedly for these topics — e.g. Kariba Dam, tobacco industry, etc.)

## Topics That Rotate Every 2–3 Years
(Identify cyclical patterns in past papers for these topics)`,

  marking_tips: (subjectName, topicsStr, level, grade) =>
    `You are a ZIMSEC chief examiner. Give detailed marking guidance for:
Subject: ${subjectName}
Topics: ${topicsStr}
Level: ZIMSEC ${level} (${grade})

Format as:
# Marking Tips: ${topicsStr}

## How Marks Are Awarded
(Explain M marks, A marks, B marks, ecf for this topic specifically)

## Command Word Guide for This Topic
| Command Word | What Examiner Expects | Common Mistakes |
|---|---|---|
(Fill in for each command word used in this topic)

## What Earns Full Marks vs Half Marks
(Specific examples showing the difference between a 4/4 answer and a 2/4 answer)

## Keywords Examiners Look For
(The exact vocabulary needed to trigger marks — especially for definitions and explanations)

## Common Ways Students Lose Marks
(List 8–10 specific mark-losing errors with the correction)

## How to Answer Each Question Type
(Step-by-step approach for calculation, describe, explain, evaluate, compare questions in this topic)`,

  key_concepts: (subjectName, topicsStr, level, grade) =>
    `Create a comprehensive key concepts guide for:
Subject: ${subjectName}
Topics: ${topicsStr}
Level: ZIMSEC ${level} (${grade})

Format as:
# Key Concepts: ${topicsStr}

## Definitions (ZIMSEC Standard)
(All key terms with exam-standard definitions — exactly as ZIMSEC expects them)

## Core Concepts Explained Simply
(Each major concept explained clearly with a local Zimbabwean analogy or example)

## Visual Summaries
(ASCII diagrams, tables, or mind-map style layouts for complex relationships)

## Mnemonics & Memory Aids
(Create memorable mnemonics for lists, processes, or classification systems)

## Connections to Other Topics
(How this topic links to other parts of the syllabus — examiners love cross-topic questions)

## Syllabus Checklist
☐ (List each specific syllabus point students must be able to do — tick-off format)`,
}

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
    const { subject_id, topics, revision_type = 'summary' } = body
    if (!subject_id || !topics?.length) {
      return NextResponse.json({ error: 'subject_id and topics are required' }, { status: 400 })
    }

    const { data: subject } = await supabase
      .from('subjects')
      .select('name, code')
      .eq('id', subject_id)
      .single() as { data: { name: string; code: string } | null; error: unknown }

    if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

    const levelLabel = studentProfile.zimsec_level === 'primary' ? 'Primary'
      : studentProfile.zimsec_level === 'olevel' ? 'O-Level' : 'A-Level'
    const topicsStr = Array.isArray(topics) ? topics.join(', ') : topics

    const promptFn = REVISION_PROMPTS[revision_type] ?? REVISION_PROMPTS.summary
    const prompt = promptFn(subject.name, topicsStr, levelLabel, studentProfile.grade)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = (message.content[0] as { type: string; text: string }).text

    const typeLabels: Record<string, string> = {
      summary: 'Revision Summary',
      common_questions: 'Common Questions',
      marking_tips: 'Marking Tips',
      key_concepts: 'Key Concepts',
    }
    const noteTitle = `${typeLabels[revision_type] ?? 'Revision'}: ${topicsStr} (${subject.name})`

    // Save as student note
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

    if (noteErr || !note) return NextResponse.json({ error: 'Failed to save revision note' }, { status: 500 })

    // Log to ai_content_log
    await supabase.from('ai_content_log').insert({
      student_id: studentProfile.id,
      subject_id,
      content_type: 'revision',
      content_id: note.id,
      topic: topicsStr,
      trigger: 'manual',
    })

    return NextResponse.json({ note_id: note.id, title: noteTitle, content })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
