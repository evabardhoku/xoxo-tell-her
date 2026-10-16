CREATE TABLE public.trust_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code_hash text NOT NULL UNIQUE,
  max_uses integer NOT NULL DEFAULT 1,
  uses integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT (id, creator_id, max_uses, uses, expires_at, cancelled_at, created_at) ON public.trust_codes TO authenticated;
GRANT ALL ON public.trust_codes TO service_role;
ALTER TABLE public.trust_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators read own codes" ON public.trust_codes FOR SELECT TO authenticated USING (creator_id = auth.uid());

CREATE TABLE public.trust_code_redemptions (
  code_id uuid NOT NULL REFERENCES public.trust_codes(id) ON DELETE CASCADE,
  redeemer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (code_id, redeemer_id)
);
GRANT ALL ON public.trust_code_redemptions TO service_role;
ALTER TABLE public.trust_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.trust_code_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ok boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX trust_code_attempts_member ON public.trust_code_attempts(member_id, created_at);
GRANT ALL ON public.trust_code_attempts TO service_role;
ALTER TABLE public.trust_code_attempts ENABLE ROW LEVEL SECURITY;

INSERT INTO public.rate_limits VALUES ('trust_code', 10, 3600), ('trust_code_fail', 10, 900) ON CONFLICT (action) DO NOTHING;
CREATE TRIGGER rl_trust_code BEFORE INSERT ON public.trust_codes FOR EACH ROW EXECUTE FUNCTION public.tellher_rate_limit('trust_code','creator_id');

