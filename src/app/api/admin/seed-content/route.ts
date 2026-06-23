export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { allCourses } from '@/lib/seed-content'

export async function POST() {
  // Auth check — must be admin
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  // Use service role to bypass RLS
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Get first teacher
  const { data: teachers } = await serviceClient
    .from('teacher_profiles')
    .select('id')
    .limit(1)

  if (!teachers || teachers.length === 0) {
    return NextResponse.json({ error: 'No teacher profiles found. Create a teacher account first.' }, { status: 400 })
  }

  const teacherId = teachers[0].id

  // Fetch subjects
  const { data: subjects } = await serviceClient.from('subjects').select('id, code')
  const subjectMap: Record<string, string> = {}
  for (const s of (subjects ?? [])) subjectMap[s.code] = s.id

  const results = { created: 0, skipped: 0, lessons: 0, errors: [] as string[] }

  for (const course of allCourses) {
    const subjectId = subjectMap[course.subjectCode]
    if (!subjectId) {
      results.errors.push(`Subject not found: ${course.subjectCode}`)
      continue
    }

    // Skip duplicates
    const { data: existing } = await serviceClient
      .from('courses')
      .select('id')
      .eq('title', course.title)
      .eq('teacher_id', teacherId)
      .limit(1)

    if (existing && existing.length > 0) {
      results.skipped++
      continue
    }

    const { data: newCourse, error: courseErr } = await serviceClient
      .from('courses')
      .insert({
        subject_id: subjectId,
        teacher_id: teacherId,
        title: course.title,
        description: course.description,
        published: true,
      })
      .select('id')
      .single()

    if (courseErr || !newCourse) {
      results.errors.push(`Course "${course.title}": ${courseErr?.message}`)
      continue
    }

    for (let i = 0; i < course.lessons.length; i++) {
      const lesson = course.lessons[i]
      const { error: lessonErr } = await serviceClient.from('lessons').insert({
        course_id: newCourse.id,
        title: lesson.title,
        content_type: lesson.type,
        content: lesson.content,
        order_index: i + 1,
      })
      if (lessonErr) results.errors.push(`Lesson "${lesson.title}": ${lessonErr.message}`)
      else results.lessons++
    }

    results.created++

    // Assign teacher to subject
    await serviceClient.from('teacher_subjects').upsert(
      { teacher_id: teacherId, subject_id: subjectId },
      { onConflict: 'teacher_id,subject_id' }
    )
  }

  return NextResponse.json({
    success: true,
    courses_created: results.created,
    courses_skipped: results.skipped,
    lessons_created: results.lessons,
    errors: results.errors,
  })
}
