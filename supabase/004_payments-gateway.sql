-- ─────────────────────────────────────────────────────────────────────────────
-- Add gateway column to payments table
-- Tracks which payment processor was used: 'paynow' (EcoCash/Zimbabwe) or
-- 'flutterwave' (Visa/Mastercard/Google Pay/Apple Pay/international)
-- Run this in the Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS gateway TEXT NOT NULL DEFAULT 'paynow'
    CHECK (gateway IN ('paynow', 'flutterwave'));

-- Also ensure the INSERT policy exists (needed for client-side payment initiation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payments'
      AND policyname = 'Users insert own payments'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users insert own payments"
        ON public.payments FOR INSERT
        WITH CHECK (auth.uid() = user_id)
    $policy$;
  END IF;
END
$$;
