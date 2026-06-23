export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = new Date()
    const results = {
      churn_predictions: 0,
      engagement_scores_updated: 0,
      automated_campaigns: 0,
      interventions_created: 0,
      errors: [] as string[]
    }

    console.log('[CHURN AUTOMATION] Starting automated churn reduction process...')

    // 1. Update engagement scores for all users
    try {
      const { data: engagementUpdate } = await supabase.rpc('update_all_engagement_scores')
      results.engagement_scores_updated = engagementUpdate || 0
      console.log(`[CHURN AUTOMATION] Updated engagement scores for ${results.engagement_scores_updated} users`)
    } catch (error: any) {
      console.error('[CHURN AUTOMATION] Failed to update engagement scores:', error)
      results.errors.push('Failed to update engagement scores: ' + error.message)
    }

    // 2. Generate churn predictions
    try {
      const predictionResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/churn/predict`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (predictionResponse.ok) {
        const predictionData = await predictionResponse.json()
        results.churn_predictions = predictionData.predictions?.length || 0
        console.log(`[CHURN AUTOMATION] Generated ${results.churn_predictions} churn predictions`)
      } else {
        throw new Error('Failed to fetch churn predictions')
      }
    } catch (error: any) {
      console.error('[CHURN AUTOMATION] Failed to generate churn predictions:', error)
      results.errors.push('Failed to generate churn predictions: ' + error.message)
    }

    // 3. Check and execute automated triggers
    try {
      const { data: triggers, error: triggersError } = await supabase
        .from('automated_triggers')
        .select('*')
        .eq('is_active', true)

      if (triggersError) throw triggersError

      for (const trigger of triggers || []) {
        await executeTrigger(supabase, trigger, results)
      }

      console.log(`[CHURN AUTOMATION] Executed ${triggers?.length || 0} automated triggers`)
    } catch (error: any) {
      console.error('[CHURN AUTOMATION] Failed to execute triggers:', error)
      results.errors.push('Failed to execute triggers: ' + error.message)
    }

    // 4. Create proactive interventions for high-risk users
    try {
      const { data: highRiskUsers } = await supabase
        .from('ai_predictions')
        .select('*')
        .eq('prediction_type', 'churn')
        .gte('prediction->>risk_score', '70')
        .eq('status', 'pending')
        .limit(20)

      for (const userPrediction of highRiskUsers || []) {
        await createIntervention(supabase, userPrediction, results)
      }

      console.log(`[CHURN AUTOMATION] Created ${results.interventions_created} interventions`)
    } catch (error: any) {
      console.error('[CHURN AUTOMATION] Failed to create interventions:', error)
      results.errors.push('Failed to create interventions: ' + error.message)
    }

    // 5. Send daily summary to admin
    try {
      await sendDailySummary(supabase, results)
    } catch (error: any) {
      console.error('[CHURN AUTOMATION] Failed to send summary:', error)
      results.errors.push('Failed to send summary: ' + error.message)
    }

    console.log('[CHURN AUTOMATION] Process completed:', results)

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results
    })
  } catch (err) {
    console.error('[CHURN AUTOMATION]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}

async function executeTrigger(supabase: any, trigger: any, results: any) {
  const now = new Date()
  let targetUsers: any[] = []

  switch (trigger.trigger_type) {
    case 'inactivity':
      const conditions = trigger.conditions
      const daysInactive = conditions.days_inactive
      const minActivity = conditions.min_activity_count || 0
      
      const { data: inactiveUsers } = await supabase
        .from('profiles')
        .select('id, full_name, email, last_sign_in_at')
        .eq('role', 'student')
        .lt('last_sign_in_at', new Date(now.getTime() - daysInactive * 24 * 60 * 60 * 1000).toISOString())

      // Filter by activity count if specified
      if (minActivity > 0) {
        const userIds = inactiveUsers?.map((u: any) => u.id) || []
        const { data: activityData } = await supabase
          .from('user_activity')
          .select('user_id')
          .in('user_id', userIds)
          .gte('created_at', new Date(now.getTime() - daysInactive * 24 * 60 * 60 * 1000).toISOString())
        
        const activityCounts = activityData?.reduce((acc: any, activity: any) => {
          acc[activity.user_id] = (acc[activity.user_id] || 0) + 1
          return acc
        }, {}) || {}

        targetUsers = inactiveUsers?.filter((user: any) => 
          (activityCounts[user.id] || 0) <= minActivity
        ) || []
      } else {
        targetUsers = inactiveUsers || []
      }
      break

    case 'trial_expiration':
      const trialConditions = trigger.conditions
      const daysBefore = trialConditions.days_before_expiration
      const daysAfter = trialConditions.days_after_expiration

      if (daysBefore > 0) {
        // Trials expiring soon
        const { data: expiringSoon } = await supabase
          .from('profiles')
          .select('id, full_name, email, trial_ends_at')
          .eq('role', 'student')
          .not('trial_ends_at', 'is', null)
          .lte('trial_ends_at', new Date(now.getTime() + daysBefore * 24 * 60 * 60 * 1000).toISOString())
          .gt('trial_ends_at', now.toISOString())
        
        targetUsers = expiringSoon || []
      } else if (daysAfter === 0) {
        // Recently expired trials
        const { data: expiredTrials } = await supabase
          .from('profiles')
          .select('id, full_name, email, trial_ends_at')
          .eq('role', 'student')
          .not('trial_ends_at', 'is', null)
          .lte('trial_ends_at', new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString())
          .gt('trial_ends_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        
        targetUsers = expiredTrials || []
      }
      break

    case 'low_engagement':
      const engagementConditions = trigger.conditions
      const daysSinceCreation = engagementConditions.days_since_creation
      const maxActivity = engagementConditions.max_activity_count

      const { data: lowEngagementUsers } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .eq('role', 'student')
        .gte('created_at', new Date(now.getTime() - daysSinceCreation * 24 * 60 * 60 * 1000).toISOString())

      const userIds = lowEngagementUsers?.map((u: any) => u.id) || []
      const { data: activityData } = await supabase
        .from('user_activity')
        .select('user_id')
        .in('user_id', userIds)
        .gte('created_at', new Date(now.getTime() - daysSinceCreation * 24 * 60 * 60 * 1000).toISOString())

      const activityCounts = activityData?.reduce((acc: any, activity: any) => {
        acc[activity.user_id] = (acc[activity.user_id] || 0) + 1
        return acc
      }, {}) || {}

      targetUsers = lowEngagementUsers?.filter((user: any) => 
        (activityCounts[user.id] || 0) <= maxActivity
      ) || []
      break

    case 'support_ticket':
      const supportConditions = trigger.conditions
      const ticketCount = supportConditions.ticket_count
      const daysWindow = supportConditions.days_window

      const { data: usersWithTickets } = await supabase
        .from('support_tickets')
        .select('user_id')
        .gte('created_at', new Date(now.getTime() - daysWindow * 24 * 60 * 60 * 1000).toISOString())

      const ticketCounts = usersWithTickets?.reduce((acc: any, ticket: any) => {
        acc[ticket.user_id] = (acc[ticket.user_id] || 0) + 1
        return acc
      }, {}) || {}

      const highTicketUserIds = Object.entries(ticketCounts)
        .filter(([_, count]) => (count as number) >= ticketCount)
        .map(([userId, _]) => userId)

      const { data: highTicketUsers } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'student')
        .in('id', highTicketUserIds)

      targetUsers = highTicketUsers || []
      break
  }

  if (targetUsers.length > 0) {
    const actions = trigger.actions
    const campaignType = actions.send_email || 'automated_intervention'

    // Create automated campaign
    const message = generateTriggerMessage(trigger.trigger_type, trigger.trigger_name)
    
    const campaignResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/churn/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaignType: campaignType,
        targetUsers: targetUsers.map((u: any) => u.id),
        message: message,
        schedule: null // Send immediately
      })
    })

    if (campaignResponse.ok) {
      results.automated_campaigns += 1
      
      // Update trigger
      await supabase
        .from('automated_triggers')
        .update({ 
          last_triggered: now.toISOString(),
          trigger_count: trigger.trigger_count + 1
        })
        .eq('id', trigger.id)
    }
  }
}

async function createIntervention(supabase: any, userPrediction: any, results: any) {
  const prediction = userPrediction.prediction
  const recommendedActions = prediction.recommended_actions || []
  
  // Create intervention record
  const { error: interventionError } = await supabase
    .from('intervention_actions')
    .insert({
      user_id: userPrediction.target_id,
      action_type: recommendedActions[0] || 'automated_outreach',
      description: `Automated intervention for ${prediction.risk_level} churn risk (${prediction.risk_score}%)`,
      status: 'pending',
      created_at: new Date().toISOString()
    })

  if (!interventionError) {
    results.interventions_created += 1
    
    // Update prediction status
    await supabase
      .from('ai_predictions')
      .update({ status: 'intervention_created' })
      .eq('id', userPrediction.id)
  }
}

function generateTriggerMessage(triggerType: string, triggerName: string): string {
  const messages = {
    '30_day_inactive': `Hi {{name}}, we haven't seen you in a while! Your learning journey is important to us. Here's what's new and how to get back on track.`,
    '14_day_inactive': `Hi {{name}}, we noticed you haven't logged in recently. Don't lose your momentum! Here are some resources to help you continue learning.`,
    'trial_expiring_3_days': `Hi {{name}}, your trial expires in 3 days! Don't lose access to your progress and learning materials. Upgrade now to continue your journey.`,
    'trial_expired': `Hi {{name}}, your trial has expired. We'd love to have you back! Here's a special offer to help you continue learning.`,
    'low_engagement_new_user': `Hi {{name}}, welcome to ZimElearningAI! We want to help you get the most out of your learning experience. Here are some tips to get started.`,
    'multiple_support_tickets': `Hi {{name}}, we noticed you've had some challenges recently. We're here to help! Let us know how we can improve your experience.`
  }

  return messages[triggerName as keyof typeof messages] || `Hi {{name}}, we're here to support your learning journey. Let us know how we can help!`
}

async function sendDailySummary(supabase: any, results: any) {
  // Create activity log for the automation run
  await supabase
    .from('user_activity')
    .insert({
      user_id: null, // System activity
      activity_type: 'churn_automation',
      description: `Daily churn reduction automation completed`,
      metadata: results,
      created_at: new Date().toISOString()
    })
}
