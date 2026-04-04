import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Fetch user data for churn prediction
    const [
      { data: users },
      { data: activity },
      { data: studySessions },
      { data: supportTickets },
      { data: trialUsers }
    ] = await Promise.all([
      // User profiles
      supabase
        .from('profiles')
        .select('id, full_name, email, plan, created_at, last_sign_in_at')
        .eq('role', 'student')
        .not('last_sign_in_at', 'is', null),
      
      // Recent activity
      supabase
        .from('user_activity')
        .select('user_id, activity_type, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      // Study sessions (engagement indicator)
      supabase
        .from('study_sessions')
        .select('user_id, duration, started_at')
        .gte('started_at', thirtyDaysAgo.toISOString()),
      
      // Support tickets (dissatisfaction indicator)
      supabase
        .from('support_tickets')
        .select('user_id, category, status, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      // Trial users (higher churn risk)
      supabase
        .from('profiles')
        .select('id, trial_ends_at')
        .eq('role', 'student')
        .not('trial_ends_at', 'is', null')
    ])

    // Calculate churn risk for each user
    const churnPredictions = users?.map(user => {
      const daysSinceLastLogin = Math.floor((now.getTime() - new Date(user.last_sign_in_at).getTime()) / (1000 * 60 * 60 * 24))
      const daysSinceCreation = Math.floor((now.getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
      
      // Activity metrics
      const userActivity = activity?.filter(a => a.user_id === user.id) || []
      const userStudySessions = studySessions?.filter(s => s.user_id === user.id) || []
      const userSupportTickets = supportTickets?.filter(t => t.user_id === user.id) || []
      
      const activityCount = userActivity.length
      const studyTime = userStudySessions.reduce((total, session) => total + (session.duration || 0), 0)
      const supportTicketCount = userSupportTickets.length
      
      // Risk factors calculation
      let riskScore = 0
      let riskFactors = []
      
      // Inactivity risk (highest weight)
      if (daysSinceLastLogin > 30) {
        riskScore += 40
        riskFactors.push('inactive_30_days')
      } else if (daysSinceLastLogin > 21) {
        riskScore += 30
        riskFactors.push('inactive_21_days')
      } else if (daysSinceLastLogin > 14) {
        riskScore += 20
        riskFactors.push('inactive_14_days')
      }
      
      // Low engagement risk
      if (activityCount < 5) {
        riskScore += 15
        riskFactors.push('low_activity')
      }
      
      if (studyTime < 60) { // Less than 1 hour in 30 days
        riskScore += 15
        riskFactors.push('low_study_time')
      }
      
      // Support tickets risk (indicates dissatisfaction)
      if (supportTicketCount > 2) {
        riskScore += 10
        riskFactors.push('multiple_support_tickets')
      }
      
      // Trial user risk
      const isTrialUser = trialUsers?.some(t => t.id === user.id)
      if (isTrialUser) {
        const trialEndsAt = trialUsers?.find(t => t.id === user.id)?.trial_ends_at
        if (trialEndsAt) {
          const daysUntilTrialEnd = Math.ceil((new Date(trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (daysUntilTrialEnd < 7 && daysUntilTrialEnd > 0) {
            riskScore += 25
            riskFactors.push('trial_expiring_soon')
          } else if (daysUntilTrialEnd <= 0) {
            riskScore += 35
            riskFactors.push('trial_expired')
          }
        }
      }
      
      // New user risk (first 30 days are critical)
      if (daysSinceCreation < 30 && activityCount < 3) {
        riskScore += 20
        riskFactors.push('new_user_low_engagement')
      }
      
      // Plan-based risk
      if (user.plan === 'free' && daysSinceCreation > 60) {
        riskScore += 10
        riskFactors.push('free_user_long_term')
      }
      
      // Cap risk score at 100
      riskScore = Math.min(riskScore, 100)
      
      // Determine risk level
      let riskLevel = 'Low'
      if (riskScore >= 70) riskLevel = 'Critical'
      else if (riskScore >= 50) riskLevel = 'High'
      else if (riskScore >= 30) riskLevel = 'Medium'
      
      // Recommended actions
      let recommendedActions = []
      if (riskScore >= 70) {
        recommendedActions.push('immediate_personal_outreach', 'special_offer', 'phone_call')
      } else if (riskScore >= 50) {
        recommendedActions.push('personalized_email', 'engagement_campaign', 'feature_highlight')
      } else if (riskScore >= 30) {
        recommendedActions.push('automated_nudge', 'progress_report', 'success_stories')
      }
      
      return {
        user_id: user.id,
        full_name: user.full_name,
        email: user.email,
        plan: user.plan,
        risk_score: riskScore,
        risk_level: riskLevel,
        risk_factors: riskFactors,
        recommended_actions: recommendedActions,
        metrics: {
          days_since_last_login: daysSinceLastLogin,
          activity_count: activityCount,
          study_time_minutes: studyTime,
          support_ticket_count: supportTicketCount,
          days_since_creation: daysSinceCreation
        }
      }
    }) || []

    // Sort by risk score (highest first)
    churnPredictions.sort((a, b) => b.risk_score - a.risk_score)

    // Store predictions in database for tracking
    const predictionsToStore = churnPredictions.map(pred => ({
      prediction_type: 'churn',
      target_id: pred.user_id,
      prediction: {
        risk_score: pred.risk_score,
        risk_level: pred.risk_level,
        risk_factors: pred.risk_factors,
        recommended_actions: pred.recommended_actions,
        metrics: pred.metrics
      },
      confidence: Math.max(0.5, 1 - (pred.risk_score / 200)), // Simple confidence calculation
      status: 'pending'
    }))

    // Insert predictions
    await supabase
      .from('ai_predictions')
      .upsert(predictionsToStore, { onConflict: 'target_id, prediction_type' })

    // Generate summary statistics
    const totalUsers = churnPredictions.length
    const criticalRisk = churnPredictions.filter(p => p.risk_level === 'Critical').length
    const highRisk = churnPredictions.filter(p => p.risk_level === 'High').length
    const mediumRisk = churnPredictions.filter(p => p.risk_level === 'Medium').length
    const lowRisk = churnPredictions.filter(p => p.risk_level === 'Low').length

    const avgRiskScore = totalUsers > 0 
      ? churnPredictions.reduce((sum, p) => sum + p.risk_score, 0) / totalUsers 
      : 0

    return NextResponse.json({
      success: true,
      predictions: churnPredictions.slice(0, 50), // Return top 50 for performance
      summary: {
        total_users: totalUsers,
        average_risk_score: Math.round(avgRiskScore),
        risk_distribution: {
          critical: criticalRisk,
          high: highRisk,
          medium: mediumRisk,
          low: lowRisk
        }
      },
      generated_at: now.toISOString()
    })
  } catch (err) {
    console.error('[CHURN PREDICTION]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
