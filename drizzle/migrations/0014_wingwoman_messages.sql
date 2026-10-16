CREATE TABLE public.wingwoman_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 session_id uuid NOT NULL REFERENCES public.wingwoman_sessions(id) ON DELETE CASCADE,
 owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 role text NOT NULL CHECK (role IN ('user','assistant')),
 content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 6000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX wingwoman_messages_session_idx ON public.wingwoman_messages(session_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.wingwoman_messages TO authenticated;
GRANT ALL ON public.wingwoman_messages TO service_role;
ALTER TABLE public.wingwoman_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads own wingwoman messages" ON public.wingwoman_messages FOR SELECT TO authenticated USING (owner_id = (SELECT auth.uid()));
CREATE POLICY "Owner adds messages to own sessions" ON public.wingwoman_messages FOR INSERT TO authenticated WITH CHECK (public.tellher_member_ready() AND owner_id = (SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.wingwoman_sessions s WHERE s.id = session_id AND s.owner_id = (SELECT auth.uid())));
CREATE POLICY "Owner deletes own wingwoman messages" ON public.wingwoman_messages FOR DELETE TO authenticated USING (owner_id = (SELECT auth.uid()));