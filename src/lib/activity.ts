import { createClient } from './supabase/server'

/**
 * Utility to log user activity and track feature usage metrics.
 * This ensures platform analytics reflect real student engagement.
 */
export async function logActivity(
  userId: string,
  activityType: string,
  description?: string,
  metadata: any = {}
) {
  try {
    const supabase = createClient()

    // 1. Log detailed activity for the activity feed
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: activityType,
      description: description || activityType.replace(/_/g, ' '),
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        path: typeof window !== 'undefined' ? window.location.pathname : undefined
      }
    })

    // 2. Update feature usage counters for popularity metrics
    // Activity types like 'use_solver', 'generate_notes', etc.
    const featureName = activityType.startsWith('use_') 
      ? activityType.replace('use_', '') 
      : activityType.split('_')[0]

    if (featureName) {
      const { data: existing } = await supabase
        .from('feature_usage')
        .select('id, usage_count')
        .eq('user_id', userId)
        .eq('feature', featureName)
        .single()

      if (existing) {
        await supabase
          .from('feature_usage')
          .update({ 
            usage_count: existing.usage_count + 1,
            last_used: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('feature_usage')
          .insert({
            user_id: userId,
            feature: featureName,
            usage_count: 1,
            last_used: new Date().toISOString()
          })
      }
    }

    // 3. Update the engagement score asynchronously (if relevant)
    // We don't wait for this to finish to keep the response fast
    supabase.rpc('calculate_engagement_score', { user_uuid: userId })

  } catch (err) {
    console.error('[ACTIVITY_LOG_ERROR]', err)
    // We don't want activity logging to break the main feature
  }
}

/**
 * Track a study session duration.
 */
export async function logStudySession(
  userId: string,
  subjectId: string,
  durationMinutes: number,
  sessionType: string = 'study'
) {
  try {
    const supabase = createClient()
    await supabase.from('study_sessions').insert({
      user_id: userId,
      subject_id: subjectId,
      duration: durationMinutes,
      session_type: sessionType,
      started_at: new Date(Date.now() - durationMinutes * 60 * 1000).toISOString(),
      ended_at: new Date().toISOString()
    })
    
    // Also log as a general activity
    await logActivity(userId, 'study_session', `Studied for ${durationMinutes} minutes`, { subjectId, durationMinutes })
  } catch (err) {
    console.error('[STUDY_SESSION_LOG_ERROR]', err)
  }
}
