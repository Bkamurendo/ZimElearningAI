import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { campaignType, targetUsers, message, schedule } = await request.json()
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Validate campaign data
    if (!campaignType || !targetUsers || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: campaignType, targetUsers, message' },
        { status: 400 }
      )
    }

    const now = new Date()
    
    // Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from('retention_campaigns')
      .insert({
        campaign_type: campaignType,
        target_users: targetUsers,
        message: message,
        schedule: schedule || null,
        status: 'pending',
        created_at: now.toISOString()
      })
      .select()
      .single()

    if (campaignError) {
      return NextResponse.json(
        { error: 'Failed to create campaign', details: campaignError.message },
        { status: 500 }
      )
    }

    // Get user details for personalization
    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name, email, plan, last_sign_in_at')
      .in('id', targetUsers)

    // Generate personalized messages for each user
    const personalizedMessages = users?.map(user => {
      const daysSinceLastLogin = Math.floor((now.getTime() - new Date(user.last_sign_in_at).getTime()) / (1000 * 60 * 60 * 24))
      
      let personalizedMessage = message
        .replace('{{name}}', user.full_name || 'Student')
        .replace('{{plan}}', user.plan || 'free')
        .replace('{{days_inactive}}', daysSinceLastLogin.toString())
      
      // Add campaign-specific personalization
      switch (campaignType) {
        case 're_engagement':
          personalizedMessage += '\n\nWe miss having you around! Your learning journey is important to us.'
          break
        case 'trial_conversion':
          personalizedMessage += '\n\nYour trial is ending soon. Don\'t lose access to your progress!'
          break
        case 'win_back':
          personalizedMessage += '\n\nWe\'ve made some exciting improvements we think you\'ll love!'
          break
        case 'milestone':
          personalizedMessage += '\n\nCongratulations on your learning progress so far!'
          break
      }
      
      return {
        user_id: user.id,
        email: user.email,
        personalized_message: personalizedMessage,
        campaign_id: campaign.id
      }
    }) || []

    // Store personalized messages
    const { error: messagesError } = await supabase
      .from('campaign_messages')
      .insert(personalizedMessages)

    if (messagesError) {
      return NextResponse.json(
        { error: 'Failed to create personalized messages', details: messagesError.message },
        { status: 500 }
      )
    }

    // If schedule is immediate, send messages now
    if (!schedule || new Date(schedule) <= now) {
      const { sendSMS } = await import('@/lib/sms')
      const { sendEmail } = await import('@/lib/email')

      for (const msg of personalizedMessages) {
        // Send Email
        if (msg.email) {
          await sendEmail(
            msg.email,
            `Special Update from ZimLearn: ${campaignType.replace('_', ' ')}`,
            `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
                <h2 style="color: #0d9488;">Hello from MaFundi!</h2>
                <div style="font-size: 16px; line-height: 1.6; background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
                  ${msg.personalized_message.replace(/\n/g, '<br>')}
                </div>
                <div style="margin: 30px 0; text-align: center;">
                  <a href="https://zimlearn.ai/student/dashboard" style="background-color: #0d9488; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">Return to My Learning</a>
                </div>
                <p style="font-size: 12px; color: #94a3b8; text-align: center;">You received this because of your learning activity on ZimLearn.</p>
              </div>
            `
          )
        }

        // Send SMS (assuming phone is available or fetched)
        // Note: profiles table has 'phone' field. Let's ensure we have it.
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', msg.user_id)
          .single()

        if (userProfile?.phone) {
          await sendSMS(userProfile.phone, msg.personalized_message)
        }
      }

      // Create activity logs
      const activityLogs = personalizedMessages.map(msg => ({
        user_id: msg.user_id,
        activity_type: 'retention_campaign',
        description: `Received ${campaignType} campaign message`,
        metadata: {
          campaign_id: campaign.id,
          campaign_type: campaignType,
          message_preview: msg.personalized_message.substring(0, 100) + '...'
        },
        created_at: now.toISOString()
      }))

      await supabase
        .from('user_activity')
        .insert(activityLogs)

      // Update campaign status
      await supabase
        .from('retention_campaigns')
        .update({ 
          status: 'sent',
          sent_at: now.toISOString(),
          messages_sent: personalizedMessages.length
        })
        .eq('id', campaign.id)
    } else {
      // Update campaign status to scheduled
      await supabase
        .from('retention_campaigns')
        .update({ status: 'scheduled' })
        .eq('id', campaign.id)
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        type: campaignType,
        target_count: targetUsers.length,
        status: schedule && new Date(schedule) > now ? 'scheduled' : 'sent',
        scheduled_for: schedule
      },
      messages_created: personalizedMessages.length,
      message_preview: personalizedMessages[0]?.personalized_message?.substring(0, 200) + '...'
    })
  } catch (err) {
    console.error('[CHURN CAMPAIGN]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch all campaigns
    const { data: campaigns, error } = await supabase
      .from('retention_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch campaigns', details: error.message },
        { status: 500 }
      )
    }

    // Calculate campaign statistics
    const totalCampaigns = campaigns?.length || 0
    const sentCampaigns = campaigns?.filter(c => c.status === 'sent').length || 0
    const scheduledCampaigns = campaigns?.filter(c => c.status === 'scheduled').length || 0
    const totalMessagesSent = campaigns?.reduce((sum, c) => sum + (c.messages_sent || 0), 0) || 0

    // Campaign performance by type
    const campaignTypes = ['re_engagement', 'trial_conversion', 'win_back', 'milestone']
    const performanceByType = campaignTypes.map(type => {
      const typeCampaigns = campaigns?.filter(c => c.campaign_type === type) || []
      const sent = typeCampaigns.filter(c => c.status === 'sent')
      return {
        type,
        total: typeCampaigns.length,
        sent: sent.length,
        messages_sent: sent.reduce((sum, c) => sum + (c.messages_sent || 0), 0)
      }
    })

    return NextResponse.json({
      success: true,
      campaigns: campaigns || [],
      summary: {
        total_campaigns: totalCampaigns,
        sent_campaigns: sentCampaigns,
        scheduled_campaigns: scheduledCampaigns,
        total_messages_sent: totalMessagesSent,
        performance_by_type: performanceByType
      }
    })
  } catch (err) {
    console.error('[CHURN CAMPAIGNS GET]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
