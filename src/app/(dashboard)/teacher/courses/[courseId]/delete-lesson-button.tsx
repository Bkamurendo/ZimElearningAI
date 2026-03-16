'use client'

import { deleteLesson } from '@/app/actions/courses'

export function DeleteLessonButton({ lessonId, courseId }: { lessonId: string; courseId: string }) {
  return (
    <form action={deleteLesson as unknown as (fd: FormData) => void}>
      <input type="hidden" name="lesson_id" value={lessonId} />
      <input type="hidden" name="course_id" value={courseId} />
      <button
        type="submit"
        className="text-xs text-red-500 hover:text-red-700"
        onClick={(e) => {
          if (!confirm('Delete this lesson?')) e.preventDefault()
        }}
      >
        Delete
      </button>
    </form>
  )
}
