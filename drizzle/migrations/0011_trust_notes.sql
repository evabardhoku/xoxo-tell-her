CREATE TABLE public.trust_notes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 4 AND 140),
 body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 20 AND 3000),
 topic text NOT NULL CHECK (topic IN ('Work','Study','Housing & Moving','Travel','Health & Care','Money','Services','Everyday Life')),
 location text CHECK (location IS NULL OR char_length(location) <= 120),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 search tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(topic,'') || ' ' || coalesce(location,'') || ' ' || coalesce(body,''))) STORED
);
CREATE INDEX trust_notes_author_idx ON public.trust_notes(author_id, created_at DESC);
CREATE INDEX trust_notes_search_idx ON public.trust_notes USING gin(search);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trust_notes TO authenticated;
GRANT ALL ON public.trust_notes TO service_role;
ALTER TABLE public.trust_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Author reads own notes" ON public.trust_notes FOR SELECT TO authenticated USING (public.tellher_member_ready() AND author_id = (SELECT auth.uid()));
CREATE POLICY "Author adds own notes" ON public.trust_notes FOR INSERT TO authenticated WITH CHECK (public.tellher_member_ready() AND author_id = (SELECT auth.uid()));
CREATE POLICY "Author edits own notes" ON public.trust_notes FOR UPDATE TO authenticated USING (author_id = (SELECT auth.uid())) WITH CHECK (author_id = (SELECT auth.uid()));
CREATE POLICY "Author deletes own notes" ON public.trust_notes FOR DELETE TO authenticated USING (author_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_trust_note() RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $$
BEGIN NEW.updated_at := now(); NEW.author_id := OLD.author_id; NEW.created_at := OLD.created_at; RETURN NEW; END $$;
CREATE TRIGGER touch_trust_note BEFORE UPDATE ON public.trust_notes FOR EACH ROW EXECUTE FUNCTION public.touch_trust_note();

-- Trust Shelf: notes follow the owner's profile discoverability; picks keep their existing rule (only readers who trust the owner, or the owner).
CREATE OR REPLACE FUNCTION public.tellher_member_shelf(_id uuid)
RETURNS TABLE(kind text, id uuid, title text, body text, category text, location text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.tellher_member_profile(_id)) THEN RETURN; END IF;
 RETURN QUERY SELECT 'note'::text, n.id, n.title, n.body, n.topic, n.location, n.created_at FROM trust_notes n WHERE n.author_id = _id ORDER BY n.created_at DESC LIMIT 50;
 IF _id = auth.uid() OR EXISTS (SELECT 1 FROM trust_connections WHERE requester_id = auth.uid() AND recipient_id = _id AND status = 'accepted') THEN
  RETURN QUERY SELECT 'pick'::text, p.id, p.title, p.note, p.category, p.location, p.created_at FROM trusted_picks p WHERE p.owner_id = _id ORDER BY p.created_at DESC LIMIT 50;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.tellher_member_shelf(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_member_shelf(uuid) TO authenticated, service_role;