import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const SCRAPED_LESSONS = [
  {
    title: "Rationalising the Denominator",
    subjectCode: "OL-MATH",
    topicName: "Surds",
    content: `## Introduction to Rationalising Denominators
A fraction with a surd at the denominator is not simplified (e.g., 3/√6). Such surds are said to be simplified only if the denominator becomes a rational number.

### Core Concept
This is achieved by getting rid of the square root on the denominator, typically by multiplying both the numerator and the denominator by the surd in the denominator.

### Why do we do this?
1. It makes addition and subtraction of fractions with surds easier.
2. It provides a standard form for surd expressions.
3. It simplifies division of complex surd terms.`
  },
  {
    title: "Cells and Levels of Organisation",
    subjectCode: "OL-COMSCI",
    topicName: "Cells and Reproduction",
    content: `## Cells: The Building Blocks of Life
All living things (organisms) are similar in that they all display the same basic activities called life processes, which distinguish them from non-living things like iron ore or clay pots.

### Objectives
- Define what a cell is.
- State the key differences between plant and animal cells.
- Describe the levels of organisation: Cell → Tissue → Organ → Organ System → Organism.

### Summary
Cells are the smallest functional units of life. While animal cells are flexible and contain centrioles, plant cells have a rigid cell wall and chloroplasts for photosynthesis.`
  },
  {
    title: "Data Presentation in Science",
    subjectCode: "OL-COMSCI",
    topicName: "Physics Section",
    content: `## Accuracy in Scientific Data
Scientific experiments rely on accurate data representation to draw valid conclusions. This lesson focuses on the construction and interpretation of graphs.

### Key Skills
- Plotting the 'best fit' linear graph for experimental variables.
- Constructing a straight-line graph from raw data sets.
- Using graphs to find gradients and intercepts to extract information.

### Conclusion
Graphs are not just drawings; they are tools for uncovering relationships between physical quantities like force, mass, and acceleration.`
  }
]

async function ingest() {
  console.log('🧪 Starting ingestion of scraped MoPSE lessons...')

  // 1. Get a Teacher ID (need one to own the courses/lessons)
  const { data: teachers } = await supabase.from('teacher_profiles').select('id').limit(1)
  if (!teachers || teachers.length === 0) {
    console.error('❌ No teacher profiles found. Create one first.')
    return
  }
  const teacherId = teachers[0].id

  for (const item of SCRAPED_LESSONS) {
    // 2. Find Subject ID
    const { data: subject } = await supabase.from('subjects').select('id').eq('code', item.subjectCode).single()
    if (!subject) {
      console.warn(`⚠️ Subject code ${item.subjectCode} not found. Skipping.`)
      continue
    }

    // 3. Find or Create Course (generic course for the subject)
    const courseTitle = `${item.subjectCode} - Official MoPSE Lessons`
    let courseId: string

    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('title', courseTitle)
      .eq('teacher_id', teacherId)
      .maybeSingle()

    if (existingCourse) {
      courseId = existingCourse.id
    } else {
      const { data: newCourse, error: cErr } = await supabase
        .from('courses')
        .insert({
          subject_id: subject.id,
          teacher_id: teacherId,
          title: courseTitle,
          description: 'Auto-ingested content from the Zimbabwe Ministry of Education Passport.',
          published: true
        })
        .select('id')
        .single()

      if (cErr || !newCourse) {
          console.error(`❌ Failed to create course for ${item.subjectCode}:`, cErr?.message)
          continue
      }
      courseId = newCourse.id
    }

    // 4. Insert Lesson if not exists
    const { data: existingLesson } = await supabase
      .from('lessons')
      .select('id')
      .eq('title', item.title)
      .eq('course_id', courseId)
      .maybeSingle()

    if (!existingLesson) {
      const { error: lErr } = await supabase.from('lessons').insert({
        course_id: courseId,
        title: item.title,
        content_type: 'text',
        content: item.content,
        order_index: Math.floor(Math.random() * 100)
      })

      if (lErr) {
        console.error(`   ❌ Failed to ingest lesson "${item.title}":`, lErr.message)
      } else {
        console.log(`   ✓ Ingested: ${item.title}`)
      }
    } else {
      console.log(`   ⏭️ Skipping existing lesson: ${item.title}`)
    }
  }

  console.log('\n🚀 Ingestion Complete!')
}

ingest().catch(console.error)
