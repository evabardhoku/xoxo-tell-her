-- Discoverable second-degree members only. Optional _via narrows to members reached through one of my Direct Circle members.
CREATE OR REPLACE FUNCTION public.tellher_extended_circle(_via uuid DEFAULT NULL)
RETURNS TABLE(member_id uuid, first_name text, last_initial text, city text, country text, known_for text[], ask_me_about text[], has_avatar boolean, via text, via_id uuid, bridge_pending boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE me uuid := auth.uid();
BEGIN
 IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
 RETURN QUERY
 SELECT DISTINCT ON (p.id) p.id, p.first_name, left(p.last_name,1), p.city, p.country, p.known_for, p.ask_me_about, p.avatar_path IS NOT NULL,
  m.first_name, m.id,
  EXISTS (SELECT 1 FROM trust_connections t WHERE t.requester_id = me AND t.recipient_id = p.id AND t.status = 'pending')
 FROM trust_connections a
 JOIN trust_connections b ON b.requester_id = a.recipient_id AND b.status = 'accepted'
 JOIN profiles m ON m.id = a.recipient_id
 JOIN profiles p ON p.id = b.recipient_id
 WHERE a.requester_id = me AND a.status = 'accepted'
  AND (_via IS NULL OR a.recipient_id = _via)
  AND p.id <> me AND p.woman_attested_at IS NOT NULL
  AND p.discoverability IN ('extended','community')
  AND NOT EXISTS (SELECT 1 FROM trust_connections d WHERE d.requester_id = me AND d.recipient_id = p.id AND d.status = 'accepted')
 ORDER BY p.id, m.first_name;
END $$;
REVOKE ALL ON FUNCTION public.tellher_extended_circle(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_extended_circle(uuid) TO authenticated, service_role;

-- Same rule for opening her profile: Extended discovery also covers viewers two steps away from her through the viewer's Direct Circle.
CREATE OR REPLACE FUNCTION public.tellher_member_profile(_id uuid)
RETURNS TABLE(first_name text, last_name text, city text, country text, bio text, languages text[], occupation text, known_for text[], ask_me_about text[], has_avatar boolean, relation text, via text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE me uuid := auth.uid(); p profiles; rel text; v text; allowed boolean;
BEGIN
 IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
 SELECT * INTO p FROM profiles WHERE id = _id AND woman_attested_at IS NOT NULL;
 IF NOT FOUND THEN RETURN; END IF;
 IF _id = me THEN rel := 'self';
 ELSIF EXISTS (SELECT 1 FROM trust_connections WHERE requester_id = me AND recipient_id = _id AND status = 'accepted') THEN rel := 'direct';
 ELSE
  SELECT m.first_name INTO v FROM trust_connections a JOIN trust_connections b ON b.requester_id = a.recipient_id AND b.recipient_id = _id AND b.status = 'accepted'
   JOIN profiles m ON m.id = a.recipient_id WHERE a.requester_id = me AND a.status = 'accepted' ORDER BY m.first_name LIMIT 1;
  rel := CASE WHEN v IS NOT NULL THEN 'extended' ELSE 'community' END;
 END IF;
 allowed := rel = 'self' OR p.discoverability = 'community'
  OR EXISTS (SELECT 1 FROM trust_connections WHERE requester_id = _id AND recipient_id = me AND status = 'accepted')
  OR (p.discoverability = 'extended' AND rel = 'extended')
  OR (p.discoverability = 'extended' AND EXISTS (SELECT 1 FROM trust_connections a JOIN trust_connections b ON b.requester_id = a.recipient_id AND b.recipient_id = me AND b.status = 'accepted' WHERE a.requester_id = _id AND a.status = 'accepted'));
 IF NOT allowed THEN RETURN; END IF;
 RETURN QUERY SELECT p.first_name,
  CASE WHEN rel IN ('self','direct') THEN p.last_name ELSE left(p.last_name, 1) END,
  p.city, p.country, p.bio, p.languages, p.occupation, p.known_for, p.ask_me_about, p.avatar_path IS NOT NULL, rel, v;
END $$;