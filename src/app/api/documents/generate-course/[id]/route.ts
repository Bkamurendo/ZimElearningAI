export const dynamic = 'force-dynamic';
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin or teacher only
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['admin', 'teacher'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch document
  const { data: doc } = await supabase
    .from('uploaded_documents')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  if (!doc.extracted_text) {
    return NextResponse.json({ error: 'Document has not been processed yet. Process it first.' }, { status: 400 })
  }

  const { save = false } = await req.json().catch(() => ({ save: false }))

  try {
    // Generate course structure from document content
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: `You are a ZIMSEC curriculum expert building an online course for ZimLearn.

Based on the following document content, generate a comprehensive online course with lessons.

DOCUMENT TITLE: ${doc.title}
DOCUMENT TYPE: ${doc.document_type}
TOPICS IDENTIFIED: ${doc.topics?.join(', ')}
SUMMARY: ${doc.ai_summary}

DOCUMENT CONTENT:
${doc.extracted_text.slice(0, 8000)} ${doc.extracted_text.length > 8000 ? '...[truncated]' : ''}

Create a course with 5-10 lessons. Each lesson should teach a specific topic from the document.

Respond with JSON only:
{
  "title": "Course title",
  "description": "2-3 sentence course description for students",
  "lessons": [
    {
      "title": "Lesson title",
      "content_type": "text",
      "order_index": 1,
      "content": "Full lesson content in markdown. Include: # Heading, ## Subheadings, **bold key terms**, numbered steps for worked examples, bullet points for lists. Minimum 300 words per lesson. Include a practice question at the end."
    }
  ]
}

Make content ZIMSEC-aligned, exam-focused, and appropriate for Zimbabwean students.
Respond ONLY with valid JSON, no markdown fences.`,
        },
      ],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const courseData = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim()) as {
      title: string
      description: string
      lessons: { title: string; content_type: string; order_index: number; content: string }[]
    }

    // If save=true, actually create the course in the database
    if (save) {
      // Get teacher profile
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!teacherProfile) {
        return NextResponse.json({ error: 'Teacher profile required to save course' }, { status: 400 })
      }

      const { data: newCourse, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: courseData.title,
          description: courseData.description,
          subject_id: doc.subject_id,
          teacher_id: teacherProfile.id,
          published: false,
        })
        .select('id')
        .single()

      if (courseError || !newCourse) {
        return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
      }

      // Insert all lessons
      const lessonsToInsert = courseData.lessons.map((lesson, idx) => ({
        course_id: newCourse.id,
        title: lesson.title,
        content_type: lesson.content_type || 'text',
        content: lesson.content,
        order_index: idx + 1,
      }))

      await supabase.from('lessons').insert(lessonsToInsert)

      return NextResponse.json({
        saved: true,
        courseId: newCourse.id,
        title: courseData.title,
        lessonCount: courseData.lessons.length,
      })
    }

    // Otherwise just return the preview
    return NextResponse.json({
      saved: false,
      course: courseData,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Course generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
