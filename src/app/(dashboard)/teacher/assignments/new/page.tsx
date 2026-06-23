export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAssignment } from '@/app/actions/assignments'

export default async function NewAssignmentPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teacher } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single() as { data: { id: string } | null; error: unknown }

  if (!teacher) redirect('/teacher/dashboard')

  type SubjectRow = { id: string; name: string; code: string; zimsec_level: string }
  const { data: subjects } = await supabase
    .from('teacher_subjects')
    .select('subject:subjects(id, name, code, zimsec_level)')
    .eq('teacher_id', teacher.id) as {
    data: { subject: SubjectRow | null }[] | null
    error: unknown
  }

  const mySubjects = (subjects ?? [])
    .map((s) => s.subject)
    .filter((s): s is SubjectRow => s !== null)

  const levelLabel: Record<string, string> = {
    primary: 'Primary',
    olevel: 'O-Level',
    alevel: 'A-Level',
  }

  const grouped: Record<string, SubjectRow[]> = {}
  for (const s of mySubjects) {
    const lvl = s.zimsec_level
    if (!grouped[lvl]) grouped[lvl] = []
    grouped[lvl].push(s)
  }

  // today's date for min attribute on due_date
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link href="/teacher/assignments" className="text-gray-400 hover:text-gray-600 transition">← Assignments</Link>
          <span className="text-gray-200">/</span>
          <h1 className="font-bold text-gray-900">New assignment</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <form action={createAssignment as unknown as (fd: FormData) => void} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                name="subject_id"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select a subject</option>
                {Object.entries(grouped).map(([level, subs]) => (
                  <optgroup key={level} label={levelLabel[level] ?? level}>
                    {subs.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {mySubjects.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No subjects assigned. Contact admin to be assigned subjects.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                name="title"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g. Chapter 3 Review Questions"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description / Instructions</label>
              <textarea
                name="description"
                required
                rows={5}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                placeholder="Describe what students need to do…"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due date <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  name="due_date"
                  min={today}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max score</label>
                <input
                  type="number"
                  name="max_score"
                  defaultValue={100}
                  min={1}
                  max={1000}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
            >
              Create assignment
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
