CREATE TABLE public.trusted_picks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 2 AND 120),
 category text NOT NULL CHECK (category IN ('Services','Food & Drink','Health & Care','Housing & Moving','Travel','Everyday Life')),
 note text NOT NULL CHECK (char_length(btrim(note)) BETWEEN 5 AND 500),
 location text CHECK (location IS NULL OR char_length(location) <= 120),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.trusted_picks TO authenticated;
GRANT ALL ON public.trusted_picks TO service_role;
ALTER TABLE public.trusted_picks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads own picks" ON public.trusted_picks FOR SELECT TO authenticated USING (public.tellher_member_ready() AND owner_id = (select auth.uid()));
CREATE POLICY "Owner adds own picks" ON public.trusted_picks FOR INSERT TO authenticated WITH CHECK (public.tellher_member_ready() AND owner_id = (select auth.uid()));
CREATE POLICY "Owner deletes own picks" ON public.trusted_picks FOR DELETE TO authenticated USING (owner_id = (select auth.uid()));

CREATE OR REPLACE FUNCTION public.tellher_circle_picks()
RETURNS TABLE(id uuid, title text, category text, note text, location text, created_at timestamptz, recommender text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT p.id, p.title, p.category, p.note, p.location, p.created_at, pr.first_name
 FROM public.trust_connections t
 JOIN public.trusted_picks p ON p.owner_id = t.recipient_id
 JOIN public.profiles pr ON pr.id = p.owner_id
 WHERE public.tellher_member_ready() AND t.requester_id = auth.uid() AND t.status = 'accepted' AND t.recipient_id <> auth.uid()
 ORDER BY p.created_at DESC
 LIMIT 100
$$;
REVOKE ALL ON FUNCTION public.tellher_circle_picks() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_circle_picks() TO authenticated;