CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.tellher_is_moderator()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT auth.uid() IS NOT NULL AND (public.has_role(auth.uid(),'moderator') OR public.has_role(auth.uid(),'admin')) $$;
REVOKE EXECUTE ON FUNCTION public.tellher_is_moderator() FROM anon;

CREATE TABLE public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id uuid NOT NULL,
  report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  target_type text NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.moderation_actions TO authenticated;
GRANT ALL ON public.moderation_actions TO service_role;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Moderators read log" ON public.moderation_actions FOR SELECT TO authenticated USING (public.tellher_is_moderator());

-- Report queue: content only, never reporter or author identity.
CREATE OR REPLACE FUNCTION public.tellher_mod_reports()
RETURNS TABLE(id uuid, target_type text, reason text, status text, created_at timestamptz, content text, ripple_id uuid)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.tellher_is_moderator() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN QUERY
  SELECT r.id,
    CASE WHEN r.reply_id IS NOT NULL THEN 'perspective' WHEN r.letter_id IS NOT NULL THEN 'letter'
         WHEN r.room_message_id IS NOT NULL THEN 'shared_space' WHEN r.message_id IS NOT NULL THEN 'message' ELSE 'ripple' END,
    r.reason, r.status, r.created_at,
    COALESCE(rp.body, l.body, rm.body, m.body, q.body),
    COALESCE(rp.question_id, l.question_id, rm.question_id, r.question_id)
  FROM public.reports r
  LEFT JOIN public.replies rp ON rp.id = r.reply_id
  LEFT JOIN public.ripple_letters l ON l.id = r.letter_id
  LEFT JOIN public.echo_room_messages rm ON rm.id = r.room_message_id
  LEFT JOIN public.messages m ON m.id = r.message_id
  LEFT JOIN public.questions q ON q.id = r.question_id
  ORDER BY (r.status = 'open') DESC, r.created_at DESC
  LIMIT 200;
END $$;
REVOKE EXECUTE ON FUNCTION public.tellher_mod_reports() FROM anon;

CREATE OR REPLACE FUNCTION public.tellher_mod_act(_report uuid, _action text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.reports; t text; removed constant text := 'This content was removed by TellHer moderators.';
BEGIN
  IF NOT public.tellher_is_moderator() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF _action NOT IN ('reviewed','dismissed','remove') THEN RAISE EXCEPTION 'Unknown action'; END IF;
  SELECT * INTO r FROM public.reports WHERE id = _report;
  IF NOT FOUND THEN RAISE EXCEPTION 'Report not found'; END IF;
  t := CASE WHEN r.reply_id IS NOT NULL THEN 'perspective' WHEN r.letter_id IS NOT NULL THEN 'letter'
            WHEN r.room_message_id IS NOT NULL THEN 'shared_space' WHEN r.message_id IS NOT NULL THEN 'message' ELSE 'ripple' END;
  IF _action = 'remove' THEN
    IF r.reply_id IS NOT NULL THEN UPDATE public.replies SET body = removed WHERE id = r.reply_id;
    ELSIF r.letter_id IS NOT NULL THEN UPDATE public.ripple_letters SET body = removed, where_now = NULL WHERE id = r.letter_id;
    ELSIF r.room_message_id IS NOT NULL THEN UPDATE public.echo_room_messages SET body = removed WHERE id = r.room_message_id;
    ELSIF r.message_id IS NOT NULL THEN UPDATE public.messages SET body = removed WHERE id = r.message_id;
    ELSIF r.question_id IS NOT NULL THEN UPDATE public.questions SET body = removed, status = 'closed' WHERE id = r.question_id;
    END IF;
    UPDATE public.reports SET status = 'actioned' WHERE id = _report;
  ELSE
    UPDATE public.reports SET status = _action WHERE id = _report;
  END IF;
  INSERT INTO public.moderation_actions(moderator_id, report_id, target_type, action) VALUES (auth.uid(), _report, t, _action);
END $$;
REVOKE EXECUTE ON FUNCTION public.tellher_mod_act(uuid, text) FROM anon;

-- Configurable abuse limits for spam-prone writes (reading is never limited).
CREATE TABLE public.rate_limits (
  action text PRIMARY KEY,
  max_count integer NOT NULL,
  window_seconds integer NOT NULL
);
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
INSERT INTO public.rate_limits VALUES
  ('ripple', 10, 3600), ('connect', 20, 3600), ('message', 60, 600),
  ('report', 10, 3600), ('shared_space', 40, 600), ('letter', 10, 3600);

CREATE OR REPLACE FUNCTION public.tellher_rate_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE lim public.rate_limits; n integer; col text := TG_ARGV[1];
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO lim FROM public.rate_limits WHERE action = TG_ARGV[0];
  IF NOT FOUND THEN RETURN NEW; END IF;
  EXECUTE format('SELECT count(*) FROM public.%I WHERE %I = $1 AND created_at > now() - make_interval(secs => $2)', TG_TABLE_NAME, col)
    INTO n USING auth.uid(), lim.window_seconds;
  IF n >= lim.max_count THEN
    RAISE EXCEPTION 'You’re doing that quite a lot. Please take a short break and try again later.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER rl_ripple BEFORE INSERT ON public.question_private_meta FOR EACH ROW EXECUTE FUNCTION public.tellher_rate_limit('ripple','owner_id');
CREATE TRIGGER rl_connect BEFORE INSERT ON public.trust_connections FOR EACH ROW EXECUTE FUNCTION public.tellher_rate_limit('connect','requester_id');
CREATE TRIGGER rl_message BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.tellher_rate_limit('message','sender_id');
CREATE TRIGGER rl_report BEFORE INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION public.tellher_rate_limit('report','reporter_id');
CREATE TRIGGER rl_room BEFORE INSERT ON public.echo_room_messages FOR EACH ROW EXECUTE FUNCTION public.tellher_rate_limit('shared_space','sender_id');
CREATE TRIGGER rl_letter BEFORE INSERT ON public.ripple_letters FOR EACH ROW EXECUTE FUNCTION public.tellher_rate_limit('letter','author_id');

-- Discreet notification copy: neutral titles, no content previews.
CREATE OR REPLACE FUNCTION public.tellher_discreet_notification()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF NEW.kind = 'message' THEN NEW.title := 'You have a new message'; NEW.body := 'Open TellHer to read it.';
  ELSIF NEW.kind = 'letter' THEN NEW.title := 'A Ripple you started has an update'; NEW.body := 'Open TellHer to see it.';
  ELSIF NEW.kind = 'mention' THEN NEW.title := 'You have a new update'; NEW.body := 'Open TellHer to see it.';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER discreet_notification BEFORE INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.tellher_discreet_notification();
UPDATE public.notifications SET title = 'You have a new message', body = 'Open TellHer to read it.' WHERE kind = 'message';
UPDATE public.notifications SET title = 'A Ripple you started has an update', body = 'Open TellHer to see it.' WHERE kind = 'letter';