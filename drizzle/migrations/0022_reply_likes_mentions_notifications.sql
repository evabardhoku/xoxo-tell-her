-- Reply likes: one per member per reply, identities never exposed, only counts.
CREATE TABLE public.reply_likes (
  reply_id uuid not null REFERENCES public.replies(id) ON DELETE CASCADE,
  member_id uuid not null REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz not null default now(),
  PRIMARY KEY (reply_id, member_id)
);
GRANT SELECT, INSERT, DELETE ON public.reply_likes TO authenticated;
GRANT ALL ON public.reply_likes TO service_role;
ALTER TABLE public.reply_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own likes" ON public.reply_likes FOR SELECT TO authenticated USING (member_id = (SELECT auth.uid()));

-- Notifications: recipient-only, created by checked functions.
CREATE TABLE public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text not null,
  title text not null,
  body text not null default '',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own notifications" ON public.notifications FOR SELECT TO authenticated USING (recipient_id = (SELECT auth.uid()));
CREATE POLICY "Mark own notifications read" ON public.notifications FOR UPDATE TO authenticated USING (recipient_id = (SELECT auth.uid())) WITH CHECK (recipient_id = (SELECT auth.uid()));

-- Mention support: store tagged member ids on replies and messages (only direct-circle members may be tagged; enforced in write functions).
ALTER TABLE public.replies ADD COLUMN mentions uuid[] not null default '{}';
ALTER TABLE public.messages ADD COLUMN mentions uuid[] not null default '{}';

-- Like / unlike a reply: only members who can view the question, not the reply author.
CREATE OR REPLACE FUNCTION public.tellher_like_reply(_reply uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _q uuid; _author uuid;
BEGIN
  IF NOT tellher_member_ready() THEN RAISE EXCEPTION 'not ready'; END IF;
  SELECT question_id, author_id INTO _q, _author FROM replies WHERE id = _reply;
  IF _q IS NULL THEN RAISE EXCEPTION 'reply not found'; END IF;
  IF _author = auth.uid() THEN RAISE EXCEPTION 'cannot like your own reply'; END IF;
  IF NOT tellher_can_view(_q) THEN RAISE EXCEPTION 'not allowed'; END IF;
  INSERT INTO reply_likes (reply_id, member_id) VALUES (_reply, auth.uid()) ON CONFLICT DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_unlike_reply(_reply uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM reply_likes WHERE reply_id = _reply AND member_id = auth.uid();
END $$;

-- Like counts for a question's replies: counts only, plus whether the viewer liked. Never exposes who liked.
CREATE OR REPLACE FUNCTION public.tellher_reply_likes(_q uuid)
RETURNS TABLE(reply_id uuid, likes integer, mine boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (tellher_member_ready() AND tellher_can_view(_q)) THEN RAISE EXCEPTION 'not allowed'; END IF;
  RETURN QUERY
    SELECT r.id, (SELECT count(*)::int FROM reply_likes l WHERE l.reply_id = r.id),
           EXISTS (SELECT 1 FROM reply_likes l WHERE l.reply_id = r.id AND l.member_id = auth.uid())
    FROM replies r WHERE r.question_id = _q;
END $$;

-- Tag picker: only the viewer's accepted Direct Circle, first name + last initial, no emails.
CREATE OR REPLACE FUNCTION public.tellher_taggable()
RETURNS TABLE(member_id uuid, first_name text, last_initial text) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT tellher_member_ready() THEN RAISE EXCEPTION 'not ready'; END IF;
  RETURN QUERY
    SELECT p.id, p.first_name, left(p.last_name, 1)
    FROM trust_connections t
    JOIN profiles p ON p.id = CASE WHEN t.requester_id = auth.uid() THEN t.recipient_id ELSE t.requester_id END
    WHERE t.status = 'accepted' AND (t.requester_id = auth.uid() OR t.recipient_id = auth.uid())
    ORDER BY p.first_name;
END $$;

-- Post a reply with optional tags; tagged members must be in the author's Direct Circle and get a notification.
CREATE OR REPLACE FUNCTION public.tellher_post_reply_tagged(_id uuid, _tag text, _body text, _mentions uuid[])
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _rid uuid; _m uuid; _author uuid;
BEGIN
  _rid := tellher_post_reply(_id, _tag, _body);
  FOREACH _m IN ARRAY COALESCE(_mentions, '{}') LOOP
    IF tellher_is_direct(auth.uid(), _m) THEN
      UPDATE replies SET mentions = array_append(mentions, _m) WHERE id = _rid;
      INSERT INTO notifications (recipient_id, kind, title, body, link)
      VALUES (_m, 'mention', 'You were mentioned in a reply', 'A woman in your Direct Circle mentioned you on a Ripple.', '/askher/' || _id);
    END IF;
  END LOOP;
  SELECT owner_id INTO _author FROM question_private_meta WHERE question_id = _id;
  IF _author IS NOT NULL AND _author <> auth.uid() THEN
    INSERT INTO notifications (recipient_id, kind, title, body, link)
    VALUES (_author, 'reply', 'New perspective on your Ripple', 'Someone shared how she sees it.', '/askher/' || _id);
  END IF;
  RETURN _rid;
END $$;

-- Send a Between Us message with optional tag of the other participant.
CREATE OR REPLACE FUNCTION public.tellher_send_message_tagged(_c uuid, _body text, _mentions uuid[])
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _mid uuid; _partner uuid; _m uuid;
BEGIN
  _mid := tellher_send_message(_c, _body);
  _partner := tellher_conversation_partner(_c);
  FOREACH _m IN ARRAY COALESCE(_mentions, '{}') LOOP
    IF _m = _partner THEN
      UPDATE messages SET mentions = array_append(mentions, _m) WHERE id = _mid;
    END IF;
  END LOOP;
  IF _partner IS NOT NULL THEN
    INSERT INTO notifications (recipient_id, kind, title, body, link)
    VALUES (_partner, 'message', 'New message in Between Us', 'You have a new private message.', '/between-us/' || _c);
  END IF;
  RETURN _mid;
END $$;

-- Notifications for trust requests and responses.
CREATE OR REPLACE FUNCTION public.tellher_notify_trust(_recipient uuid, _kind text, _title text, _body text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO notifications (recipient_id, kind, title, body, link) VALUES (_recipient, _kind, _title, _body, '/circle');
END $$;

-- Unread count + list for the bell.
CREATE OR REPLACE FUNCTION public.tellher_notifications()
RETURNS TABLE(id uuid, kind text, title text, body text, link text, read boolean, created_at timestamptz) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY SELECT n.id, n.kind, n.title, n.body, n.link, n.read_at IS NOT NULL, n.created_at
    FROM notifications n WHERE n.recipient_id = auth.uid() ORDER BY n.created_at DESC LIMIT 50;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_unread_notifications()
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM notifications WHERE recipient_id = auth.uid() AND read_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.tellher_mark_notifications_read()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE notifications SET read_at = now() WHERE recipient_id = auth.uid() AND read_at IS NULL;
END $$;