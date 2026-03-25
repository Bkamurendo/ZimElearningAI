import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STAGE_ORDER = ['proposal', 'research', 'planning', 'implementation', 'evaluation', 'submitted']

function nextStage(current: string): string {
  const idx = STAGE_ORDER.indexOf(current)
  return idx >= 0 && idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : current
}

// POST — add a stage entry and optionally advance to next stage
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const submissionId = params.id
    const body = await req.json()
    const { stage, content, advance_stage } = body

    if (!stage || !content?.trim()) {
      return NextResponse.json({ error: 'stage and content are required' }, { status: 400 })
    }

    // Verify ownership
    const { data: sub } = await supabase
      .from('sbp_submissions')
      .select('id, current_stage, student_id, student:student_profiles(user_id)')
      .eq('id', submissionId)
      .single() as {
        data: {
          id: string
          current_stage: string
          student_id: string
          student: { user_id: string }
        } | null
        error: unknown
      }

    if (!sub || sub.student?.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 403 })
    }

    // Insert the stage entry
    const { data: entry, error: eErr } = await supabase
      .from('sbp_stage_entries')
      .insert({
        submission_id: submissionId,
        stage,
        content: content.trim(),
      })
      .select()
      .single()

    if (eErr) throw new Error(eErr.message)

    // Advance stage if requested
    let newStage = sub.current_stage
    if (advance_stage && sub.current_stage !== 'submitted') {
      newStage = nextStage(sub.current_stage)
      const updates: Record<string, string> = {
        current_stage: newStage,
        updated_at: new Date().toISOString(),
      }
      if (newStage === 'submitted') {
        updates.submitted_at = new Date().toISOString()
      }
      await supabase.from('sbp_submissions').update(updates).eq('id', submissionId)
    } else {
      await supabase.from('sbp_submissions').update({ updated_at: new Date().toISOString() }).eq('id', submissionId)
    }

    return NextResponse.json({ entry, current_stage: newStage }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
