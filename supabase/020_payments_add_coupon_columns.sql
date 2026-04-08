-- ============================================================================
-- 020: Add missing columns to payments table (coupon_id, item_type, item_id)
-- ============================================================================
-- The payments initiate API writes these columns but they were never added
-- to the original payments-migration.sql table definition.
-- Run this in Supabase SQL Editor.
-- ============================================================================

-- Add coupon reference (nullable — most payments have no coupon)
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL;

-- Add item_type to distinguish subscription vs one-time purchases vs monitoring
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'subscription';

-- Add item_id for one-time purchasable items (past papers, resource packs, etc.)
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS item_id TEXT;

-- Index for coupon usage lookups
CREATE INDEX IF NOT EXISTS idx_payments_coupon_id ON public.payments (coupon_id)
  WHERE coupon_id IS NOT NULL;
