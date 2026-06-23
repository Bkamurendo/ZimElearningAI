export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function createTest(formData: FormData): Promise<void> {
  'use server'
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
  const instructions = formData.get('instructions') as string
  const durationStr = formData.get('duration_minutes') as string
  const totalMarks = parseInt(formData.get('total_marks') as string, 10) || 100
  const dueDateStr = formData.get('due_date') as string

  const { data: test, error } = await supabase
    .from('tests')
    .insert({
      teacher_id: teacher.id,
      subject_id: subjectId || null,
      title,
      instructions: instructions || null,
      duration_minutes: durationStr ? parseInt(durationStr, 10) : null,
      total_marks: totalMarks,
      due_date: dueDateStr || null,
    })
    .select('id')
    .single()

  if (error || !test) redirect('/teacher/tests?error=failed')

  revalidatePath('/teacher/tests')
  redirect(`/teacher/tests/${test.id}/edit`)
}

export default async function NewTestPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teacher } = await supabase
    .from('teacher_profiles')
    .select('id, teacher_subjects(subjects(id, name, code, zimsec_level))')
    .eq('user_id', user.id)
    .single() as { data: { id: string; teacher_subjects: { subjects: { id: string; name: string; code: string; zimsec_level: string } | null }[] | null } | null; error: unknown }

  if (!teacher) redirect('/teacher/dashboard')

  type SubjectRow = { id: string; name: string; code: string; zimsec_level: string }
  const subjects: SubjectRow[] = (teacher.teacher_subjects ?? [])
    .map(ts => ts.subjects)
    .filter(Boolean) as SubjectRow[]

  return (
    <div className="min-h-screen">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href="/teacher/tests" className="text-sm text-gray-400 hover:text-gray-600 transition">← Back to Tests</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-2">Create New Test</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <form action={createTest as unknown as (fd: FormData) => void} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input name="title" required placeholder="e.g. Form 2 Mid-Term Mathematics Test"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select name="subject_id"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                <option value="">— Select subject —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea name="instructions" rows={3}
                placeholder="e.g. Answer ALL questions in Section A. Answer any THREE in Section B."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                <input type="number" name="total_marks" defaultValue={100} min={1} max={1000}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                <input type="number" name="duration_minutes" placeholder="e.g. 90" min={5}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" name="due_date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
            </div>

            <p className="text-xs text-gray-400 bg-indigo-50 px-4 py-3 rounded-xl">
              💡 After creating the test you&apos;ll be taken to the question editor to add questions from your question bank or create new ones.
            </p>

            <div className="flex gap-3">
              <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition">
                Create &amp; Add Questions →
              </button>
              <Link href="/teacher/tests" className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition text-center">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
