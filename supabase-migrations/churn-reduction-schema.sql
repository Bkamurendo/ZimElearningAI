-- ========================================
-- Churn Reduction System - Database Schema
-- ========================================
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Retention Campaigns Table
CREATE TABLE IF NOT EXISTS retention_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_type VARCHAR(50) NOT NULL, -- re_engagement, trial_conversion, win_back, milestone
    target_users UUID[] NOT NULL, -- Array of user IDs
    message TEXT NOT NULL,
    schedule TIMESTAMP WITH TIME ZONE, -- When to send (null for immediate)
    status VARCHAR(50) DEFAULT 'pending', -- pending, scheduled, sent, cancelled
    messages_sent INTEGER DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_retention_campaigns_type (campaign_type),
    INDEX idx_retention_campaigns_status (status),
    INDEX idx_retention_campaigns_schedule (schedule)
);

-- 2. Campaign Messages Table (for tracking individual messages)
CREATE TABLE IF NOT EXISTS campaign_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES retention_campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    personalized_message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, opened, clicked
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_campaign_messages_campaign (campaign_id),
    INDEX idx_campaign_messages_user (user_id),
    INDEX idx_campaign_messages_status (status)
);

-- 3. User Engagement Scores Table
CREATE TABLE IF NOT EXISTS user_engagement_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    engagement_score DECIMAL(5,2) DEFAULT 0, -- 0-100 score
    activity_frequency INTEGER DEFAULT 0, -- Activities per week
    study_time_minutes INTEGER DEFAULT 0, -- Total study time
    login_streak INTEGER DEFAULT 0, -- Consecutive days logged in
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id),
    INDEX idx_user_engagement_scores_user (user_id),
    INDEX idx_user_engagement_scores_score (engagement_score)
);

-- 4. Churn Risk History Table
CREATE TABLE IF NOT EXISTS churn_risk_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    risk_score DECIMAL(5,2) NOT NULL, -- 0-100 score
    risk_level VARCHAR(20) NOT NULL, -- Low, Medium, High, Critical
    risk_factors TEXT[], -- Array of risk factors
    predicted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actual_churn BOOLEAN DEFAULT NULL, -- Whether user actually churned
    churn_date TIMESTAMP WITH TIME ZONE, -- When churn was confirmed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_churn_risk_history_user (user_id),
    INDEX idx_churn_risk_history_predicted (predicted_at),
    INDEX idx_churn_risk_history_score (risk_score)
);

-- 5. Intervention Actions Table
CREATE TABLE IF NOT EXISTS intervention_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- email, phone_call, special_offer, feature_highlight
    campaign_id UUID REFERENCES retention_campaigns(id) ON DELETE SET NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
    outcome TEXT, -- Result of the intervention
    cost DECIMAL(10,2) DEFAULT 0, -- Cost of intervention
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    INDEX idx_intervention_actions_user (user_id),
    INDEX idx_intervention_actions_type (action_type),
    INDEX idx_intervention_actions_status (status)
);

-- 6. Automated Triggers Table
CREATE TABLE IF NOT EXISTS automated_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_name VARCHAR(100) UNIQUE NOT NULL,
    trigger_type VARCHAR(50) NOT NULL, -- inactivity, trial_expiration, low_engagement, support_ticket
    conditions JSONB NOT NULL, -- Trigger conditions (e.g., days_inactive > 30)
    actions JSONB NOT NULL, -- Actions to take (e.g., send_email, create_task)
    is_active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_automated_triggers_type (trigger_type),
    INDEX idx_automated_triggers_active (is_active)
);

-- 7. Insert default automated triggers
INSERT INTO automated_triggers (trigger_name, trigger_type, conditions, actions) VALUES
('30_day_inactive', 'inactivity', '{"days_inactive": 30, "min_activity_count": 5}', '{"send_email": "re_engagement_30_days", "priority": "high"}'),
('14_day_inactive', 'inactivity', '{"days_inactive": 14, "min_activity_count": 3}', '{"send_email": "re_engagement_14_days", "priority": "medium"}'),
('trial_expiring_3_days', 'trial_expiration', '{"days_before_expiration": 3}', '{"send_email": "trial_expiration_reminder", "priority": "critical"}'),
('trial_expired', 'trial_expiration', '{"days_after_expiration": 0}', '{"send_email": "trial_expired_offer", "priority": "high"}'),
('low_engagement_new_user', 'low_engagement', '{"days_since_creation": 14, "max_activity_count": 2}', '{"send_email": "new_user_engagement", "priority": "medium"}'),
('multiple_support_tickets', 'support_ticket', '{"ticket_count": 3, "days_window": 30}', '{"create_task": "personal_outreach", "priority": "high"}')
ON CONFLICT (trigger_name) DO NOTHING;

