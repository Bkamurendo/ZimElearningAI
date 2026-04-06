import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FlaskConical, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type TestRow = {
  id: string
  title: string
  instructions: string | null
  duration_minutes: number | null
  total_marks: number
  published: boolean
  due_date: string | null
  created_at: string
  subject: { name: string; code: string } | null
}

export default async function TeacherTestsPage() {
  const supabase = createClient()
  
  // Safely check for user without crashing on null data
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user
  
  if (authError || !user) redirect('/login')

  try {
    const { data: teacher } = await supabase
      .from('teacher_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null; error: unknown }

    if (!teacher) redirect('/teacher/dashboard')

    const { data: tests } = await supabase
      .from('tests')
      .select('id, title, instructions, duration_minutes, total_marks, published, due_date, created_at, subject:subjects(name, code)')
      .eq('teacher_id', teacher.id)
      .order('created_at', { ascending: false }) as { data: TestRow[] | null; error: unknown }

    const testList = tests ?? []
    const testIds = testList.map(t => t.id)

    // Submission counts
    const { data: subs } = await supabase
      .from('test_submissions')
      .select('test_id')
      .in('test_id', testIds.length > 0 ? testIds : ['none']) as { data: { test_id: string }[] | null; error: unknown }

    const subCounts: Record<string, number> = {}
    for (const s of subs ?? []) subCounts[s.test_id] = (subCounts[s.test_id] ?? 0) + 1

    // Question counts
    const { data: qRows } = await supabase
      .from('test_questions')
      .select('test_id')
      .in('test_id', testIds.length > 0 ? testIds : ['none']) as { data: { test_id: string }[] | null; error: unknown }

    const qCounts: Record<string, number> = {}
    for (const q of qRows ?? []) qCounts[q.test_id] = (qCounts[q.test_id] ?? 0) + 1

    const levelColor = (code: string | undefined) => {
      if (!code) return 'bg-gray-100 text-gray-600'
      if (code.includes('primary')) return 'bg-green-50 text-green-700'
      if (code.includes('olevel')) return 'bg-blue-50 text-blue-700'
      return 'bg-purple-50 text-purple-700'
    }

    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 uppercase">
                <FlaskConical size={22} className="text-indigo-500" />
                Tests &amp; Assessments
              </h1>
              <p className="text-sm text-gray-500 mt-0.5 uppercase">{testList.length} test{testList.length !== 1 ? 's' : ''}</p>
            </div>
            <Link
              href="/teacher/tests/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm uppercase"
            >
              <Plus size={16} /> New Test
            </Link>
          </div>

          {testList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FlaskConical size={28} className="text-indigo-400" />
              </div>
              <p className="font-semibold text-gray-700 uppercase">No tests yet</p>
              <p className="text-sm text-gray-400 mt-1 uppercase">Create assessments for your students using your question bank</p>
              <Link
                href="/teacher/tests/new"
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm uppercase"
              >
                <Plus size={15} /> Create test
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {testList.map(t => {
                const isOverdue = t.due_date && new Date(t.due_date) < new Date()
                return (
                  <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-semibold text-gray-900 text-sm uppercase">{t.title}</h2>
                          {t.subject && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${levelColor(t.subject.code)}`}>
                              {t.subject.name}
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${t.published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {t.published ? '● Live' : '○ Draft'}
                          </span>
                          {isOverdue && <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-bold uppercase">Overdue</span>}
                        </div>
                        <div className="flex items-center gap-4 mt-2.5 text-[10px] text-gray-400 flex-wrap uppercase font-medium">
                          <span>📝 {qCounts[t.id] ?? 0} questions</span>
                          <span>📊 {t.total_marks} marks</span>
                          {t.duration_minutes && <span>⏱ {t.duration_minutes} min</span>}
                          {t.due_date && (
                            <span className={isOverdue ? 'text-red-500 font-bold' : ''}>
                              📅 Due: {new Date(t.due_date).toLocaleDateString()}
                            </span>
                          )}
                          <span className="text-gray-600 font-bold flex items-center gap-1">
                            <Users size={11} /> {subCounts[t.id] ?? 0} submitted
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/teacher/tests/${t.id}/edit`}
                          className="px-3 py-1.5 text-[10px] font-bold bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition uppercase"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/teacher/tests/${t.id}/submissions`}
                          className="px-3 py-1.5 text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition uppercase"
                        >
                          Results →
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  } catch (err) {
    console.error('[TeacherTests] Runtime error:', err)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center bg-gray-50">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
          <FlaskConical size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 uppercase">Assessments Unavailable</h2>
        <p className="text-slate-500 max-w-xs uppercase">We encountered an error while loading your test list. Please try again.</p>
        <Link href="/login">
          <Button variant="outline">Back to Login</Button>
        </Link>
      </div>
    )
  }
}
