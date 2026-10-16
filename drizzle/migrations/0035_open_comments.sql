ALTER TABLE public.replies ADD COLUMN open_identity boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.replies.open_identity IS 'True only for named comments posted on open Ripples via tellher_post_open_comment; historical replies stay anonymous.';
DROP INDEX IF EXISTS public.replies_one_per_member;
CREATE UNIQUE INDEX replies_one_per_member ON public.replies (question_id, author_id) WHERE NOT open_identity;

CREATE OR REPLACE FUNCTION public.tellher_post_open_comment(_id uuid, _body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rid uuid; _owner uuid;
BEGIN
  IF NOT tellher_member_ready() OR NOT tellher_can_view(_id) THEN RAISE EXCEPTION 'Question not available'; END IF;
  IF NOT EXISTS (SELECT 1 FROM questions WHERE id = _id AND author_visibility = 'named' AND status = 'open') THEN RAISE EXCEPTION 'Comments are only for open Ripples'; END IF;
  IF char_length(trim(coalesce(_body,''))) < 1 OR char_length(_body) > 1000 THEN RAISE EXCEPTION 'Your comment should be 1 to 1000 characters'; END IF;
  INSERT INTO replies (question_id, author_id, body, perspective_tag, open_identity) VALUES (_id, auth.uid(), trim(_body), NULL, true) RETURNING id INTO rid;
  SELECT owner_id INTO _owner FROM question_private_meta WHERE question_id = _id;
  IF _owner IS NOT NULL AND _owner <> auth.uid() THEN
    INSERT INTO notifications (recipient_id, kind, title, body, link) VALUES (_owner, 'reply', 'New comment on your Ripple', 'Someone commented on your open Ripple.', '/askher/' || _id);
  END IF;
  RETURN rid;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_open_comments(_id uuid)
RETURNS TABLE(id uuid, body text, created_at timestamptz, is_mine boolean, first_name text, profile_id uuid, has_avatar boolean, likes integer, liked boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT tellher_member_ready() OR NOT tellher_can_view(_id) THEN RAISE EXCEPTION 'Question not available'; END IF;
  IF NOT EXISTS (SELECT 1 FROM questions WHERE questions.id = _id AND author_visibility = 'named') THEN RAISE EXCEPTION 'Comments are only for open Ripples'; END IF;
  RETURN QUERY SELECT r.id, r.body, r.created_at, (r.author_id = auth.uid()),
    CASE WHEN r.open_identity THEN p.first_name END,
    CASE WHEN r.open_identity AND mp.first_name IS NOT NULL THEN p.id END,
    CASE WHEN r.open_identity AND mp.first_name IS NOT NULL THEN mp.has_avatar ELSE false END,
    (SELECT count(*)::int FROM reply_likes l WHERE l.reply_id = r.id),
    EXISTS (SELECT 1 FROM reply_likes l WHERE l.reply_id = r.id AND l.member_id = auth.uid())
  FROM replies r JOIN profiles p ON p.id = r.author_id
  LEFT JOIN LATERAL tellher_member_profile(p.id) mp ON r.open_identity
  WHERE r.question_id = _id AND NOT tellher_is_blocked(auth.uid(), r.author_id)
  ORDER BY r.created_at ASC;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_open_feed_context(_ids uuid[])
RETURNS TABLE(question_id uuid, relation text, via_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF cardinality(_ids) > 200 THEN RAISE EXCEPTION 'Too many Ripples'; END IF;
  RETURN QUERY SELECT q.id,
    CASE WHEN m.owner_id = auth.uid() THEN 'mine'
         WHEN tellher_is_direct(auth.uid(), m.owner_id) THEN 'circle'
         WHEN EXISTS (SELECT 1 FROM question_audience a WHERE a.question_id = q.id AND a.recipient_id = auth.uid() AND a.trust_distance = 2) THEN 'extended'
         ELSE 'community' END,
    CASE WHEN m.owner_id <> auth.uid() AND NOT tellher_is_direct(auth.uid(), m.owner_id)
      AND EXISTS (SELECT 1 FROM question_audience a WHERE a.question_id = q.id AND a.recipient_id = auth.uid() AND a.trust_distance = 2)
      THEN (SELECT p.first_name FROM profiles p WHERE tellher_is_direct(auth.uid(), p.id) AND tellher_is_direct(p.id, m.owner_id) ORDER BY p.first_name LIMIT 1) END
  FROM questions q JOIN question_private_meta m ON m.question_id = q.id
  WHERE q.id = ANY(_ids) AND q.author_visibility = 'named' AND tellher_can_view(q.id);
END $$;

REVOKE ALL ON FUNCTION public.tellher_post_open_comment(uuid, text), public.tellher_open_comments(uuid), public.tellher_open_feed_context(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_post_open_comment(uuid, text), public.tellher_open_comments(uuid), public.tellher_open_feed_context(uuid[]) TO authenticated;