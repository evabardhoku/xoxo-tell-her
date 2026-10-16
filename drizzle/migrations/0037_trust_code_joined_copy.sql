CREATE OR REPLACE FUNCTION public.tellher_redeem_trust_code(_code text)
 RETURNS TABLE(status text, first_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE tc public.trust_codes; me uuid := auth.uid(); conn public.trust_connections; fname text; myname text;
BEGIN
  IF NOT public.tellher_member_ready() THEN RETURN QUERY SELECT 'not_ready'::text, NULL::text; RETURN; END IF;
  IF NOT public.tellher_trust_code_allowed() THEN RETURN QUERY SELECT 'rate_limited'::text, NULL::text; RETURN; END IF;
  SELECT * INTO tc FROM public.trust_codes WHERE code_hash = public.tellher_trust_code_hash(_code) FOR UPDATE;
  IF NOT FOUND OR tc.cancelled_at IS NOT NULL OR tc.expires_at <= now() OR tc.uses >= tc.max_uses THEN
    INSERT INTO public.trust_code_attempts(member_id, ok) VALUES (me, false);
    RETURN QUERY SELECT CASE WHEN tc.id IS NOT NULL AND tc.expires_at <= now() THEN 'expired' ELSE 'invalid' END, NULL::text; RETURN;
  END IF;
  IF tc.creator_id = me THEN RETURN QUERY SELECT 'own'::text, NULL::text; RETURN; END IF;
  IF public.tellher_is_blocked(tc.creator_id, me) THEN RETURN QUERY SELECT 'unavailable'::text, NULL::text; RETURN; END IF;
  SELECT p.first_name INTO fname FROM public.profiles p WHERE p.id = tc.creator_id;
  SELECT * INTO conn FROM public.trust_connections t
    WHERE (t.requester_id = tc.creator_id AND t.recipient_id = me) OR (t.requester_id = me AND t.recipient_id = tc.creator_id)
    ORDER BY (t.status = 'accepted') DESC LIMIT 1 FOR UPDATE;
  IF FOUND AND conn.status = 'accepted' THEN RETURN QUERY SELECT 'already'::text, fname; RETURN; END IF;
  IF FOUND THEN
    UPDATE public.trust_connections SET status = 'accepted', updated_at = now() WHERE id = conn.id;
  ELSE
    INSERT INTO public.trust_connections(requester_id, recipient_id, status) VALUES (tc.creator_id, me, 'accepted');
  END IF;
  UPDATE public.trust_codes SET uses = uses + 1 WHERE id = tc.id;
  INSERT INTO public.trust_code_redemptions(code_id, redeemer_id) VALUES (tc.id, me) ON CONFLICT DO NOTHING;
  INSERT INTO public.trust_code_attempts(member_id, ok) VALUES (me, true);
  SELECT p.first_name INTO myname FROM public.profiles p WHERE p.id = me;
  INSERT INTO public.notifications(recipient_id, kind, title, body, link)
    VALUES (tc.creator_id, 'trust_code', myname || ' joined your Circle.', 'You met in person and are now in each other''s Circle.', '/circle');
  RETURN QUERY SELECT 'connected'::text, fname;
END $function$;