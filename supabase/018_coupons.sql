-- ── Coupons & discount code system ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- e.g. 'ZIMLEARN50', 'SCHOOL2025'
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed_usd')),
  discount_value NUMERIC(10,2) NOT NULL, -- 50 means 50% off or $50 off
  max_uses INT DEFAULT NULL, -- NULL = unlimited
  uses_count INT DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ DEFAULT NULL, -- NULL = never expires
  applies_to TEXT[] DEFAULT '{}', -- plan IDs it applies to, empty = all plans
  min_amount_usd NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupon_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT,
  amount_saved_usd NUMERIC(10,2),
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coupon_id, user_id) -- one use per user per coupon
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_uses ENABLE ROW LEVEL SECURITY;

-- Admins can do everything; anyone authenticated can read active coupons for validation
CREATE POLICY "coupons_admin_all" ON coupons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "coupons_read_active" ON coupons FOR SELECT USING (
  is_active = TRUE AND auth.uid() IS NOT NULL
);

CREATE POLICY "coupon_uses_own" ON coupon_uses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "coupon_uses_insert" ON coupon_uses FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can view all coupon uses
CREATE POLICY "coupon_uses_admin_all" ON coupon_uses FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RPC to atomically increment uses_count
CREATE OR REPLACE FUNCTION increment_coupon_uses_count(p_coupon_id UUID)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE coupons SET uses_count = uses_count + 1 WHERE id = p_coupon_id;
$$;

-- Seed some starter coupons
INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, valid_until, applies_to, is_active)
VALUES
  ('ZIMLEARN50', '50% off for early adopters', 'percent', 50, 100, '2026-12-31', '{}', true),
  ('SCHOOL2025', '$20 off school plans', 'fixed_usd', 20, 50, '2026-06-30', ARRAY['school_basic_monthly','school_pro_monthly'], true),
  ('STUDENT10', '10% student discount', 'percent', 10, NULL, NULL, ARRAY['pro_monthly','pro_yearly'], true),
  ('BOOTCAMP25', '25% off exam bootcamp', 'percent', 25, 200, '2026-12-31', ARRAY['bootcamp_2week','bootcamp_4week'], true)
ON CONFLICT (code) DO NOTHING;
