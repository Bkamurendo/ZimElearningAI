import { SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function createRecoveryMission(
  supabase: SupabaseClient,
  studentId: string,
  subjectId: string,
  topic: string,
  score: number,
  total: number
) {
  // 1. Log the failure in a new retention_campaigns or student_remediation table
  const { data: mission, error } = await supabase
    .from('student_remediation_missions')
    .insert({
      student_id: studentId,
      subject_id: subjectId,
      topic,
      status: 'active',
      score_at_failure: score,
      total_at_failure: total,
      deadline: new Date(Date.now() + 2 * 86400000).toISOString(), // 48 hours to recover
    })
    .select('id')
    .single()

  if (error || !mission) {
    console.error('Failed to create remediation record:', error)
    return null
  }

  // 2. Generate the "Teacher's Diagnosis" using MaFundi
  // In a real production app, we might do this as an edge function or background job
  // Here we'll generate the plan and store it.
  
  const prompt = `You are MaFundi, the Super Teacher. A student just failed a quiz on "${topic}" with a score of ${score}/${total}. 
  Create a 3-step 'Recovery Mission' to help them master this topic in 48 hours.
  Step 1: A specific 'Aha! Moment' analogy to fix the core misunderstanding.
  Step 2: A focused reading task from the Heritage-Based Curriculum.
  Step 3: A practice challenge.
  
  Keep it encouraging but firm. Use the 'MaFundi Coach' persona.`

  const response = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }]
  })

  const diagnosis = response.content[0].type === 'text' ? response.content[0].text : "I've detected a gap in your understanding. Let's fix it together!"

  await supabase
    .from('student_remediation_missions')
    .update({ diagnosis })
    .eq('id', mission.id)

  return {
    missionId: mission.id,
    diagnosis,
    topic
  }
}
