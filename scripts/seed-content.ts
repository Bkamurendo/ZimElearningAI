/**
 * ZimLearn Content Seeder
 * ========================
 * Seeds the database with ZIMSEC-aligned courses and lessons.
 *
 * Prerequisites:
 *   1. Run `supabase/schema.sql` and `supabase/002_features.sql` first.
 *   2. Create at least ONE teacher account via the app (register + onboarding).
 *
 * Usage:
 *   npx tsx scripts/seed-content.ts
 *
 * The script uses the service role key to bypass RLS and will link all
 * content to the first teacher profile found in the database.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

// ────────────────────────────────────────────────────────────
// Import content modules
// ────────────────────────────────────────────────────────────
import { primaryMath } from './content/primary-math'
import { primaryEnglish } from './content/primary-english'
import { olevelMathAlgebra, olevelMathGeometry } from './content/olevel-math'
import { olevelPhysics, olevelChemistry, olevelBiology } from './content/olevel-sciences'
import { olevelEnglish, olevelHistory } from './content/olevel-humanities'
import { alevelPureMath } from './content/alevel-math'

type LessonData = {
  title: string
  type: 'text' | 'video' | 'pdf'
  content: string
}

type CourseData = {
  subjectCode: string
  title: string
  description: string
  lessons: LessonData[]
}

const ALL_COURSES: CourseData[] = [
  primaryMath,
  primaryEnglish,
  olevelMathAlgebra,
  olevelMathGeometry,
  olevelPhysics,
  olevelChemistry,
  olevelBiology,
  olevelEnglish,
  olevelHistory,
  alevelPureMath,
]

// ────────────────────────────────────────────────────────────
// Main seeding function
// ────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  ZimLearn content seeder starting...\n')

  // 1. Get teacher ID
  const { data: teachers, error: teacherError } = await supabase
    .from('teacher_profiles')
    .select('id')
    .limit(1)

  if (teacherError || !teachers || teachers.length === 0) {
    console.error('❌  No teacher profiles found.')
    console.error('    Create a teacher account in the app first, then re-run this script.')
    process.exit(1)
  }

  const teacherId = teachers[0].id
  console.log(`✅  Using teacher ID: ${teacherId}\n`)

  // 2. Fetch all subjects
  const { data: subjects, error: subjectError } = await supabase
    .from('subjects')
    .select('id, code')

  if (subjectError || !subjects) {
    console.error('❌  Could not fetch subjects:', subjectError?.message)
    process.exit(1)
  }

  const subjectMap: Record<string, string> = {}
  for (const s of subjects) subjectMap[s.code] = s.id

  // 3. Seed each course
  let totalCourses = 0
  let totalLessons = 0
  const errors: string[] = []

  for (const course of ALL_COURSES) {
    const subjectId = subjectMap[course.subjectCode]

    if (!subjectId) {
      errors.push(`Subject code not found: ${course.subjectCode}`)
      continue
    }

    // Check if course already exists (avoid duplicates on re-run)
    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .eq('title', course.title)
      .eq('teacher_id', teacherId)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`⏭️   Already exists — skipping: ${course.title}`)
      continue
    }

    // Insert course
    const { data: newCourse, error: courseError } = await supabase
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

    if (courseError || !newCourse) {
      errors.push(`Failed to create course "${course.title}": ${courseError?.message}`)
      continue
    }

    // Insert lessons
    let lessonErrors = 0
    for (let i = 0; i < course.lessons.length; i++) {
      const lesson = course.lessons[i]
      const { error: lessonError } = await supabase.from('lessons').insert({
        course_id: newCourse.id,
        title: lesson.title,
        content_type: lesson.type,
        content: lesson.content,
        order_index: i + 1,
      })

      if (lessonError) {
        lessonErrors++
        errors.push(`  Lesson "${lesson.title}": ${lessonError.message}`)
      } else {
        totalLessons++
      }
    }

    totalCourses++
    const lessonCount = course.lessons.length - lessonErrors
    console.log(`✅  ${course.title} — ${lessonCount} lessons`)
  }

  // 4. Summary
  console.log('\n' + '─'.repeat(50))
  console.log(`📚  Courses created: ${totalCourses}`)
  console.log(`📖  Lessons created: ${totalLessons}`)

  if (errors.length > 0) {
    console.log(`\n⚠️   Errors (${errors.length}):`)
    errors.forEach((e) => console.log(`   ${e}`))
  } else {
    console.log('\n🎉  All content seeded successfully!')
  }

  // 5. Assign teacher to all seeded subjects
  console.log('\n📎  Assigning teacher to subjects...')
  const subjectCodes = Array.from(new Set(ALL_COURSES.map((c) => c.subjectCode)))
  for (const code of subjectCodes) {
    const sid = subjectMap[code]
    if (!sid) continue
    const { error } = await supabase.from('teacher_subjects').upsert(
      { teacher_id: teacherId, subject_id: sid },
      { onConflict: 'teacher_id,subject_id' }
    )
    if (!error) console.log(`   ✓ ${code}`)
  }

  console.log('\n✅  Done. Visit the app to see your content!')
}

main().catch((err) => {
  console.error('❌  Unexpected error:', err)
  process.exit(1)
})
