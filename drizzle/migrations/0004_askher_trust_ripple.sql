ALTER TABLE public.question_private_meta ADD CONSTRAINT question_private_meta_instinct_check CHECK (initial_instinct IS NULL OR initial_instinct IN ('feels_okay','unsure','feels_off')) NOT VALID;
CREATE INDEX IF NOT EXISTS question_audience_recipient_idx ON public.question_audience (recipient_id);
CREATE INDEX IF NOT EXISTS question_private_meta_owner_idx ON public.question_private_meta (owner_id);

CREATE OR REPLACE FUNCTION public.tellher_ripple_audience(_author uuid, _scope text)
RETURNS TABLE (recipient_id uuid, trust_distance smallint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH d1 AS (
    SELECT t.recipient_id AS rid, 1::smallint AS dist FROM trust_connections t
    WHERE t.requester_id = _author AND t.status = 'accepted'
  ), d2 AS (
    SELECT t2.recipient_id AS rid, 2::smallint AS dist FROM d1 JOIN trust_connections t2 ON t2.requester_id = d1.rid AND t2.status = 'accepted'
    WHERE _scope = 'extended'
  ), u AS (SELECT * FROM d1 UNION ALL SELECT * FROM d2)
  SELECT u.rid, min(u.dist)::smallint FROM u JOIN profiles p ON p.id = u.rid AND p.woman_attested_at IS NOT NULL
  WHERE u.rid <> _author AND _scope IN ('circle','extended') GROUP BY u.rid
$$;
REVOKE ALL ON FUNCTION public.tellher_ripple_audience(uuid, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.tellher_reach_preview(_scope text)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF _scope = 'community' THEN RETURN NULL; END IF;
  IF _scope NOT IN ('circle','extended') THEN RAISE EXCEPTION 'Unknown reach'; END IF;
  RETURN (SELECT count(*)::int FROM public.tellher_ripple_audience(auth.uid(), _scope));
END $$;

CREATE OR REPLACE FUNCTION public.tellher_publish_question(_category text, _body text, _scope text, _instinct text, _note text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE qid uuid; n int;
BEGIN
  IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF _category NOT IN ('Work','Dating & Boundaries','Housing & Moving','Travel','Services','Everyday Life') THEN RAISE EXCEPTION 'Choose a category'; END IF;
  IF char_length(trim(coalesce(_body,''))) < 10 OR char_length(_body) > 2000 THEN RAISE EXCEPTION 'Your question should be 10 to 2000 characters'; END IF;
  IF _scope NOT IN ('circle','extended','community') THEN RAISE EXCEPTION 'Choose how far it travels'; END IF;
  IF _instinct NOT IN ('feels_okay','unsure','feels_off') THEN RAISE EXCEPTION 'Choose your instinct'; END IF;
  IF _note IS NOT NULL AND char_length(_note) > 140 THEN RAISE EXCEPTION 'Keep the note to one line'; END IF;
  IF _scope <> 'community' AND NOT EXISTS (SELECT 1 FROM public.tellher_ripple_audience(auth.uid(), _scope)) THEN RAISE EXCEPTION 'No one is in this reach yet'; END IF;
  INSERT INTO questions (body, category, audience_scope, reach, status) VALUES (trim(_body), _category, _scope, _scope, 'published') RETURNING id INTO qid;
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
  WHERE q.status = 'published' AND (
    m.owner_id = auth.uid() OR q.audience_scope = 'community'
    OR EXISTS (SELECT 1 FROM question_audience a WHERE a.question_id = q.id AND a.recipient_id = auth.uid()))
  ORDER BY q.created_at DESC LIMIT 100;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_delete_question(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM question_private_meta WHERE question_id = _id AND owner_id = auth.uid()) THEN RAISE EXCEPTION 'Question not found'; END IF;
  DELETE FROM reports WHERE question_id = _id;
  DELETE FROM question_audience WHERE question_id = _id;
  DELETE FROM replies WHERE question_id = _id;
  DELETE FROM question_private_meta WHERE question_id = _id;
  DELETE FROM questions WHERE id = _id;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_report_question(_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tellher_feed() f WHERE f.id = _id AND NOT f.is_mine) THEN RAISE EXCEPTION 'Question not found'; END IF;
  IF char_length(trim(coalesce(_reason,''))) = 0 OR char_length(_reason) > 1000 THEN RAISE EXCEPTION 'Add a short reason'; END IF;
  IF EXISTS (SELECT 1 FROM reports WHERE reporter_id = auth.uid() AND question_id = _id) THEN RAISE EXCEPTION 'You already reported this question'; END IF;
  INSERT INTO reports (reporter_id, question_id, reason) VALUES (auth.uid(), _id, trim(_reason));
END $$;

REVOKE ALL ON FUNCTION public.tellher_reach_preview(text), public.tellher_publish_question(text,text,text,text,text), public.tellher_feed(), public.tellher_delete_question(uuid), public.tellher_report_question(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_reach_preview(text), public.tellher_publish_question(text,text,text,text,text), public.tellher_feed(), public.tellher_delete_question(uuid), public.tellher_report_question(uuid,text) TO authenticated;