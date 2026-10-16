CREATE TABLE public.ripple_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 600),
  where_now text CHECK (where_now IS NULL OR char_length(where_now) <= 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id, author_id)
);
COMMENT ON COLUMN public.ripple_letters.author_id IS 'Private: never selectable by members; letters are read only through tellher_letters().';
-- Column-level grants: author_id is never readable through the Data API.
GRANT SELECT (id, question_id, body, where_now, created_at, updated_at) ON public.ripple_letters TO authenticated;
GRANT UPDATE (body, where_now, updated_at) ON public.ripple_letters TO authenticated;
GRANT DELETE ON public.ripple_letters TO authenticated;
GRANT ALL ON public.ripple_letters TO service_role;
ALTER TABLE public.ripple_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ripple viewers read letters" ON public.ripple_letters FOR SELECT TO authenticated USING (public.tellher_can_view(question_id));
CREATE POLICY "Authors update own letter" ON public.ripple_letters FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors delete own letter" ON public.ripple_letters FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE TABLE public.letter_helps (
  letter_id uuid NOT NULL REFERENCES public.ripple_letters(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (letter_id, member_id)
);
GRANT ALL ON public.letter_helps TO service_role;
ALTER TABLE public.letter_helps ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reports ADD COLUMN letter_id uuid REFERENCES public.ripple_letters(id) ON DELETE CASCADE;
ALTER TABLE public.reports DROP CONSTRAINT reports_target_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_target_check CHECK (num_nonnulls(question_id, reply_id, message_id, room_message_id, letter_id) = 1);

CREATE OR REPLACE FUNCTION public.tellher_can_write_letter(_q uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.tellher_can_view(_q) AND (
    EXISTS (SELECT 1 FROM ripple_echoes WHERE question_id = _q AND member_id = auth.uid())
    OR (public.tellher_is_question_author(_q) AND EXISTS (SELECT 1 FROM ripple_outcomes WHERE question_id = _q AND shared)))
$$;

CREATE OR REPLACE FUNCTION public.tellher_letters(_q uuid)
RETURNS TABLE(id uuid, body text, where_now text, created_at timestamptz, mine boolean, helped boolean, help_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.id, l.body, l.where_now, l.created_at, l.author_id = auth.uid(),
    EXISTS (SELECT 1 FROM letter_helps h WHERE h.letter_id = l.id AND h.member_id = auth.uid()),
    CASE WHEN l.author_id = auth.uid() THEN (SELECT count(*)::int FROM letter_helps h WHERE h.letter_id = l.id) END
  FROM ripple_letters l WHERE l.question_id = _q AND public.tellher_can_view(_q)
  ORDER BY l.created_at
$$;

CREATE OR REPLACE FUNCTION public.tellher_write_letter(_q uuid, _body text, _where_now text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid; _first boolean; _owner uuid;
BEGIN
  IF NOT public.tellher_can_write_letter(_q) THEN RAISE EXCEPTION 'Letters can be written by women who echoed this Ripple, or by its author after sharing what happened next.'; END IF;
  IF char_length(btrim(coalesce(_body, ''))) = 0 OR char_length(btrim(_body)) > 600 THEN RAISE EXCEPTION 'A letter can be up to 600 characters.'; END IF;
  IF char_length(coalesce(_where_now, '')) > 80 THEN RAISE EXCEPTION 'Keep “Where I am now” to one short line.'; END IF;
  SELECT NOT EXISTS (SELECT 1 FROM ripple_letters WHERE question_id = _q) INTO _first;
  INSERT INTO ripple_letters (question_id, author_id, body, where_now) VALUES (_q, auth.uid(), btrim(_body), nullif(btrim(coalesce(_where_now, '')), ''))
  ON CONFLICT (question_id, author_id) DO UPDATE SET body = excluded.body, where_now = excluded.where_now, updated_at = now()
  RETURNING ripple_letters.id INTO _id;
  SELECT owner_id INTO _owner FROM question_private_meta WHERE question_id = _q;
  IF _first AND _owner IS DISTINCT FROM auth.uid() THEN
    INSERT INTO notifications (recipient_id, kind, title, body, link) VALUES (_owner, 'letter', 'A letter from the other side reached your Ripple', 'A woman who has been there wrote to you.', '/askher/' || _q);
  END IF;
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_delete_letter(_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM ripple_letters WHERE id = _id AND author_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Letter not found'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_help_letter(_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ripple_letters l WHERE l.id = _id AND l.author_id <> auth.uid() AND public.tellher_can_view(l.question_id)) THEN RAISE EXCEPTION 'Letter not found'; END IF;
  INSERT INTO letter_helps (letter_id, member_id) VALUES (_id, auth.uid()) ON CONFLICT DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_unhelp_letter(_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM letter_helps WHERE letter_id = _id AND member_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.tellher_report_letter(_id uuid, _reason text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ripple_letters l WHERE l.id = _id AND l.author_id <> auth.uid() AND public.tellher_can_view(l.question_id)) THEN RAISE EXCEPTION 'Letter not found'; END IF;
  IF char_length(btrim(coalesce(_reason, ''))) = 0 OR char_length(_reason) > 1000 THEN RAISE EXCEPTION 'Add a short reason'; END IF;
  IF EXISTS (SELECT 1 FROM reports WHERE reporter_id = auth.uid() AND letter_id = _id) THEN RAISE EXCEPTION 'You already reported this letter'; END IF;
  INSERT INTO reports (reporter_id, letter_id, reason) VALUES (auth.uid(), _id, btrim(_reason));
END $$;

REVOKE EXECUTE ON FUNCTION public.tellher_can_write_letter(uuid), public.tellher_letters(uuid), public.tellher_write_letter(uuid, text, text), public.tellher_delete_letter(uuid), public.tellher_help_letter(uuid), public.tellher_unhelp_letter(uuid), public.tellher_report_letter(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.tellher_can_write_letter(uuid), public.tellher_letters(uuid), public.tellher_write_letter(uuid, text, text), public.tellher_delete_letter(uuid), public.tellher_help_letter(uuid), public.tellher_unhelp_letter(uuid), public.tellher_report_letter(uuid, text) TO authenticated;