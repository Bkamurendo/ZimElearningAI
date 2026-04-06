import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // 1. Get student profile and enrolled subjects
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id, zimsec_level')
      .eq('user_id', user.id)
      .single()

    if (!studentProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data: enrollments } = await supabase
      .from('student_subjects')
      .select('subject_id, subjects(id, name, code)')
      .eq('student_id', studentProfile.id)

    if (!enrollments) return NextResponse.json({ status: 'no_subjects', audit: [] })

    // 2. Fetch all mastery and quiz data for these subjects
    const { data: masteryData } = await supabase
      .from('topic_mastery')
      .select('subject_id, topic, mastery_level')
      .eq('student_id', studentProfile.id)

    const { data: quizData } = await supabase
      .from('quiz_attempts')
      .select('subject_id, score, total')
      .eq('student_id', studentProfile.id)

    // 3. Transform into a Subject-by-Subject "Pass Pulse"
    const CORE_SUBJECTS = ['Mathematics', 'English Language', 'Combined Science']
    let corePasses = 0
    let totalPasses = 0

    const audit = enrollments.map((enr: any) => {
      const subj = enr.subjects
      if (!subj) return null
      
      const isCore = CORE_SUBJECTS.some(cs => (subj.name || '').toLowerCase().includes(cs.toLowerCase()))
      
      const subjectMastery = (masteryData ?? []).filter(m => m.subject_id === subj.id)
      const subjectQuizzes = (quizData ?? []).filter(q => q.subject_id === subj.id)

      // Calculate Readiness Score
      const masteryWeight = subjectMastery.reduce((acc, m) => {
        if (m.mastery_level === 'mastered') return acc + 100
        if (m.mastery_level === 'practicing') return acc + 60
        if (m.mastery_level === 'learning') return acc + 30
        return acc
      }, 0)
      
      const topicsCount = subjectMastery.length || 1
      const masteryScore = Math.min(100, Math.round(masteryWeight / topicsCount))

      const quizAvg = subjectQuizzes.length > 0
        ? Math.round((subjectQuizzes.reduce((acc, q) => acc + (q.score / q.total), 0) / subjectQuizzes.length) * 100)
        : 0

      const pulseScore = subjectQuizzes.length > 0 
        ? Math.round((masteryScore * 0.6) + (quizAvg * 0.4))
        : masteryScore

      if (pulseScore >= 50) {
        totalPasses++
        if (isCore) corePasses++
      }

      // Grade Confidence
      let confidence = 'Ungraded'
      let color = 'text-gray-400'
      if (pulseScore >= 80) { confidence = 'Distinction (A)'; color = 'text-emerald-500' }
      else if (pulseScore >= 65) { confidence = 'Credit (B)'; color = 'text-blue-500' }
      else if (pulseScore >= 50) { confidence = 'Pass (C)'; color = 'text-amber-500' }
      else if (pulseScore >= 40) { confidence = 'Weak Pass (D)'; color = 'text-orange-500' }
      else { confidence = 'Below Threshold (U)'; color = 'text-red-500' }

      return {
        id: subj.id,
        name: subj.name,
        code: subj.code,
        isCore,
        score: pulseScore,
        confidence,
        color,
        masteryCount: subjectMastery.filter(m => m.mastery_level === 'mastered').length,
        totalTopics: subjectMastery.length,
        recommendation: pulseScore < 50 
          ? `Priority: Redo ${subjectMastery.find(m => m.mastery_level !== 'mastered')?.topic || 'Foundational'} quizzes.`
          : 'Keep practicing past papers.'
      }
    }).filter(Boolean) as any[]

    const certificateLikelihood = totalPasses >= 5 && corePasses === 3 ? 'High (On Track)' : totalPasses >= 3 ? 'Medium (Bridging)' : 'Critical (Needs Attention)'

    return NextResponse.json({
      success: true,
      lastAudit: new Date().toISOString(),
      audit,
      overallReadiness: Math.round(audit.reduce((acc: number, a: any) => acc + (a?.score || 0), 0) / (audit.length || 1)),
      certificateLikelihood,
      corePasses,
      totalPasses
    })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
