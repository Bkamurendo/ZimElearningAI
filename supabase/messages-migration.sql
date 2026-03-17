-- ============================================================
-- ZimLearn — Messages Table Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Messages table
CREATE TABLE IF NOT EXISTS messages (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id   UUID        REFERENCES subjects(id) ON DELETE SET NULL,
  content      TEXT        NOT NULL,
  read         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS messages_recipient_idx  ON messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_idx     ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_unread_idx     ON messages(recipient_id, read) WHERE read = FALSE;

-- 3. Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Sender and recipient can both read
CREATE POLICY "messages_select"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Only sender can insert (and sender_id must equal their own uid)
CREATE POLICY "messages_insert"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Only recipient can update (to mark as read)
CREATE POLICY "messages_update"
  ON messages FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- No deletes (messages are permanent for audit trail)

-- ============================================================
-- Done. Messages table is ready.
-- ============================================================
