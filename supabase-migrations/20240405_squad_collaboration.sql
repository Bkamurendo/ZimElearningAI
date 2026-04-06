-- Squad Collaboration Infrastructure
-- 1. Squad Messages (Real-time Peer Chat)
CREATE TABLE IF NOT EXISTS public.squad_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id    UUID NOT NULL REFERENCES public.study_squads(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Squad Shared Resources (Collaborative Library)
CREATE TABLE IF NOT EXISTS public.squad_shared_resources (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id    UUID NOT NULL REFERENCES public.study_squads(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES public.uploaded_documents(id) ON DELETE SET NULL,
    note_id     UUID REFERENCES public.student_notes(id) ON DELETE SET NULL,
    title       TEXT NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.squad_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_shared_resources ENABLE ROW LEVEL SECURITY;

-- Only members can view/post messages
CREATE POLICY "Squad members can manage messages" ON public.squad_messages
FOR ALL USING (
    squad_id IN (SELECT squad_id FROM public.study_squad_members WHERE user_id = auth.uid())
);

-- Only members can view/manage resources
CREATE POLICY "Squad members can manage resources" ON public.squad_shared_resources
FOR ALL USING (
    squad_id IN (SELECT squad_id FROM public.study_squad_members WHERE user_id = auth.uid())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_squad_messages_squad ON public.squad_messages(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_resources_squad ON public.squad_shared_resources(squad_id);
