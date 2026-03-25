'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateAssignment(formData: FormData): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const dueDateStr = formData.get('due_date') as string
  const maxScore = parseInt(formData.get('max_score') as string, 10) || 100

  await supabase
    .from('assignments')
    .update({ title, description, due_date: dueDateStr || null, max_score: maxScore })
    .eq('id', id)

  revalidatePath('/teacher/assignments')
  redirect('/teacher/assignments')
}

export async function deleteAssignment(formData: FormData): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string

  await supabase.from('assignments').delete().eq('id', id)

  revalidatePath('/teacher/assignments')
  redirect('/teacher/assignments')
}

export async function createAssignment(formData: FormData): Promise<void> {
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
  const dueDateStr = formData.get('due_date') as string
  const maxScore = parseInt(formData.get('max_score') as string, 10) || 100

  const { error } = await supabase.from('assignments').insert({
    subject_id: subjectId,
    teacher_id: teacher.id,
    title,
    description,
    due_date: dueDateStr || null,
    max_score: maxScore,
  })

  if (error) redirect('/teacher/assignments?error=Failed+to+create+assignment')

  revalidatePath('/teacher/assignments')
  redirect('/teacher/assignments')
}

export async function submitAssignment(formData: FormData): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!studentProfile) redirect('/student/dashboard')

  const assignmentId = formData.get('assignment_id') as string
  const content = formData.get('content') as string
  const subjectCode = formData.get('subject_code') as string

  const { error } = await supabase.from('assignment_submissions').upsert({
    assignment_id: assignmentId,
    student_id: studentProfile.id,
    content,
    submitted_at: new Date().toISOString(),
    score: null,
    feedback: null,
    graded_at: null,
  })

  if (error) redirect(`/student/subjects/${subjectCode}?error=Submission+failed`)

  // Notify teacher
  const { data: assignment } = await supabase
    .from('assignments')
    .select('title, teacher_id, teacher_profiles(user_id)')
    .eq('id', assignmentId)
    .single() as {
    data: {
      title: string
      teacher_id: string
      teacher_profiles: { user_id: string } | null
    } | null
    error: unknown
  }

  if (assignment?.teacher_profiles?.user_id) {
    const { data: studentName } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    await supabase.from('notifications').insert({
      user_id: assignment.teacher_profiles.user_id,
      type: 'assignment_submitted',
      title: 'New submission',
      message: `${studentName?.full_name ?? 'A student'} submitted "${assignment.title}"`,
      metadata: { assignment_id: assignmentId },
    })
  }

  revalidatePath(`/student/subjects/${subjectCode}`)
  redirect(`/student/subjects/${subjectCode}?submitted=1`)
}

export async function gradeSubmission(formData: FormData): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const submissionId = formData.get('submission_id') as string
  const assignmentId = formData.get('assignment_id') as string
  const score = parseInt(formData.get('score') as string, 10)
  const feedback = formData.get('feedback') as string

  await supabase
    .from('assignment_submissions')
    .update({ score, feedback, graded_at: new Date().toISOString() })
    .eq('id', submissionId)

  // Notify student
  const { data: submission } = await supabase
    .from('assignment_submissions')
    .select('student_id, student_profiles(user_id)')
    .eq('id', submissionId)
    .single() as {
    data: {
      student_id: string
      student_profiles: { user_id: string } | null
    } | null
    error: unknown
  }

  const { data: assignment } = await supabase
    .from('assignments')
    .select('title')
    .eq('id', assignmentId)
    .single() as { data: { title: string } | null; error: unknown }

  if (submission?.student_profiles?.user_id && assignment) {
    await supabase.from('notifications').insert({
      user_id: submission.student_profiles.user_id,
      type: 'assignment_graded',
      title: 'Assignment graded',
      message: `Your submission for "${assignment.title}" received ${score} marks`,
      metadata: { assignment_id: assignmentId, score },
    })
  }

  revalidatePath(`/teacher/assignments/${assignmentId}/submissions`)
  redirect(`/teacher/assignments/${assignmentId}/submissions`)
}
