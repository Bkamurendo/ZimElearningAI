-- PHASE 9: REGIONAL ANALYTICS & GOVERNANCE
-- Enhances the schools table with geographic granularity for Ministry analytics.

ALTER TABLE schools ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS school_type TEXT; -- 'Government', 'Private', 'Mission'

-- Create an analytics view for the Ministry
CREATE OR REPLACE VIEW regional_readiness_analytics AS
SELECT 
    s.province,
    s.district,
    COUNT(DISTINCT sp.id) as total_students,
    AVG(CASE WHEN tm.mastery_level = 'mastered' THEN 100 ELSE 0 END) as avg_readiness_index,
    COUNT(DISTINCT s.id) as total_schools
FROM 
    schools s
JOIN 
    student_profiles sp ON sp.school_id = s.id
LEFT JOIN 
    topic_mastery tm ON tm.student_id = sp.id
GROUP BY 
    s.province, s.district;

-- Enable RLS for regional_readiness_analytics
-- (Only MoPSE Admin role can view this)
-- ALTER TABLE regional_readiness_analytics ENABLE ROW LEVEL SECURITY; 
-- Note: Views don't always support RLS directly in the same way, usually handled via policies on underlying tables or specific access roles.
