'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markLessonComplete(formData: FormData): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const lessonId = formData.get('lesson_id') as string
  const courseId = formData.get('course_id') as string
  const subjectCode = formData.get('subject_code') as string

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('id, parent_id')
    .eq('user_id', user.id)
    .single() as {
    data: { id: string; parent_id: string | null } | null
    error: unknown
  }

  if (!studentProfile) redirect('/student/dashboard')

  // Upsert so double-clicking is idempotent
  await supabase.from('lesson_progress').upsert({
    student_id: studentProfile.id,
    lesson_id: lessonId,
  })

  // Notify parent if linked
  if (studentProfile.parent_id) {
    const { data: lesson } = await supabase
      .from('lessons')
      .select('title')
      .eq('id', lessonId)
      .single() as { data: { title: string } | null; error: unknown }

    const { data: studentName } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single() as { data: { full_name: string | null } | null; error: unknown }

    if (lesson) {
      await supabase.from('notifications').insert({
        user_id: studentProfile.parent_id,
        type: 'lesson_complete',
        title: 'Lesson completed',
        message: `${studentName?.full_name ?? 'Your child'} completed "${lesson.title}"`,
        metadata: { lesson_id: lessonId, course_id: courseId },
      })
    }
  }

  revalidatePath(`/student/lessons/${lessonId}`)
  revalidatePath(`/student/subjects/${subjectCode}`)
  redirect(`/student/lessons/${lessonId}?completed=1`)
}