CREATE OR REPLACE FUNCTION public.tellher_trust_code_hash(_code text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public
AS $$ SELECT encode(extensions.digest(regexp_replace(upper(coalesce(_code,'')), '[^A-Z0-9]', '', 'g'), 'sha256'), 'hex') $$;

CREATE OR REPLACE FUNCTION public.tellher_create_trust_code(_group boolean DEFAULT false)
RETURNS TABLE(id uuid, code text, expires_at timestamptz, max_uses integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; b bytea; c text := ''; i int; rid uuid; exp timestamptz; mu int;
BEGIN
  IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  b := extensions.gen_random_bytes(10);
  FOR i IN 0..9 LOOP c := c || substr(alphabet, (get_byte(b, i) % 31) + 1, 1); END LOOP;
  mu := CASE WHEN _group THEN 5 ELSE 1 END;
  exp := now() + CASE WHEN _group THEN interval '2 hours' ELSE interval '15 minutes' END;
  INSERT INTO public.trust_codes(creator_id, code_hash, max_uses, expires_at) VALUES (auth.uid(), public.tellher_trust_code_hash(c), mu, exp) RETURNING trust_codes.id INTO rid;
  RETURN QUERY SELECT rid, substr(c,1,5) || '-' || substr(c,6,5), exp, mu;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_cancel_trust_code(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.trust_codes SET cancelled_at = now() WHERE id = _id AND creator_id = auth.uid() AND cancelled_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Code not found'; END IF;
END $$;

-- Shared guard: counts recent failures; returns false when the member must wait.
CREATE OR REPLACE FUNCTION public.tellher_trust_code_allowed()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT (SELECT count(*) FROM public.trust_code_attempts a WHERE a.member_id = auth.uid() AND NOT a.ok
  AND a.created_at > now() - make_interval(secs => (SELECT window_seconds FROM public.rate_limits WHERE action='trust_code_fail')))
  < (SELECT max_count FROM public.rate_limits WHERE action='trust_code_fail') $$;

-- Minimal confirmation before redeeming: creator first name only.
CREATE OR REPLACE FUNCTION public.tellher_preview_trust_code(_code text)
RETURNS TABLE(status text, first_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE tc public.trust_codes;
BEGIN
  IF NOT public.tellher_member_ready() THEN RETURN QUERY SELECT 'not_ready'::text, NULL::text; RETURN; END IF;
  IF NOT public.tellher_trust_code_allowed() THEN RETURN QUERY SELECT 'rate_limited'::text, NULL::text; RETURN; END IF;
  SELECT * INTO tc FROM public.trust_codes WHERE code_hash = public.tellher_trust_code_hash(_code);
  IF NOT FOUND OR tc.cancelled_at IS NOT NULL OR tc.expires_at <= now() OR tc.uses >= tc.max_uses THEN
    INSERT INTO public.trust_code_attempts(member_id, ok) VALUES (auth.uid(), false);
    RETURN QUERY SELECT CASE WHEN FOUND AND tc.expires_at <= now() THEN 'expired' ELSE 'invalid' END, NULL::text; RETURN;
  END IF;
  IF tc.creator_id = auth.uid() THEN RETURN QUERY SELECT 'own'::text, NULL::text; RETURN; END IF;
  IF public.tellher_is_blocked(tc.creator_id, auth.uid()) THEN RETURN QUERY SELECT 'unavailable'::text, NULL::text; RETURN; END IF;
  RETURN QUERY SELECT 'ok'::text, p.first_name FROM public.profiles p WHERE p.id = tc.creator_id;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_redeem_trust_code(_code text)
RETURNS TABLE(status text, first_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE tc public.trust_codes; me uuid := auth.uid(); conn public.trust_connections; fname text; myname text;
BEGIN
  IF NOT public.tellher_member_ready() THEN RETURN QUERY SELECT 'not_ready'::text, NULL::text; RETURN; END IF;
  IF NOT public.tellher_trust_code_allowed() THEN RETURN QUERY SELECT 'rate_limited'::text, NULL::text; RETURN; END IF;
  -- Row lock serialises concurrent redemptions so uses never exceed max_uses.
  SELECT * INTO tc FROM public.trust_codes WHERE code_hash = public.tellher_trust_code_hash(_code) FOR UPDATE;
  IF NOT FOUND OR tc.cancelled_at IS NOT NULL OR tc.expires_at <= now() OR tc.uses >= tc.max_uses THEN
    INSERT INTO public.trust_code_attempts(member_id, ok) VALUES (me, false);
    RETURN QUERY SELECT CASE WHEN FOUND AND tc.expires_at <= now() THEN 'expired' ELSE 'invalid' END, NULL::text; RETURN;
  END IF;
  IF tc.creator_id = me THEN RETURN QUERY SELECT 'own'::text, NULL::text; RETURN; END IF;
  IF public.tellher_is_blocked(tc.creator_id, me) THEN RETURN QUERY SELECT 'unavailable'::text, NULL::text; RETURN; END IF;
  SELECT p.first_name INTO fname FROM public.profiles p WHERE p.id = tc.creator_id;
  SELECT * INTO conn FROM public.trust_connections t
    WHERE (t.requester_id = tc.creator_id AND t.recipient_id = me) OR (t.requester_id = me AND t.recipient_id = tc.creator_id)
    ORDER BY (t.status = 'accepted') DESC LIMIT 1 FOR UPDATE;
  IF FOUND AND conn.status = 'accepted' THEN RETURN QUERY SELECT 'already'::text, fname; RETURN; END IF;
  IF FOUND AND conn.status = 'pending' THEN
    UPDATE public.trust_connections SET status = 'accepted', updated_at = now() WHERE id = conn.id;
  ELSIF FOUND THEN
    UPDATE public.trust_connections SET status = 'accepted', updated_at = now() WHERE id = conn.id;
  ELSE
    INSERT INTO public.trust_connections(requester_id, recipient_id, status) VALUES (tc.creator_id, me, 'accepted');
  END IF;
  UPDATE public.trust_codes SET uses = uses + 1 WHERE id = tc.id;
  INSERT INTO public.trust_code_redemptions(code_id, redeemer_id) VALUES (tc.id, me) ON CONFLICT DO NOTHING;
  INSERT INTO public.trust_code_attempts(member_id, ok) VALUES (me, true);
  SELECT p.first_name INTO myname FROM public.profiles p WHERE p.id = me;
  INSERT INTO public.notifications(recipient_id, kind, title, body, link)
    VALUES (tc.creator_id, 'trust_code', myname || ' connected with you through your Trust Code.', 'You are now in each other''s Direct Circle.', '/circle');
  RETURN QUERY SELECT 'connected'::text, fname;
END $$;
REVOKE EXECUTE ON FUNCTION public.tellher_create_trust_code(boolean), public.tellher_cancel_trust_code(uuid), public.tellher_preview_trust_code(text), public.tellher_redeem_trust_code(text), public.tellher_trust_code_allowed() FROM anon;