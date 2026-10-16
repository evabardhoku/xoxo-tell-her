DROP FUNCTION IF EXISTS public.tellher_constellation();
CREATE FUNCTION public.tellher_constellation()
RETURNS TABLE(id uuid, category text, excerpt text, created_at timestamptz, echo_level integer, has_outcome boolean, has_letters boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.id, f.category, left(f.body, 140), f.created_at,
    CASE WHEN e.c IS NULL THEN 0 WHEN e.c < 3 THEN 1 WHEN e.c < 6 THEN 2 ELSE 3 END,
    EXISTS (SELECT 1 FROM ripple_outcomes o WHERE o.question_id = f.id AND (o.shared OR f.is_mine)),
    EXISTS (SELECT 1 FROM ripple_letters l WHERE l.question_id = f.id)
  FROM public.tellher_feed() f
  LEFT JOIN (SELECT question_id, count(*) AS c FROM ripple_echoes GROUP BY question_id) e ON e.question_id = f.id;
$$;

-- Anonymous count of distinct women (askers, echoers, letter writers) behind the Ripples this viewer can see in one topic; hidden below 3.
CREATE OR REPLACE FUNCTION public.tellher_constellation_women(_category text) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH q AS (SELECT f.id FROM public.tellher_feed() f WHERE f.category = _category),
  w AS (
    SELECT m.owner_id AS who FROM question_private_meta m JOIN q ON q.id = m.question_id
    UNION SELECT e.member_id FROM ripple_echoes e JOIN q ON q.id = e.question_id
    UNION SELECT l.author_id FROM ripple_letters l JOIN q ON q.id = l.question_id)
  SELECT CASE WHEN count(*) >= 3 THEN count(*)::int END FROM w WHERE who <> auth.uid();
$$;

-- Letters across the Ripples this viewer can see in one topic; never includes the writer.
CREATE OR REPLACE FUNCTION public.tellher_topic_letters(_category text)
RETURNS TABLE(id uuid, question_id uuid, body text, where_now text, created_at timestamptz, mine boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.id, l.question_id, l.body, l.where_now, l.created_at, l.author_id = auth.uid()
  FROM ripple_letters l JOIN public.tellher_feed() f ON f.id = l.question_id
  WHERE f.category = _category ORDER BY l.created_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.tellher_constellation(), public.tellher_constellation_women(text), public.tellher_topic_letters(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.tellher_constellation(), public.tellher_constellation_women(text), public.tellher_topic_letters(text) TO authenticated;