-- ========================================
-- Admin Module Features - Database Schema
-- ========================================
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Enhanced User Activity Tracking
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_user_activity_user_id (user_id),
    INDEX idx_user_activity_type (activity_type),
    INDEX idx_user_activity_created_at (created_at)
);

-- 2. Study Time Tracking
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    duration INTEGER NOT NULL, -- in minutes
    session_type VARCHAR(50) DEFAULT 'study',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_study_sessions_user_id (user_id),
    INDEX idx_study_sessions_subject_id (subject_id),
    INDEX idx_study_sessions_date (DATE(started_at))
);

-- 3. Feature Usage Tracking
CREATE TABLE IF NOT EXISTS feature_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    feature VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, feature),
    INDEX idx_feature_usage_user_id (user_id),
    INDEX idx_feature_usage_feature (feature)
);

-- 4. Content Management Enhancements
ALTER TABLE uploaded_documents ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE uploaded_documents ADD COLUMN IF NOT EXISTS moderator_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE uploaded_documents ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE uploaded_documents ADD COLUMN IF NOT EXISTS ai_review BOOLEAN DEFAULT FALSE;
ALTER TABLE uploaded_documents ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'document';
ALTER TABLE uploaded_documents ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE uploaded_documents ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

-- 5. School/Institution Management
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) DEFAULT 'secondary', -- primary, secondary, tertiary
    province VARCHAR(100),
    district VARCHAR(100),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_schools_code (code),
    INDEX idx_schools_status (status)
);

CREATE TABLE IF NOT EXISTS school_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    license_type VARCHAR(50) NOT NULL, -- basic, premium, enterprise
    student_limit INTEGER,
    teacher_limit INTEGER,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, expired, suspended
    price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_school_licenses_school_id (school_id),
    INDEX idx_school_licenses_status (status),
    INDEX idx_school_licenses_dates (start_date, end_date)
);

CREATE TABLE IF NOT EXISTS school_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    grade VARCHAR(50),
    class VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, student_id),
    INDEX idx_school_students_school_id (school_id),
    INDEX idx_school_students_student_id (student_id)
);

-- 6. Communications Hub
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general', -- general, maintenance, feature, urgent
    audience VARCHAR(50) DEFAULT 'all', -- all, students, teachers, admins
    priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high, urgent
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, published, archived
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_announcements_status (status),
    INDEX idx_announcements_audience (audience),
    INDEX idx_announcements_published (published_at)
);

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(50) DEFAULT 'normal',
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved, closed
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    INDEX idx_support_tickets_user_id (user_id),
    INDEX idx_support_tickets_status (status),
    INDEX idx_support_tickets_priority (priority)
);

-- 7. Security & Audit Trail
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_security_events_user_id (user_id),
    INDEX idx_security_events_type (event_type),
    INDEX idx_security_events_created_at (created_at),
    INDEX idx_security_events_success (success)
);

-- 8. Admin Activity Log
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_admin_activity_admin_id (admin_id),
    INDEX idx_admin_activity_action (action),
    INDEX idx_admin_activity_created_at (created_at)
);

-- 9. AI Insights & Analytics
CREATE TABLE IF NOT EXISTS ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_type VARCHAR(50) NOT NULL, -- churn, revenue, performance
    target_id UUID, -- user_id, school_id, etc.
    prediction JSONB NOT NULL,
    confidence DECIMAL(3,2), -- 0.00 to 1.00
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_ai_predictions_type (prediction_type),
    INDEX idx_ai_predictions_target (target_id),
    INDEX idx_ai_predictions_status (status)
);

-- 10. System Metrics & Monitoring
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    metric_unit VARCHAR(20),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    INDEX idx_system_metrics_name (metric_name),
    INDEX idx_system_metrics_timestamp (timestamp)
);

-- 11. Add missing columns to existing profiles table if they don't exist
DO $$
BEGIN
    -- Check and add columns to profiles table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE profiles ADD COLUMN phone VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_sign_in_at') THEN
        ALTER TABLE profiles ADD COLUMN last_sign_in_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trial_ends_at') THEN
        ALTER TABLE profiles ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_expires_at') THEN
        ALTER TABLE profiles ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 12. Create sample data for testing (optional)
INSERT INTO schools (name, code, type, province, status) VALUES
('Harare High School', 'HHS001', 'secondary', 'Harare', 'active'),
('Bulawayo Technical College', 'BTC001', 'tertiary', 'Bulawayo', 'active'),
('St. Marys Primary School', 'SMPS001', 'primary', 'Mashonaland East', 'active')
ON CONFLICT (code) DO NOTHING;

-- 13. Create RLS (Row Level Security) policies
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- 14. Create admin-only policies
CREATE POLICY "Admins can view all user activity" ON user_activity
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage schools" ON schools
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Add similar policies for other admin tables...

-- 15. Create functions for automated trial management
CREATE OR REPLACE FUNCTION check_trial_expirations()
RETURNS TRIGGER AS $$
BEGIN
    -- This function can be called by a cron job to check expiring trials
    -- Implementation would go here
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 16. Create views for admin reports
CREATE OR REPLACE VIEW admin_trial_summary AS
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.plan,
    p.trial_ends_at,
    CASE 
        WHEN p.trial_ends_at > NOW() THEN 'active'
        WHEN p.trial_ends_at <= NOW() THEN 'expired'
        ELSE 'unknown'
    END as trial_status,
    CASE 
        WHEN p.trial_ends_at > NOW() 
        THEN EXTRACT(DAYS FROM p.trial_ends_at - NOW())
        ELSE 0
    END as days_remaining
FROM profiles p
WHERE p.role = 'student' 
AND p.trial_ends_at IS NOT NULL
ORDER BY p.trial_ends_at;

-- 17. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON admin_trial_summary TO authenticated;

-- ========================================
-- Migration Complete
-- ========================================
-- After running this script, restart your development server
-- and the admin features should work properly
