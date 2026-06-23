export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createCourse } from '@/app/actions/courses'

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, code, zimsec_level')
    .order('zimsec_level')
    .order('name') as {
    data: { id: string; name: string; code: string; zimsec_level: string }[] | null
    error: unknown
  }

  const grouped = {
    primary: subjects?.filter((s) => s.zimsec_level === 'primary') ?? [],
    olevel: subjects?.filter((s) => s.zimsec_level === 'olevel') ?? [],
    alevel: subjects?.filter((s) => s.zimsec_level === 'alevel') ?? [],
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link href="/teacher/courses" className="text-gray-400 hover:text-gray-600 transition">← My courses</Link>
          <span className="text-gray-200">/</span>
          <h1 className="font-bold text-gray-900">Create course</h1>
        </div>
        {searchParams.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {decodeURIComponent(searchParams.error)}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <form action={createCourse as unknown as (fd: FormData) => void} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                name="subject_id"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Choose a subject…</option>
                {Object.entries(grouped).map(([lvl, subs]) =>
                  subs.length > 0 ? (
                    <optgroup
                      key={lvl}
                      label={lvl === 'primary' ? 'Primary' : lvl === 'olevel' ? 'O-Level' : 'A-Level'}
                    >
                      {subs.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </optgroup>
                  ) : null
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course title
              </label>
              <input
                name="title"
                type="text"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g. Introduction to Quadratic Equations"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                placeholder="What will students learn in this course?"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              Create course
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
