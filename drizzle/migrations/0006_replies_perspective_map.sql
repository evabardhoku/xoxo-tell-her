CREATE UNIQUE INDEX IF NOT EXISTS replies_one_per_member ON public.replies (question_id, author_id);

CREATE OR REPLACE FUNCTION public.tellher_can_view(_q uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.tellher_member_ready() AND EXISTS (
    SELECT 1 FROM questions q JOIN question_private_meta m ON m.question_id = q.id
    WHERE q.id = _q AND q.status = 'open' AND (
      m.owner_id = auth.uid() OR q.audience_scope = 'community'
      OR EXISTS (SELECT 1 FROM question_audience a WHERE a.question_id = q.id AND a.recipient_id = auth.uid())))
$$;

CREATE OR REPLACE FUNCTION public.tellher_question(_id uuid)
RETURNS TABLE (id uuid, category text, body text, audience_scope text, created_at timestamptz, is_mine boolean, my_instinct text, my_note text, my_reply_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT q.id, q.category, q.body, q.audience_scope, q.created_at, (m.owner_id = auth.uid()),
    CASE WHEN m.owner_id = auth.uid() THEN m.initial_instinct END,
    CASE WHEN m.owner_id = auth.uid() THEN m.instinct_note END,
    (SELECT r.id FROM replies r WHERE r.question_id = q.id AND r.author_id = auth.uid())
  FROM questions q JOIN question_private_meta m ON m.question_id = q.id
  WHERE q.id = _id AND public.tellher_can_view(_id)
$$;

CREATE OR REPLACE FUNCTION public.tellher_replies(_id uuid)
RETURNS TABLE (id uuid, perspective_tag text, body text, created_at timestamptz, is_mine boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.tellher_can_view(_id) THEN RAISE EXCEPTION 'Question not available'; END IF;
  RETURN QUERY SELECT r.id, r.perspective_tag, r.body, r.created_at, (r.author_id = auth.uid())
    FROM replies r WHERE r.question_id = _id ORDER BY r.created_at ASC;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_feed_map()
RETURNS TABLE (question_id uuid, perspective_tag text, n int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.question_id, r.perspective_tag, count(*)::int FROM replies r
  WHERE public.tellher_can_view(r.question_id) GROUP BY 1, 2
$$;

CREATE OR REPLACE FUNCTION public.tellher_post_reply(_id uuid, _tag text, _body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rid uuid;
BEGIN
  IF NOT public.tellher_can_view(_id) THEN RAISE EXCEPTION 'Question not available'; END IF;
  IF EXISTS (SELECT 1 FROM question_private_meta WHERE question_id = _id AND owner_id = auth.uid()) THEN RAISE EXCEPTION 'You can''t reply to your own question'; END IF;
  IF _tag NOT IN ('address','watch_wait','more_context','been_there') THEN RAISE EXCEPTION 'Choose a perspective'; END IF;
  IF char_length(trim(coalesce(_body,''))) < 2 OR char_length(_body) > 1000 THEN RAISE EXCEPTION 'Your response should be 2 to 1000 characters'; END IF;
  IF EXISTS (SELECT 1 FROM replies WHERE question_id = _id AND author_id = auth.uid()) THEN RAISE EXCEPTION 'You already shared a perspective here'; END IF;
  INSERT INTO replies (question_id, author_id, body, perspective_tag) VALUES (_id, auth.uid(), trim(_body), _tag) RETURNING id INTO rid;
  RETURN rid;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_delete_reply(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM replies WHERE id = _id AND author_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Not allowed'; END IF;
END $$;

REVOKE ALL ON FUNCTION public.tellher_can_view(uuid), public.tellher_question(uuid), public.tellher_replies(uuid), public.tellher_feed_map(), public.tellher_post_reply(uuid, text, text), public.tellher_delete_reply(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_can_view(uuid), public.tellher_question(uuid), public.tellher_replies(uuid), public.tellher_feed_map(), public.tellher_post_reply(uuid, text, text), public.tellher_delete_reply(uuid) TO authenticated;