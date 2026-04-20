export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { markLessonComplete } from '@/app/actions/progress'
import LessonNotes from './LessonNotes'
import AskMaFundi from './AskMaFundi'
import MarkdownContent from '@/components/MarkdownContent'
import AudioBriefingButton from '@/components/AudioBriefingButton'

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: { lessonId: string }
  searchParams: { completed?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  type LessonData = {
    id: string
    title: string
    content_type: string
    content: string
    order_index: number
    course: {
      id: string
      title: string
      subject: { id: string; name: string; code: string; zimsec_level: string } | null
    } | null
  }

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, content_type, content, order_index, course:courses(id, title, subject:subjects(id, name, code, zimsec_level))')
    .eq('id', params.lessonId)
    .single() as { data: LessonData | null; error: unknown }

  if (!lesson) redirect('/student/dashboard')

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single() as { data: { id: string } | null; error: unknown }

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('id')
    .eq('lesson_id', params.lessonId)
    .eq('student_id', studentProfile?.id ?? '')
    .single() as { data: { id: string } | null; error: unknown }

  const isCompleted = !!progress || searchParams.completed === '1'

  // Sibling lessons for prev/next navigation
  type SiblingLesson = { id: string; title: string; order_index: number }
  const { data: siblings } = await supabase
    .from('lessons')
    .select('id, title, order_index')
    .eq('course_id', lesson.course?.id ?? '')
    .order('order_index') as { data: SiblingLesson[] | null; error: unknown }

  const idx = siblings?.findIndex((s) => s.id === params.lessonId) ?? -1
  const prev = idx > 0 ? siblings?.[idx - 1] : null
  const next = idx !== -1 && idx < (siblings?.length ?? 0) - 1 ? siblings?.[idx + 1] : null

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Link
            href={`/student/courses/${lesson.course?.id}`}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            ← {lesson.course?.title}
          </Link>
          <span className="text-gray-200">/</span>
          <span className="text-gray-400">{lesson.course?.subject?.name}</span>
          <span className="text-gray-200">/</span>
          <span className="font-bold text-gray-900 truncate">{lesson.title}</span>
        </div>

        {/* Lesson content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{lesson.title}</h1>
            <div className="flex items-center gap-2">
              <AudioBriefingButton lessonId={lesson.id} lessonTitle={lesson.title} />
              {isCompleted && (
                <span className="flex-shrink-0 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-green-200">
                  ✓ Completed
                </span>
              )}
            </div>
          </div>

          {lesson.content_type === 'text' && (
            <MarkdownContent content={lesson.content} />
          )}

          {lesson.content_type === 'video' && (
            <div>
              <p className="text-sm text-gray-500 mb-3">Video lesson:</p>
              <div className="rounded-xl overflow-hidden bg-black aspect-video">
                <iframe
                  src={lesson.content.replace('watch?v=', 'embed/')}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {lesson.content_type === 'pdf' && (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">📎</p>
              <a
                href={lesson.content}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                Open PDF
              </a>
            </div>
          )}
        </div>

        {/* Complete button */}
        {!isCompleted && (
          <form action={markLessonComplete as unknown as (fd: FormData) => void}>
            <input type="hidden" name="lesson_id" value={params.lessonId} />
            <input type="hidden" name="course_id" value={lesson.course?.id ?? ''} />
            <input
              type="hidden"
              name="subject_code"
              value={lesson.course?.subject?.code ?? ''}
            />
            <button
              type="submit"
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition"
            >
              Mark as complete ✓
            </button>
          </form>
        )}

        {/* Ask MaFundi */}
        {lesson.content_type === 'text' && (
          <AskMaFundi
            lessonTitle={lesson.title}
            lessonContent={lesson.content}
            subjectName={lesson.course?.subject?.name ?? 'this subject'}
          />
        )}

        {/* Lesson Notes */}
        <LessonNotes
          lessonId={params.lessonId}
          subjectId={lesson.course?.subject?.id ?? ''}
        />

        {/* Prev / Next */}
        <div className="flex gap-3">
          {prev && (
            <Link
              href={`/student/lessons/${prev.id}`}
              className="flex-1 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-green-300 transition text-left"
            >
              <p className="text-xs text-gray-400 mb-1">← Previous</p>
              <p className="text-sm font-medium text-gray-800 truncate">{prev.title}</p>
            </Link>
          )}
          {next && (
            <Link
              href={`/student/lessons/${next.id}`}
              className="flex-1 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-green-300 transition text-right"
            >
              <p className="text-xs text-gray-400 mb-1">Next →</p>
              <p className="text-sm font-medium text-gray-800 truncate">{next.title}</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
