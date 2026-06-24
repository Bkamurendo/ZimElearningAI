export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const SYSTEM_PROMPT = `You are a ZIMSEC curriculum expert and master teacher for Zimbabwe.
Generate detailed, pedagogically sound lesson content aligned with the ZIMSEC syllabus.
Always use local Zimbabwean examples, contexts, and references where relevant.
Format all lesson content as clean markdown with: headings, bullet lists, numbered steps,
code blocks for formulas/equations, and practical examples.
Every lesson should have: Learning Objectives, Key Concepts, Worked Examples, and a Summary.`

function buildGeneratePrompt(
  subject: string,
  topic: string,
  level: string,
  numLessons: number,
  teacherNote?: string
): string {
  return `Generate ${numLessons} ZIMSEC-aligned lesson(s) for:
- Subject: ${subject}
- Topic: ${topic}
- Level: ${level}
${teacherNote ? `- Teacher's notes: ${teacherNote}` : ''}

Return a JSON object with this exact structure:
{
  "course_title": "A clear course title for this topic",
  "course_description": "A 1-2 sentence description of what students will learn",
  "lessons": [
    {
      "title": "Lesson title",
      "content": "Full lesson content in markdown format. Must include:\\n## Learning Objectives\\n## Key Concepts\\n## Worked Examples\\n## Summary"
    }
  ]
}

Requirements:
- Each lesson should be comprehensive (500-1000 words of markdown content)
- Use Zimbabwean examples and contexts (ZWL currency, local place names, local crops, local businesses)
- Align strictly with ZIMSEC ${level} syllabus expectations
- Worked examples should be fully solved step-by-step
- Content should be clear for students at ${level} level
- Return ONLY valid JSON, no other text`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const {
      subject_id,
      topic,
      num_lessons = 3,
      course_id,       // optional: append to existing course
      teacher_note,    // optional: extra context for generation
      save = false,    // if true, save to DB immediately; if false, just return preview
    } = body

    if (!subject_id || !topic) {
      return NextResponse.json({ error: 'subject_id and topic are required' }, { status: 400 })
    }

    // Fetch subject details
    const { data: subject } = await supabase
      .from('subjects')
      .select('id, name, code, zimsec_level')
      .eq('id', subject_id)
      .single()

    if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

    const levelLabel = subject.zimsec_level === 'olevel' ? 'O-Level'
      : subject.zimsec_level === 'alevel' ? 'A-Level' : 'Primary'

    // Generate content with Claude
    const prompt = buildGeneratePrompt(subject.name, topic, levelLabel, Math.min(num_lessons, 5), teacher_note)

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : ''

    // Parse JSON from response
    let generated: { course_title: string; course_description: string; lessons: { title: string; content: string }[] }
    try {
      // Strip any markdown code fences if present
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
      generated = JSON.parse(cleaned)
    } catch {
      console.error('[content/generate] Failed to parse AI JSON:', rawText.slice(0, 500))
      return NextResponse.json({ error: 'AI returned invalid JSON. Please try again.' }, { status: 500 })
    }

    if (!save) {
      // Preview mode — return generated content without saving
      return NextResponse.json({
        preview: true,
        subject: { id: subject.id, name: subject.name, level: levelLabel },
        course_title: generated.course_title,
        course_description: generated.course_description,
        lessons: generated.lessons,
        tokens_used: aiResponse.usage.input_tokens + aiResponse.usage.output_tokens,
      })
    }

    // Save mode — persist to DB
    // Fetch the admin's teacher profile (admins can act as teachers too)
    const { data: teacherProfile } = await supabase
      .from('teacher_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    let targetCourseId = course_id

    if (!targetCourseId) {
      // Create a new course
      const { data: newCourse, error: courseErr } = await supabase
        .from('courses')
        .insert({
          subject_id: subject.id,
          teacher_id: teacherProfile?.id ?? null,
          title: generated.course_title,
          description: generated.course_description,
          published: false,
        })
        .select('id')
        .single()

      if (courseErr || !newCourse) {
        return NextResponse.json({ error: 'Failed to create course', detail: courseErr?.message }, { status: 500 })
      }
      targetCourseId = newCourse.id
    }

    // Get current max order_index for this course
    const { data: existingLessons } = await supabase
      .from('lessons')
      .select('order_index')
      .eq('course_id', targetCourseId)
      .order('order_index', { ascending: false })
      .limit(1)

    const startIndex = (existingLessons?.[0]?.order_index ?? -1) + 1

    // Insert all lessons
    const lessonRows = generated.lessons.map((l, i) => ({
      course_id: targetCourseId,
      title: l.title,
      content_type: 'text',
      content: l.content,
      order_index: startIndex + i,
    }))

    const { data: savedLessons, error: lessonsErr } = await supabase
      .from('lessons')
      .insert(lessonRows)
      .select('id, title, order_index')

    if (lessonsErr) {
      return NextResponse.json({ error: 'Failed to save lessons', detail: lessonsErr.message }, { status: 500 })
    }

    // Ingest into knowledge base (non-fatal)
    try {
      const { KnowledgeEngine } = await import('@/lib/ai/knowledge-engine')
      for (const lesson of generated.lessons) {
        await KnowledgeEngine.ingestResource(
          targetCourseId,
          'lesson',
          `${subject.name} — ${lesson.title}`,
          lesson.content,
          { zimsec_level: subject.zimsec_level, subject_id: subject.id }
        )
      }
    } catch (kErr) {
      console.error('[content/generate] Knowledge ingest failed (non-fatal):', kErr)
    }

    return NextResponse.json({
      saved: true,
      course_id: targetCourseId,
      lessons_created: savedLessons?.length ?? 0,
      lessons: savedLessons,
      tokens_used: aiResponse.usage.input_tokens + aiResponse.usage.output_tokens,
    })

  } catch (err) {
    console.error('[content/generate] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
