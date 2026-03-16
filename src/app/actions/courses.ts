'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createCourse(formData: FormData): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teacher } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!teacher) redirect('/teacher/dashboard')

  const subjectId = formData.get('subject_id') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string

  const { data: course, error } = await supabase
    .from('courses')
    .insert({ subject_id: subjectId, teacher_id: teacher.id, title, description })
    .select('id')
    .single()

  if (error || !course) redirect('/teacher/courses?error=Failed+to+create+course')

  revalidatePath('/teacher/courses')
  redirect(`/teacher/courses/${course.id}`)
}

export async function createLesson(formData: FormData): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const courseId = formData.get('course_id') as string
  const title = formData.get('title') as string
  const contentType = formData.get('content_type') as string
  const content = formData.get('content') as string

  // Get current max order_index
  const { data: maxRow } = await supabase
    .from('lessons')
    .select('order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  const orderIndex = maxRow ? (maxRow as { order_index: number }).order_index + 1 : 0

  await supabase.from('lessons').insert({
    course_id: courseId,
    title,
    content_type: contentType,
    content,
    order_index: orderIndex,
  })

  revalidatePath(`/teacher/courses/${courseId}`)
  redirect(`/teacher/courses/${courseId}`)
}

export async function togglePublishCourse(formData: FormData): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const courseId = formData.get('course_id') as string
  const published = formData.get('published') === 'true'

  await supabase
    .from('courses')
    .update({ published: !published })
    .eq('id', courseId)

  revalidatePath(`/teacher/courses/${courseId}`)
  revalidatePath('/teacher/courses')
  redirect(`/teacher/courses/${courseId}`)
}

export async function deleteLesson(formData: FormData): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const lessonId = formData.get('lesson_id') as string
  const courseId = formData.get('course_id') as string

  await supabase.from('lessons').delete().eq('id', lessonId)

  revalidatePath(`/teacher/courses/${courseId}`)
  redirect(`/teacher/courses/${courseId}`)
}
