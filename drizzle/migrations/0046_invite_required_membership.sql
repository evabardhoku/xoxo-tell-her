CREATE TABLE public.member_access (
 member_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 admitted_at timestamptz NOT NULL DEFAULT now(),
 admission_source text NOT NULL DEFAULT 'invitation'
);
GRANT SELECT ON public.member_access TO authenticated;
GRANT ALL ON public.member_access TO service_role;
ALTER TABLE public.member_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own admission" ON public.member_access FOR SELECT TO authenticated USING (member_id = auth.uid());
INSERT INTO public.member_access(member_id, admission_source) SELECT id, 'existing_member' FROM public.profiles;
ALTER TABLE public.trust_codes ADD COLUMN membership_invite boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.tellher_enrollment_ready()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles p JOIN auth.users u ON u.id = p.id WHERE p.id = auth.uid() AND p.woman_attested_at IS NOT NULL AND btrim(p.first_name) <> '' AND btrim(p.last_name) <> '' AND u.email_confirmed_at IS NOT NULL); $$;
CREATE OR REPLACE FUNCTION public.tellher_member_ready()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT public.tellher_enrollment_ready() AND EXISTS (SELECT 1 FROM public.member_access WHERE member_id = auth.uid()); $$;
CREATE OR REPLACE FUNCTION public.tellher_create_membership_invite()
RETURNS TABLE(id uuid, code text, expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$ DECLARE c text; rid uuid; exp timestamptz := now() + interval '7 days'; BEGIN
 IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Membership required'; END IF;
 c := upper(encode(extensions.gen_random_bytes(16), 'hex'));
 INSERT INTO public.trust_codes(creator_id, code_hash, max_uses, expires_at, membership_invite) VALUES(auth.uid(), public.tellher_trust_code_hash(c), 1, exp, true) RETURNING trust_codes.id INTO rid;
 RETURN QUERY SELECT rid, c, exp;
END $$;
CREATE OR REPLACE FUNCTION public.tellher_redeem_membership_invite(_code text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$ DECLARE tc public.trust_codes; me uuid := auth.uid(); BEGIN
 IF NOT public.tellher_enrollment_ready() THEN RETURN 'not_ready'; END IF;
 PERFORM 1 FROM public.profiles WHERE id = me FOR UPDATE;
 IF EXISTS (SELECT 1 FROM public.member_access WHERE member_id = me) THEN RETURN 'already'; END IF;
 IF NOT public.tellher_trust_code_allowed() THEN RETURN 'rate_limited'; END IF;
 SELECT * INTO tc FROM public.trust_codes WHERE code_hash = public.tellher_trust_code_hash(_code) AND membership_invite FOR UPDATE;
 IF NOT FOUND OR tc.cancelled_at IS NOT NULL OR tc.expires_at <= now() OR tc.uses >= 1 OR tc.creator_id = me
 OR NOT EXISTS(SELECT 1 FROM public.member_access a JOIN public.profiles p ON p.id=a.member_id JOIN auth.users u ON u.id=p.id WHERE a.member_id=tc.creator_id AND p.woman_attested_at IS NOT NULL AND u.email_confirmed_at IS NOT NULL)
 OR public.tellher_is_blocked(tc.creator_id, me) THEN
 INSERT INTO public.trust_code_attempts(member_id, ok) VALUES(me, false); RETURN 'invalid'; END IF;
 INSERT INTO public.member_access(member_id, invited_by) VALUES(me, tc.creator_id);
 UPDATE public.trust_codes SET uses = 1 WHERE id = tc.id;
 INSERT INTO public.trust_code_redemptions(code_id, redeemer_id) VALUES(tc.id, me);
 INSERT INTO public.trust_code_attempts(member_id, ok) VALUES(me, true);
 RETURN 'admitted';
END $$;
REVOKE ALL ON FUNCTION public.tellher_enrollment_ready(), public.tellher_create_membership_invite(), public.tellher_redeem_membership_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_enrollment_ready(), public.tellher_create_membership_invite(), public.tellher_redeem_membership_invite(text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.tellher_member_ready() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_member_ready() TO authenticated, service_role;
COMMENT ON TABLE public.member_access IS 'Private admission receipts. Existing profiles retained at rollout; new accounts require a confirmed email, attestation and single-use membership invitation. No gender verification.';
COMMENT ON COLUMN public.trust_codes.membership_invite IS 'Dedicated admission invitation; ordinary connection and group codes do not grant membership.';
CREATE POLICY "Membership required for community tables" ON public.wingwoman_messages AS RESTRICTIVE FOR ALL TO authenticated USING(public.tellher_member_ready()) WITH CHECK(public.tellher_member_ready());
CREATE POLICY "Membership required for session updates" ON public.wingwoman_sessions AS RESTRICTIVE FOR ALL TO authenticated USING(public.tellher_member_ready()) WITH CHECK(public.tellher_member_ready());
CREATE POLICY "Membership required for conversation reads" ON public.conversations AS RESTRICTIVE FOR ALL TO authenticated USING(public.tellher_member_ready()) WITH CHECK(public.tellher_member_ready());
CREATE POLICY "Membership required for participants" ON public.conversation_participants AS RESTRICTIVE FOR ALL TO authenticated USING(public.tellher_member_ready()) WITH CHECK(public.tellher_member_ready());
CREATE POLICY "Membership required for notifications" ON public.notifications AS RESTRICTIVE FOR ALL TO authenticated USING(public.tellher_member_ready()) WITH CHECK(public.tellher_member_ready());