export const dynamic = 'force-dynamic';
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
    const { subject_id, paper_number = '2', focus_topics } = body
    if (!subject_id) return NextResponse.json({ error: 'subject_id is required' }, { status: 400 })

    const { data: subject } = await supabase
      .from('subjects')
      .select('name, code, zimsec_level')
      .eq('id', subject_id)
      .single() as { data: { name: string; code: string; zimsec_level: string } | null; error: unknown }

    if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

    // Get weak topics for focus
    const { data: weakTopics } = await supabase
      .from('topic_mastery')
      .select('topic')
      .eq('student_id', studentProfile.id)
      .eq('subject_id', subject_id)
      .in('mastery_level', ['not_started', 'learning'])
      .limit(5) as { data: { topic: string }[] | null; error: unknown }

    const levelLabel = studentProfile.zimsec_level === 'primary' ? 'Primary'
      : studentProfile.zimsec_level === 'olevel' ? 'O-Level' : 'A-Level'
    const focusHint = focus_topics
      ? `Focus especially on: ${Array.isArray(focus_topics) ? focus_topics.join(', ') : focus_topics}`
      : weakTopics?.length
        ? `Student's weak areas to focus on: ${weakTopics.map(t => t.topic).join(', ')}`
        : ''

    const paperDescriptions: Record<string, string> = {
      '1': `Paper 1 — Multiple Choice
Create exactly 40 multiple-choice questions (A/B/C/D options). Total: 40 marks. Duration: 1.5 hours.
Each question tests a single concept. Options should be plausible. Only one correct answer.
Return JSON in this EXACT format:
{
  "title": "${subject.name} Paper 1 — Multiple Choice",
  "instructions": "Answer ALL questions. Each question carries 1 mark. Duration: 1 hour 30 minutes.",
  "total_marks": 40,
  "duration_minutes": 90,
  "sections": [{
    "title": "Section A — Multiple Choice",
    "questions": [
      {
        "text": "Question text here",
        "marks": 1,
        "type": "mcq",
        "options": [{"label":"A","text":"Option A text"},{"label":"B","text":"Option B text"},{"label":"C","text":"Option C text"},{"label":"D","text":"Option D text"}],
        "answer": "A"
      }
    ]
  }]
}`,
      '2': `Paper 2 — Structured Questions
Create 6 structured questions (answer ALL). Each has parts (a)(b)(c) with sub-parts (i)(ii)(iii).
Total: 80 marks. Duration: 2.5 hours.
Use authentic ZIMSEC command words. Show mark allocation in brackets e.g. [3].
Include calculation questions with units, data-response questions, and explanation questions.
Return JSON in this EXACT format:
{
  "title": "${subject.name} Paper 2 — Structured Questions",
  "instructions": "Answer ALL questions. Show all working where applicable. Duration: 2 hours 30 minutes.",
  "total_marks": 80,
  "duration_minutes": 150,
  "sections": [{
    "title": "Answer ALL questions",
    "questions": [
      {
        "text": "Full question text with all parts formatted as:\\n(a) Part a question [2]\\n(b) Part b question [4]\\n   (i) sub-part [2]\\n   (ii) sub-part [2]\\n(c) Part c question [6]",
        "marks": 12,
        "type": "structured",
        "answer": "Model answer:\\n(a) ...\\n(b) ...\\n   (i) ...\\n   (ii) ...\\n(c) ..."
      }
    ]
  }]
}`,
      '3': `Paper 3 — Essay Questions
Create 5 essay questions (students answer ANY 3). Each question: 20 marks. Total: 60 marks. Duration: 2.5 hours.
Questions should require extended writing with analysis, evaluation, or discussion.
Include mark scheme with marking points.
Return JSON in this EXACT format:
{
  "title": "${subject.name} Paper 3 — Essay Questions",
  "instructions": "Answer ANY THREE questions. Each question carries 20 marks. Duration: 2 hours 30 minutes.",
  "total_marks": 60,
  "duration_minutes": 150,
  "sections": [{
    "title": "Answer ANY THREE questions",
    "questions": [
      {
        "text": "Essay question text",
        "marks": 20,
        "type": "essay",
        "answer": "Mark scheme: Award marks for the following points:\\n• Point 1 [2]\\n• Point 2 [3]\\n..."
      }
    ]
  }]
}`,
    }

    const prompt = `You are an expert ZIMSEC examiner. Create a realistic, high-quality mock exam paper for:

Subject: ${subject.name} (${subject.code})
Level: ${levelLabel} — ${studentProfile.grade}
${focusHint}

${paperDescriptions[paper_number] ?? paperDescriptions['2']}

IMPORTANT:
- Use authentic ZIMSEC question style, vocabulary and difficulty
- Include Zimbabwean contexts where appropriate (Kariba, Great Zimbabwe, local agriculture, ZWL, etc.)
- Questions must be at the correct cognitive level for ${levelLabel}
- Return ONLY valid JSON, no additional text before or after`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = (message.content[0] as { type: string; text: string }).text
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Failed to parse exam JSON' }, { status: 500 })

    let examData: {
      title: string
      instructions: string
      total_marks: number
      duration_minutes: number
      sections: { title: string; questions: { text: string; marks: number; type: string; answer?: string; options?: { label: string; text: string }[] }[] }[]
    }
    try {
      examData = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: 'Invalid exam JSON from AI' }, { status: 500 })
    }

    // Convert exam JSON to readable markdown (tests table requires teacher_id NOT NULL)
    const lines: string[] = [
      `# ${examData.title}`,
      '',
      `**Instructions:** ${examData.instructions}`,
      `**Total Marks:** ${examData.total_marks} | **Duration:** ${Math.floor(examData.duration_minutes / 60)}h ${examData.duration_minutes % 60}m`,
      '',
      '---',
      '',
    ]
    for (const section of examData.sections) {
      lines.push(`## ${section.title}`, '')
      section.questions.forEach((q, qi) => {
        lines.push(`**Question ${qi + 1}** *(${q.marks} mark${q.marks !== 1 ? 's' : ''})*`)
        lines.push('', q.text, '')
        if (q.options) {
          for (const opt of q.options) {
            lines.push(`${opt.label}. ${opt.text}`)
          }
          lines.push('')
        }
      })
    }
    lines.push('---', '', '## Model Answers', '')
    for (const section of examData.sections) {
      section.questions.forEach((q, qi) => {
        if (q.answer) {
          lines.push(`**Q${qi + 1} Answer:**`, q.answer, '')
        }
      })
    }

    const content = lines.join('\n')

    // Save to student_notes
    const { data: note, error: noteErr } = await supabase
      .from('student_notes')
      .insert({
        student_id: studentProfile.id,
        subject_id,
        title: examData.title,
        content,
      })
      .select('id')
      .single()

    if (noteErr || !note) return NextResponse.json({ error: 'Failed to save mock exam' }, { status: 500 })

    // Log to ai_content_log
    await supabase.from('ai_content_log').insert({
      student_id: studentProfile.id,
      subject_id,
      content_type: 'mock_exam',
      content_id: note.id,
      topic: `Paper ${paper_number}`,
      trigger: 'manual',
    })

    return NextResponse.json({ note_id: note.id, title: examData.title })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
