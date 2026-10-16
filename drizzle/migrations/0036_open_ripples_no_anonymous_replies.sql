CREATE OR REPLACE FUNCTION public.tellher_post_reply(_id uuid, _tag text, _body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rid uuid;
BEGIN
  IF NOT public.tellher_can_view(_id) THEN RAISE EXCEPTION 'Question not available'; END IF;
  IF EXISTS (SELECT 1 FROM questions WHERE id = _id AND author_visibility = 'named') THEN RAISE EXCEPTION 'Open Ripples take named comments'; END IF;
  IF EXISTS (SELECT 1 FROM question_private_meta WHERE question_id = _id AND owner_id = auth.uid()) THEN RAISE EXCEPTION 'You can''t reply to your own question'; END IF;
  IF _tag NOT IN ('address','watch_wait','more_context','been_there') THEN RAISE EXCEPTION 'Choose a perspective'; END IF;
  IF char_length(trim(coalesce(_body,''))) < 2 OR char_length(_body) > 1000 THEN RAISE EXCEPTION 'Your response should be 2 to 1000 characters'; END IF;
  IF EXISTS (SELECT 1 FROM replies WHERE question_id = _id AND author_id = auth.uid() AND NOT open_identity) THEN RAISE EXCEPTION 'You already shared a perspective here'; END IF;
  INSERT INTO replies (question_id, author_id, body, perspective_tag) VALUES (_id, auth.uid(), trim(_body), _tag) RETURNING id INTO rid;
  RETURN rid;
END $$;