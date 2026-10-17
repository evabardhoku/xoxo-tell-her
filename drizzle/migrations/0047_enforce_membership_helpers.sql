DO $$ DECLARE r record; d text; BEGIN
 FOR r IN SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('tellher_cancel_trust','tellher_my_impact','tellher_notifications') LOOP
 d := pg_get_functiondef(r.oid);
 d := regexp_replace(d, '\mBEGIN\M', E'BEGIN\n IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION ''Membership required''; END IF;', 'i');
 EXECUTE d;
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.tellher_mark_read(_c uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ UPDATE public.conversation_participants SET last_read_at=now() WHERE conversation_id=_c AND member_id=auth.uid() AND public.tellher_member_ready(); $$;
CREATE OR REPLACE FUNCTION public.tellher_is_participant(_c uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT public.tellher_member_ready() AND EXISTS(SELECT 1 FROM public.conversation_participants WHERE conversation_id=_c AND member_id=auth.uid()); $$;
CREATE OR REPLACE FUNCTION public.tellher_is_direct(_a uuid,_b uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT public.tellher_member_ready() AND _a<>_b AND EXISTS(SELECT 1 FROM public.trust_connections WHERE status='accepted' AND ((requester_id=_a AND recipient_id=_b) OR (requester_id=_b AND recipient_id=_a))); $$;
CREATE OR REPLACE FUNCTION public.tellher_unread_notifications() RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT count(*)::int FROM public.notifications WHERE recipient_id=auth.uid() AND read_at IS NULL AND public.tellher_member_ready(); $$;
REVOKE EXECUTE ON FUNCTION public.tellher_notify_trust(uuid,text,text,text), public.tellher_ripple_audience(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tellher_notify_trust(uuid,text,text,text), public.tellher_ripple_audience(uuid,text) TO service_role;