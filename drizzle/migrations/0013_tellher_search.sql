-- Global search composed only from existing viewer-checked functions: tellher_member_profile, tellher_member_shelf, tellher_feed.
-- Matches only fields those functions already return to this viewer; never emails, instincts, notes-to-self, authors or Wingwoman.
CREATE OR REPLACE FUNCTION public.tellher_search(_q text)
RETURNS TABLE(kind text, id uuid, title text, body text, category text, location text, created_at timestamptz, member_id uuid, member_name text, relation text, known_for text[], has_avatar boolean, reply_count integer, audience_scope text, rank integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE me uuid := auth.uid(); pat text;
BEGIN
 IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
 _q := btrim(coalesce(_q, ''));
 IF length(_q) < 2 OR length(_q) > 80 THEN RETURN; END IF;
 pat := '%' || replace(replace(replace(_q, '\', '\\'), '%', '\%'), '_', '\_') || '%';
 RETURN QUERY
 WITH visible AS (
  SELECT p.id AS pid, mp.* FROM profiles p CROSS JOIN LATERAL public.tellher_member_profile(p.id) mp WHERE p.id <> me
 ), people AS (
  SELECT 'person'::text, v.pid, (v.first_name || ' ' || v.last_name), v.bio, v.occupation, concat_ws(', ', v.city, v.country), NULL::timestamptz, v.pid, v.first_name, v.relation, v.known_for, v.has_avatar, NULL::int, NULL::text,
   CASE v.relation WHEN 'direct' THEN 0 WHEN 'extended' THEN 1 ELSE 2 END * 10
    + CASE WHEN array_to_string(v.known_for || v.ask_me_about, ' ') ILIKE pat THEN 0 ELSE 1 END
  FROM visible v
  WHERE (v.first_name || ' ' || v.last_name) ILIKE pat OR concat_ws(' ', v.city, v.country) ILIKE pat OR coalesce(v.occupation,'') ILIKE pat
   OR array_to_string(v.known_for || v.ask_me_about, ' ') ILIKE pat
 ), shelf AS (
  SELECT s.kind, s.id, s.title, s.body, s.category, s.location, s.created_at, v.pid, v.first_name, v.relation, NULL::text[], NULL::boolean, NULL::int, NULL::text,
   CASE v.relation WHEN 'direct' THEN 0 WHEN 'extended' THEN 1 ELSE 2 END * 10 + CASE WHEN s.category ILIKE pat THEN 0 ELSE 1 END
  FROM visible v CROSS JOIN LATERAL public.tellher_member_shelf(v.pid) s
  WHERE s.title ILIKE pat OR s.body ILIKE pat OR s.category ILIKE pat OR coalesce(s.location,'') ILIKE pat
 ), own AS (
  SELECT s.kind, s.id, s.title, s.body, s.category, s.location, s.created_at, me, 'You'::text, 'self'::text, NULL::text[], NULL::boolean, NULL::int, NULL::text, 30
  FROM public.tellher_member_shelf(me) s
  WHERE s.title ILIKE pat OR s.body ILIKE pat OR s.category ILIKE pat OR coalesce(s.location,'') ILIKE pat
 ), qs AS (
  SELECT 'question'::text, f.id, NULL::text, f.body, f.category, NULL::text, f.created_at, NULL::uuid, NULL::text, NULL::text, NULL::text[], NULL::boolean, f.reply_count, f.audience_scope,
   CASE f.audience_scope WHEN 'circle' THEN 0 WHEN 'extended' THEN 1 ELSE 2 END * 10 + CASE WHEN f.category ILIKE pat THEN 0 ELSE 1 END
  FROM public.tellher_feed() f
  WHERE f.body ILIKE pat OR f.category ILIKE pat
 )
 SELECT * FROM (SELECT * FROM people UNION ALL SELECT * FROM shelf UNION ALL SELECT * FROM own UNION ALL SELECT * FROM qs) r
 ORDER BY 15, 7 DESC NULLS LAST LIMIT 80;
END $$;
REVOKE ALL ON FUNCTION public.tellher_search(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_search(text) TO authenticated, service_role;