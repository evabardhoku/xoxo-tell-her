CREATE OR REPLACE FUNCTION public.tellher_question(_id uuid)
RETURNS TABLE(id uuid, category text, body text, audience_scope text, created_at timestamptz, is_mine boolean, my_instinct text, my_note text, my_reply_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
SELECT q.id, q.category, q.body, q.audience_scope, q.created_at, (m.owner_id = auth.uid()),
CASE WHEN m.owner_id = auth.uid() THEN m.initial_instinct END,
CASE WHEN m.owner_id = auth.uid() THEN m.instinct_note END,
(SELECT r.id FROM public.replies r WHERE r.question_id = q.id AND r.author_id = auth.uid() ORDER BY r.created_at, r.id LIMIT 1)
FROM public.questions q JOIN public.question_private_meta m ON m.question_id = q.id
WHERE q.id = _id AND public.tellher_can_view(_id)
$function$;
REVOKE ALL ON FUNCTION public.tellher_question(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_question(uuid) TO authenticated;