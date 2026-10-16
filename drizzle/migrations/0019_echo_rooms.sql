CREATE TABLE public.echo_room_voices (
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  voice integer NOT NULL, -- 0 = Original Poster, 1.. = Voice n; stable once assigned
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, member_id),
  UNIQUE (question_id, voice)
);
GRANT ALL ON public.echo_room_voices TO service_role;
ALTER TABLE public.echo_room_voices ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.echo_room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX echo_room_messages_q ON public.echo_room_messages (question_id, created_at);
GRANT ALL ON public.echo_room_messages TO service_role;
ALTER TABLE public.echo_room_messages ENABLE ROW LEVEL SECURITY;
-- No member policies: rooms are read and written only through the checked functions below.

ALTER TABLE public.reports ADD COLUMN room_message_id uuid REFERENCES public.echo_room_messages(id) ON DELETE CASCADE;
ALTER TABLE public.reports DROP CONSTRAINT reports_target_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_target_check CHECK (num_nonnulls(question_id, reply_id, message_id, room_message_id) = 1);

CREATE OR REPLACE FUNCTION public.tellher_echo_room_status(_q uuid) RETURNS TABLE(unlocked boolean, can_enter boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH n AS (SELECT count(*) AS c FROM ripple_echoes WHERE question_id = _q)
  SELECT n.c >= 3,
    n.c >= 3 AND (EXISTS (SELECT 1 FROM question_private_meta WHERE question_id = _q AND owner_id = auth.uid())
      OR EXISTS (SELECT 1 FROM ripple_echoes WHERE question_id = _q AND member_id = auth.uid()))
  FROM n WHERE public.tellher_can_view(_q);
$$;

CREATE OR REPLACE FUNCTION public.tellher_echo_room_can_enter(_q uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT can_enter FROM public.tellher_echo_room_status(_q)), false);
$$;

CREATE OR REPLACE FUNCTION public.tellher_echo_room(_q uuid) RETURNS TABLE(id uuid, voice integer, body text, created_at timestamptz, mine boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.tellher_echo_room_can_enter(_q) THEN RAISE EXCEPTION 'This Echo Room is not available.'; END IF;
  RETURN QUERY SELECT m.id, v.voice, m.body, m.created_at, m.sender_id = auth.uid()
    FROM echo_room_messages m JOIN echo_room_voices v ON v.question_id = m.question_id AND v.member_id = m.sender_id
    WHERE m.question_id = _q ORDER BY m.created_at;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_echo_room_post(_q uuid, _body text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid; _voice int;
BEGIN
  IF NOT public.tellher_echo_room_can_enter(_q) THEN RAISE EXCEPTION 'This Echo Room is not available.'; END IF;
  IF char_length(btrim(coalesce(_body, ''))) = 0 OR char_length(_body) > 1000 THEN RAISE EXCEPTION 'Write a short message (up to 1000 characters).'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(_q::text));
  IF NOT EXISTS (SELECT 1 FROM echo_room_voices WHERE question_id = _q AND member_id = auth.uid()) THEN
    IF EXISTS (SELECT 1 FROM question_private_meta WHERE question_id = _q AND owner_id = auth.uid()) THEN _voice := 0;
    ELSE SELECT coalesce(max(voice), 0) + 1 INTO _voice FROM echo_room_voices WHERE question_id = _q; END IF;
    INSERT INTO echo_room_voices (question_id, member_id, voice) VALUES (_q, auth.uid(), _voice);
  END IF;
  INSERT INTO echo_room_messages (question_id, sender_id, body) VALUES (_q, auth.uid(), btrim(_body)) RETURNING echo_room_messages.id INTO _id;
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_report_room_message(_id uuid, _reason text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM echo_room_messages m WHERE m.id = _id AND m.sender_id <> auth.uid() AND public.tellher_echo_room_can_enter(m.question_id)) THEN RAISE EXCEPTION 'Message not found'; END IF;
  IF char_length(btrim(coalesce(_reason, ''))) = 0 OR char_length(_reason) > 1000 THEN RAISE EXCEPTION 'Add a short reason'; END IF;
  IF EXISTS (SELECT 1 FROM reports WHERE reporter_id = auth.uid() AND room_message_id = _id) THEN RAISE EXCEPTION 'You already reported this message'; END IF;
  INSERT INTO reports (reporter_id, room_message_id, reason) VALUES (auth.uid(), _id, btrim(_reason));
END $$;

REVOKE ALL ON FUNCTION public.tellher_echo_room_status(uuid), public.tellher_echo_room_can_enter(uuid), public.tellher_echo_room(uuid), public.tellher_echo_room_post(uuid, text), public.tellher_report_room_message(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_echo_room_status(uuid), public.tellher_echo_room_can_enter(uuid), public.tellher_echo_room(uuid), public.tellher_echo_room_post(uuid, text), public.tellher_report_room_message(uuid, text) TO authenticated;