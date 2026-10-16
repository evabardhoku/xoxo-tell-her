ALTER TABLE public.profiles
 ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}',
 ADD COLUMN IF NOT EXISTS occupation text,
 ADD COLUMN IF NOT EXISTS known_for text[] NOT NULL DEFAULT '{}',
 ADD COLUMN IF NOT EXISTS ask_me_about text[] NOT NULL DEFAULT '{}',
 ADD COLUMN IF NOT EXISTS discoverability text NOT NULL DEFAULT 'direct';
ALTER TABLE public.profiles ADD CONSTRAINT profiles_discoverability_check CHECK (discoverability IN ('direct','extended','community'));

CREATE OR REPLACE FUNCTION public.validate_tellher_profile_details()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $$
DECLARE arr text[]; t text;
BEGIN
 NEW.occupation := nullif(btrim(NEW.occupation), '');
 IF NEW.occupation IS NOT NULL AND length(NEW.occupation) > 120 THEN RAISE EXCEPTION 'Occupation is too long'; END IF;
 FOREACH arr SLICE 1 IN ARRAY ARRAY[NEW.languages, NEW.known_for, NEW.ask_me_about]::text[][] LOOP NULL; END LOOP;
 IF cardinality(NEW.languages) > 8 OR cardinality(NEW.known_for) > 8 OR cardinality(NEW.ask_me_about) > 8 THEN RAISE EXCEPTION 'Up to 8 items per list'; END IF;
 FOREACH t IN ARRAY NEW.languages || NEW.known_for || NEW.ask_me_about LOOP
  IF t IS NULL OR length(btrim(t)) = 0 OR length(t) > 40 THEN RAISE EXCEPTION 'Each item must be 1-40 characters'; END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_tellher_profile_details BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_tellher_profile_details();

-- Safe, viewer-checked member profile. Returns no row when the viewer may not see it.
CREATE OR REPLACE FUNCTION public.tellher_member_profile(_id uuid)
RETURNS TABLE(first_name text, last_name text, city text, country text, bio text, languages text[], occupation text, known_for text[], ask_me_about text[], has_avatar boolean, relation text, via text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE me uuid := auth.uid(); p profiles; rel text; v text; allowed boolean;
BEGIN
 IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
 SELECT * INTO p FROM profiles WHERE id = _id AND woman_attested_at IS NOT NULL;
 IF NOT FOUND THEN RETURN; END IF;
 -- Viewer-side context: who she is to me.
 IF _id = me THEN rel := 'self';
 ELSIF EXISTS (SELECT 1 FROM trust_connections WHERE requester_id = me AND recipient_id = _id AND status = 'accepted') THEN rel := 'direct';
 ELSE
  SELECT m.first_name INTO v FROM trust_connections a JOIN trust_connections b ON b.requester_id = a.recipient_id AND b.recipient_id = _id AND b.status = 'accepted'
   JOIN profiles m ON m.id = a.recipient_id WHERE a.requester_id = me AND a.status = 'accepted' ORDER BY m.first_name LIMIT 1;
  rel := CASE WHEN v IS NOT NULL THEN 'extended' ELSE 'community' END;
 END IF;
 -- Owner-side permission: her discoverability setting, judged from her trust.
 allowed := rel = 'self' OR p.discoverability = 'community'
  OR EXISTS (SELECT 1 FROM trust_connections WHERE requester_id = _id AND recipient_id = me AND status = 'accepted')
  OR (p.discoverability = 'extended' AND EXISTS (SELECT 1 FROM trust_connections a JOIN trust_connections b ON b.requester_id = a.recipient_id AND b.recipient_id = me AND b.status = 'accepted' WHERE a.requester_id = _id AND a.status = 'accepted'));
 IF NOT allowed THEN RETURN; END IF;
 RETURN QUERY SELECT p.first_name,
  CASE WHEN rel IN ('self','direct') THEN p.last_name ELSE left(p.last_name, 1) END,
  p.city, p.country, p.bio, p.languages, p.occupation, p.known_for, p.ask_me_about, p.avatar_path IS NOT NULL, rel, v;
END $$;
REVOKE ALL ON FUNCTION public.tellher_member_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_member_profile(uuid) TO authenticated, service_role;

DROP FUNCTION public.tellher_my_circle();
CREATE FUNCTION public.tellher_my_circle()
RETURNS TABLE(connection_id uuid, kind text, first_name text, last_initial text, city text, created_at timestamp with time zone, member_id uuid)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN QUERY
    SELECT t.id, CASE WHEN t.status = 'accepted' THEN 'direct' ELSE 'outgoing' END, p.first_name, left(p.last_name,1), p.city, t.created_at, p.id
      FROM trust_connections t JOIN profiles p ON p.id = t.recipient_id
      WHERE t.requester_id = auth.uid() AND t.status IN ('pending','accepted')
    UNION ALL
    SELECT t.id, 'incoming', p.first_name, left(p.last_name,1), p.city, t.created_at, p.id
      FROM trust_connections t JOIN profiles p ON p.id = t.requester_id
      WHERE t.recipient_id = auth.uid() AND t.status = 'pending';
END $function$;
REVOKE ALL ON FUNCTION public.tellher_my_circle() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_my_circle() TO authenticated, service_role;