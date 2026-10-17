DROP FUNCTION public.tellher_constellation();
CREATE FUNCTION public.tellher_constellation()
 RETURNS TABLE(id uuid, category text, excerpt text, created_at timestamp with time zone, echo_level integer, has_outcome boolean, has_letters boolean, reply_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT f.id, f.category, left(f.body, 140), f.created_at,
    CASE WHEN e.c IS NULL THEN 0 WHEN e.c < 3 THEN 1 WHEN e.c < 6 THEN 2 ELSE 3 END,
    EXISTS (SELECT 1 FROM ripple_outcomes o WHERE o.question_id = f.id AND (o.shared OR f.is_mine)),
    EXISTS (SELECT 1 FROM ripple_letters l WHERE l.question_id = f.id),
    (SELECT count(*)::int FROM replies r WHERE r.question_id = f.id)
  FROM public.tellher_feed() f
  LEFT JOIN (SELECT question_id, count(*) AS c FROM ripple_echoes GROUP BY question_id) e ON e.question_id = f.id;
$function$;