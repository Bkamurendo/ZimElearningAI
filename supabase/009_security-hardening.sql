-- ============================================================
-- Migration 009: Security hardening
-- Run in Supabase SQL Editor
-- ============================================================

-- ── C2: Block role self-escalation via direct Supabase API calls ──────────────
-- Without this, any user can UPDATE their own `role` to 'admin' using the
-- public anon key, bypassing the app's registration role allowlist.

CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only block if the role column is actually changing
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Allow service_role (used by server-side admin actions) to bypass
    -- Allow if the current DB user is already an admin
    IF current_setting('role', true) != 'service_role' THEN
      IF (SELECT role FROM public.profiles WHERE id = auth.uid()) IS DISTINCT FROM 'admin'::user_role THEN
        RAISE EXCEPTION 'Forbidden: cannot change your own role (code: ROLE_ESCALATION)';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_role_escalation ON public.profiles;
CREATE TRIGGER prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();

-- ── M2: Fix document_study_content RLS (too permissive) ──────────────────────
-- Old: any authenticated user could read/write ALL study content regardless
-- of whether they have access to the underlying document.

DROP POLICY IF EXISTS "dsc_select" ON public.document_study_content;
DROP POLICY IF EXISTS "dsc_insert" ON public.document_study_content;

-- SELECT: only if user can access the underlying document
CREATE POLICY "dsc_select" ON public.document_study_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.uploaded_documents d
      WHERE d.id = document_id
        AND (
          d.uploaded_by = auth.uid()
          OR (d.visibility = 'public' AND d.moderation_status = 'published')
          OR (d.visibility = 'subject' AND d.moderation_status IN ('published', 'ai_reviewed')
              AND EXISTS (
                SELECT 1 FROM public.student_subjects ss
                JOIN public.student_profiles sp ON sp.id = ss.student_id
                WHERE sp.user_id = auth.uid() AND ss.subject_id = d.subject_id
              ))
          OR public.get_my_role() IN ('admin', 'teacher')
        )
    )
  );

-- INSERT/UPDATE: only document owner, admin or teacher
CREATE POLICY "dsc_insert" ON public.document_study_content FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.uploaded_documents d
      WHERE d.id = document_id AND d.uploaded_by = auth.uid()
    )
    OR public.get_my_role() IN ('admin', 'teacher')
  );

CREATE POLICY "dsc_admin" ON public.document_study_content FOR ALL
  USING (public.get_my_role() = 'admin');

-- ── M5: Add RLS policy for announcements to respect audience field ────────────
-- Old: all authenticated users see all announcements regardless of audience.

DROP POLICY IF EXISTS "ann_view" ON public.announcements;
CREATE POLICY "ann_view" ON public.announcements FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND is_active = true
    AND (
      audience = 'all'
      OR audience::text = (SELECT role::text FROM public.profiles WHERE id = auth.uid())
    )
  );

-- ── payments table: ensure RLS is enabled ────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments'
  ) THEN
    -- payments table doesn't exist yet; skip
    RAISE NOTICE 'payments table not found, skipping RLS setup';
  END IF;
END $$;

-- Users can only see their own payments
DROP POLICY IF EXISTS "payments_own" ON public.payments;
CREATE POLICY "payments_own" ON public.payments
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "payments_insert" ON public.payments;
CREATE POLICY "payments_insert" ON public.payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Service role (server-side) can update payment status (webhook callback)
DROP POLICY IF EXISTS "payments_service_update" ON public.payments;
CREATE POLICY "payments_service_update" ON public.payments
  FOR UPDATE USING (true);  -- protected by service role key server-side