-- 8. Create views for churn analytics
CREATE OR REPLACE VIEW churn_risk_summary AS
SELECT 
    p.id as user_id,
    p.full_name,
    p.email,
    p.plan,
    COALESCE(crh.risk_score, 0) as latest_risk_score,
    COALESCE(crh.risk_level, 'Low') as latest_risk_level,
    COALESCE(ues.engagement_score, 0) as engagement_score,
    p.last_sign_in_at,
    EXTRACT(DAYS FROM (NOW() - p.last_sign_in_at)) as days_since_last_login,
    CASE 
        WHEN crh.risk_score >= 70 THEN 'Critical'
        WHEN crh.risk_score >= 50 THEN 'High'
        WHEN crh.risk_score >= 30 THEN 'Medium'
        ELSE 'Low'
    END as current_risk_category
FROM profiles p
LEFT JOIN churn_risk_history crh ON p.id = crh.user_id
LEFT JOIN user_engagement_scores ues ON p.id = ues.user_id
WHERE p.role = 'student'
ORDER BY crh.predicted_at DESC NULLS LAST;

-- 9. Create function to calculate engagement scores
CREATE OR REPLACE FUNCTION calculate_engagement_score(user_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    engagement_score DECIMAL := 0;
    activity_count INTEGER;
    study_time INTEGER;
    login_streak INTEGER;
    days_since_creation INTEGER;
BEGIN
    -- Get recent activity count (last 30 days)
    SELECT COUNT(*) INTO activity_count
    FROM user_activity 
    WHERE user_id = user_uuid 
    AND created_at >= NOW() - INTERVAL '30 days';
    
    -- Get study time (last 30 days)
    SELECT COALESCE(SUM(duration), 0) INTO study_time
    FROM study_sessions 
    WHERE user_id = user_uuid 
    AND started_at >= NOW() - INTERVAL '30 days';
    
    -- Calculate login streak (consecutive days)
    SELECT COUNT(DISTINCT DATE(created_at)) INTO login_streak
    FROM user_activity 
    WHERE user_id = user_uuid 
    AND created_at >= NOW() - INTERVAL '7 days';
    
    -- Get days since creation
    SELECT EXTRACT(DAYS FROM (NOW() - created_at)) INTO days_since_creation
    FROM profiles 
    WHERE id = user_uuid;
    
    -- Calculate engagement score (0-100)
    -- Activity frequency: 40 points
    engagement_score := LEAST(40, activity_count * 8);
    
    -- Study time: 30 points (1 point per 2 minutes, max 30)
    engagement_score := engagement_score + LEAST(30, study_time / 2);
    
    -- Login consistency: 20 points
    engagement_score := engagement_score + LEAST(20, login_streak * 3);
    
    -- Account age bonus: 10 points
    IF days_since_creation > 30 THEN
        engagement_score := engagement_score + 10;
    END IF;
    
    RETURN LEAST(100, engagement_score);
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to update engagement scores for all users
CREATE OR REPLACE FUNCTION update_all_engagement_scores()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT id FROM profiles WHERE role = 'student'
    LOOP
        INSERT INTO user_engagement_scores (user_id, engagement_score, activity_frequency, study_time_minutes, login_streak, last_calculated)
        VALUES (
            user_record.id,
            calculate_engagement_score(user_record.id),
            (SELECT COUNT(*) FROM user_activity WHERE user_id = user_record.id AND created_at >= NOW() - INTERVAL '30 days'),
            (SELECT COALESCE(SUM(duration), 0) FROM study_sessions WHERE user_id = user_record.id AND started_at >= NOW() - INTERVAL '30 days'),
            (SELECT COUNT(DISTINCT DATE(created_at)) FROM user_activity WHERE user_id = user_record.id AND created_at >= NOW() - INTERVAL '7 days'),
            NOW()
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET
            engagement_score = EXCLUDED.engagement_score,
            activity_frequency = EXCLUDED.activity_frequency,
            study_time_minutes = EXCLUDED.study_time_minutes,
            login_streak = EXCLUDED.login_streak,
            last_calculated = EXCLUDED.last_calculated,
            updated_at = NOW();
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 11. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON churn_risk_summary TO authenticated;

-- ========================================
-- Churn Reduction System Schema Complete
-- ========================================
