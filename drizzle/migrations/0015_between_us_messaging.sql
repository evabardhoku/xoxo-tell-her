CREATE TABLE public.conversations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.conversation_participants (
 conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
 member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 last_read_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (conversation_id, member_id)
);
CREATE INDEX conversation_participants_member_idx ON public.conversation_participants(member_id);
CREATE TABLE public.messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
 sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_conversation_idx ON public.messages(conversation_id, created_at);
CREATE TABLE public.member_blocks (
 blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (blocker_id, blocked_id),
 CHECK (blocker_id <> blocked_id)
);
ALTER TABLE public.reports ADD COLUMN message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

GRANT SELECT ON public.conversations, public.conversation_participants, public.messages, public.member_blocks TO authenticated;
GRANT ALL ON public.conversations, public.conversation_participants, public.messages, public.member_blocks TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_blocks ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.tellher_is_participant(_c uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = _c AND member_id = auth.uid())
$$;
-- Direct Circle = an accepted trust edge in either direction (Extended alone never counts).
CREATE FUNCTION public.tellher_is_direct(_a uuid, _b uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT _a <> _b AND EXISTS (SELECT 1 FROM trust_connections WHERE status = 'accepted' AND ((requester_id = _a AND recipient_id = _b) OR (requester_id = _b AND recipient_id = _a)))
$$;
CREATE FUNCTION public.tellher_is_blocked(_a uuid, _b uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM member_blocks WHERE (blocker_id = _a AND blocked_id = _b) OR (blocker_id = _b AND blocked_id = _a))
$$;
CREATE FUNCTION public.tellher_can_message(_member uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT public.tellher_member_ready() AND public.tellher_is_direct(auth.uid(), _member) AND NOT public.tellher_is_blocked(auth.uid(), _member)
$$;

CREATE POLICY "Participants read conversations" ON public.conversations FOR SELECT TO authenticated USING (public.tellher_is_participant(id));
CREATE POLICY "Participants read participants" ON public.conversation_participants FOR SELECT TO authenticated USING (public.tellher_is_participant(conversation_id));
CREATE POLICY "Participants read messages" ON public.messages FOR SELECT TO authenticated USING (public.tellher_member_ready() AND public.tellher_is_participant(conversation_id));
CREATE POLICY "Read own blocks" ON public.member_blocks FOR SELECT TO authenticated USING (blocker_id = (SELECT auth.uid()));

CREATE FUNCTION public.tellher_open_conversation(_member uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c uuid;
BEGIN
 IF NOT public.tellher_can_message(_member) THEN RAISE EXCEPTION 'Between Us is only available with your Direct Circle'; END IF;
 SELECT a.conversation_id INTO c FROM conversation_participants a JOIN conversation_participants b ON b.conversation_id = a.conversation_id
  WHERE a.member_id = auth.uid() AND b.member_id = _member LIMIT 1;
 IF c IS NULL THEN
  INSERT INTO conversations DEFAULT VALUES RETURNING id INTO c;
  INSERT INTO conversation_participants (conversation_id, member_id) VALUES (c, auth.uid()), (c, _member);
 END IF;
 RETURN c;
END $$;

CREATE FUNCTION public.tellher_conversation_partner(_c uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT member_id FROM conversation_participants WHERE conversation_id = _c AND member_id <> auth.uid() AND public.tellher_is_participant(_c) LIMIT 1
$$;

CREATE FUNCTION public.tellher_send_message(_c uuid, _body text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE other uuid; m uuid;
BEGIN
 IF NOT public.tellher_is_participant(_c) THEN RAISE EXCEPTION 'Conversation not found'; END IF;
 other := public.tellher_conversation_partner(_c);
 IF other IS NULL OR NOT public.tellher_can_message(other) THEN RAISE EXCEPTION 'You can no longer message in this conversation'; END IF;
 IF char_length(btrim(coalesce(_body,''))) = 0 OR char_length(_body) > 2000 THEN RAISE EXCEPTION 'Messages are 1 to 2000 characters'; END IF;
 INSERT INTO messages (conversation_id, sender_id, body) VALUES (_c, auth.uid(), btrim(_body)) RETURNING id INTO m;
 UPDATE conversations SET updated_at = now() WHERE id = _c;
 UPDATE conversation_participants SET last_read_at = now() WHERE conversation_id = _c AND member_id = auth.uid();
 RETURN m;
END $$;

CREATE FUNCTION public.tellher_mark_read(_c uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
 UPDATE conversation_participants SET last_read_at = now() WHERE conversation_id = _c AND member_id = auth.uid()
$$;

CREATE FUNCTION public.tellher_inbox() RETURNS TABLE(conversation_id uuid, member_id uuid, first_name text, last_initial text, has_avatar boolean, last_body text, last_at timestamptz, last_mine boolean, unread boolean, can_message boolean, blocked_by_me boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
 RETURN QUERY
 SELECT me.conversation_id, p.id, p.first_name, left(p.last_name,1), p.avatar_path IS NOT NULL,
  lm.body, coalesce(lm.created_at, c.created_at), lm.sender_id = auth.uid(),
  EXISTS (SELECT 1 FROM messages x WHERE x.conversation_id = me.conversation_id AND x.sender_id <> auth.uid() AND x.created_at > me.last_read_at),
  public.tellher_can_message(p.id),
  EXISTS (SELECT 1 FROM member_blocks b WHERE b.blocker_id = auth.uid() AND b.blocked_id = p.id)
 FROM conversation_participants me
 JOIN conversations c ON c.id = me.conversation_id
 JOIN conversation_participants o ON o.conversation_id = me.conversation_id AND o.member_id <> me.member_id
 JOIN profiles p ON p.id = o.member_id
 LEFT JOIN LATERAL (SELECT body, created_at, sender_id FROM messages WHERE messages.conversation_id = me.conversation_id ORDER BY created_at DESC LIMIT 1) lm ON true
 WHERE me.member_id = auth.uid()
 ORDER BY coalesce(lm.created_at, c.created_at) DESC;
END $$;

CREATE FUNCTION public.tellher_block(_member uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.tellher_member_ready() OR _member = auth.uid() THEN RAISE EXCEPTION 'Not allowed'; END IF;
 IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = _member) THEN RAISE EXCEPTION 'Member not found'; END IF;
 INSERT INTO member_blocks (blocker_id, blocked_id) VALUES (auth.uid(), _member) ON CONFLICT DO NOTHING;
END $$;
CREATE FUNCTION public.tellher_unblock(_member uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
 DELETE FROM member_blocks WHERE blocker_id = auth.uid() AND blocked_id = _member
$$;

CREATE FUNCTION public.tellher_report_message(_id uuid, _reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
 IF NOT EXISTS (SELECT 1 FROM messages m WHERE m.id = _id AND m.sender_id <> auth.uid() AND public.tellher_is_participant(m.conversation_id)) THEN RAISE EXCEPTION 'Message not found'; END IF;
 IF char_length(btrim(coalesce(_reason,''))) = 0 OR char_length(_reason) > 1000 THEN RAISE EXCEPTION 'Add a short reason'; END IF;
 IF EXISTS (SELECT 1 FROM reports WHERE reporter_id = auth.uid() AND message_id = _id) THEN RAISE EXCEPTION 'You already reported this message'; END IF;
 INSERT INTO reports (reporter_id, message_id, reason) VALUES (auth.uid(), _id, btrim(_reason));
END $$;

REVOKE ALL ON FUNCTION public.tellher_is_participant(uuid), public.tellher_is_direct(uuid,uuid), public.tellher_is_blocked(uuid,uuid), public.tellher_can_message(uuid), public.tellher_open_conversation(uuid), public.tellher_conversation_partner(uuid), public.tellher_send_message(uuid,text), public.tellher_mark_read(uuid), public.tellher_inbox(), public.tellher_block(uuid), public.tellher_unblock(uuid), public.tellher_report_message(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_is_participant(uuid), public.tellher_can_message(uuid), public.tellher_open_conversation(uuid), public.tellher_conversation_partner(uuid), public.tellher_send_message(uuid,text), public.tellher_mark_read(uuid), public.tellher_inbox(), public.tellher_block(uuid), public.tellher_unblock(uuid), public.tellher_report_message(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tellher_is_participant(uuid), public.tellher_is_direct(uuid,uuid), public.tellher_is_blocked(uuid,uuid), public.tellher_can_message(uuid) TO service_role;