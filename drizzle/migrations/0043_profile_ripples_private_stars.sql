CREATE FUNCTION public.tellher_member_ripples(_member uuid)
RETURNS TABLE(id uuid, category text, body text, audience_scope text, created_at timestamptz, reply_count integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.tellher_member_profile(_member)) THEN RETURN; END IF;
 RETURN QUERY SELECT q.id, q.category, q.body, q.audience_scope, q.created_at,
 (SELECT count(*)::integer FROM public.replies r WHERE r.question_id = q.id)
 FROM public.questions q JOIN public.question_private_meta m ON m.question_id = q.id
 WHERE m.owner_id = _member AND q.author_visibility = 'named' AND public.tellher_can_view(q.id)
 ORDER BY q.created_at DESC;
END $$;
REVOKE ALL ON FUNCTION public.tellher_member_ripples(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_member_ripples(uuid) TO authenticated;
COMMENT ON FUNCTION public.tellher_member_ripples(uuid) IS 'Named-only profile discussions; profile access and original checked publication audience are both required. No anonymous ownership or private instincts returned.';
CREATE FUNCTION public.tellher_my_stars()
RETURNS TABLE(id uuid, category text, body text, audience_scope text, created_at timestamptz, reply_count integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
 RETURN QUERY SELECT q.id, q.category, q.body, q.audience_scope, q.created_at,
 (SELECT count(*)::integer FROM public.replies r WHERE r.question_id = q.id)
 FROM public.questions q JOIN public.question_private_meta m ON m.question_id = q.id
 WHERE m.owner_id = auth.uid() AND q.author_visibility = 'anonymous' AND public.tellher_can_view(q.id)
 ORDER BY q.created_at DESC;
END $$;
REVOKE ALL ON FUNCTION public.tellher_my_stars() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_my_stars() TO authenticated;
COMMENT ON FUNCTION public.tellher_my_stars() IS 'Owner-only anonymous discussion index for private Wingwoman; accepts no target member identifier.';