-- ─────────────────────────────────────────────────────────────────────────────
-- Payments table — tracks EcoCash / Paynow transactions
-- Run this in the Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payments (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id           TEXT        NOT NULL,                       -- 'pro_monthly' | 'pro_quarterly' | 'pro_yearly'
  amount_usd        NUMERIC(10,2) NOT NULL,
  method            TEXT        NOT NULL DEFAULT 'ecocash',     -- 'ecocash' | 'onemoney' | 'innbucks' | 'web'
  phone             TEXT,                                        -- payer phone (mobile money only)
  paynow_reference  TEXT,                                        -- Paynow's own transaction ref
  poll_url          TEXT,                                        -- URL to poll for status updates
  status            TEXT        NOT NULL DEFAULT 'pending'       -- 'pending' | 'paid' | 'failed' | 'cancelled'
    CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at           TIMESTAMPTZ
);

-- Index for quick user payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON public.payments (status);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payments
CREATE POLICY "Users read own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- Server (service role) inserts/updates payments via API routes — no policy needed for INSERT/UPDATE
-- Admin can see all payments
CREATE POLICY "Admins read all payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
