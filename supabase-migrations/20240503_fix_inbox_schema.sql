-- COMMUNICATIONS HUB: MESSAGES SCHEMA
-- Fixes the "Inbox Crushing" bug by ensuring the table and RLS policies exist.

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 1. Users can view messages they sent or received
CREATE POLICY "Users can view their own messages" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- 2. Users can send messages
CREATE POLICY "Users can insert messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 3. Recipients can mark messages as read
CREATE POLICY "Recipients can update message status" ON public.messages
    FOR UPDATE USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Grant permissions
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
