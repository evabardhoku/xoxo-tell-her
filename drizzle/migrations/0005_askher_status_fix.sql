CREATE OR REPLACE FUNCTION public.tellher_publish_question(_category text, _body text, _scope text, _instinct text, _note text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE qid uuid;
BEGIN
  IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF _category NOT IN ('Work','Dating & Boundaries','Housing & Moving','Travel','Services','Everyday Life') THEN RAISE EXCEPTION 'Choose a category'; END IF;
  IF char_length(trim(coalesce(_body,''))) < 10 OR char_length(_body) > 2000 THEN RAISE EXCEPTION 'Your question should be 10 to 2000 characters'; END IF;
  IF _scope NOT IN ('circle','extended','community') THEN RAISE EXCEPTION 'Choose how far it travels'; END IF;
  IF _instinct NOT IN ('feels_okay','unsure','feels_off') THEN RAISE EXCEPTION 'Choose your instinct'; END IF;
  IF _note IS NOT NULL AND char_length(_note) > 140 THEN RAISE EXCEPTION 'Keep the note to one line'; END IF;
  IF _scope <> 'community' AND NOT EXISTS (SELECT 1 FROM public.tellher_ripple_audience(auth.uid(), _scope)) THEN RAISE EXCEPTION 'No one is in this reach yet'; END IF;
  INSERT INTO questions (body, category, audience_scope, reach, status) VALUES (trim(_body), _category, _scope, CASE WHEN _scope = 'circle' THEN 'direct' ELSE _scope END, 'open') RETURNING id INTO qid;
  INSERT INTO question_private_meta (question_id, owner_id, initial_instinct, instinct_note) VALUES (qid, auth.uid(), _instinct, nullif(trim(coalesce(_note,'')), ''));
  IF _scope <> 'community' THEN
    INSERT INTO question_audience (question_id, recipient_id, trust_distance)
      SELECT qid, a.recipient_id, a.trust_distance FROM public.tellher_ripple_audience(auth.uid(), _scope) a;
  END IF;
  RETURN qid;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_feed()
RETURNS TABLE (id uuid, category text, body text, audience_scope text, created_at timestamptz, reply_count int, is_mine boolean, my_instinct text, my_note text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN QUERY
  SELECT q.id, q.category, q.body, q.audience_scope, q.created_at,
    (SELECT count(*)::int FROM replies r WHERE r.question_id = q.id),
    (m.owner_id = auth.uid()),
    CASE WHEN m.owner_id = auth.uid() THEN m.initial_instinct END,
    CASE WHEN m.owner_id = auth.uid() THEN m.instinct_note END
  FROM questions q JOIN question_private_meta m ON m.question_id = q.id
  WHERE q.status = 'open' AND (
    m.owner_id = auth.uid() OR q.audience_scope = 'community'
    OR EXISTS (SELECT 1 FROM question_audience a WHERE a.question_id = q.id AND a.recipient_id = auth.uid()))
  ORDER BY q.created_at DESC LIMIT 100;
END $$;