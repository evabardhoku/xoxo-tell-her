-- Constellations: composes only Ripples the viewer can already open (tellher_feed), adding coarse Echo buckets
-- (exact counts never below the threshold) and whether a visible outcome exists. No author identity.
CREATE OR REPLACE FUNCTION public.tellher_constellation() RETURNS TABLE(id uuid, category text, excerpt text, created_at timestamptz, echo_level integer, has_outcome boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.id, f.category, left(f.body, 140), f.created_at,
    CASE WHEN e.c IS NULL THEN 0 WHEN e.c < 3 THEN 1 WHEN e.c < 6 THEN 2 ELSE 3 END,
    EXISTS (SELECT 1 FROM ripple_outcomes o WHERE o.question_id = f.id AND (o.shared OR f.is_mine))
  FROM public.tellher_feed() f
  LEFT JOIN (SELECT question_id, count(*) AS c FROM ripple_echoes GROUP BY question_id) e ON e.question_id = f.id;
$$;
REVOKE ALL ON FUNCTION public.tellher_constellation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_constellation() TO authenticated;