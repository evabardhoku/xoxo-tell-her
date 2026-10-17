CREATE TABLE public.membership_invitation_claims (
 member_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 code_id uuid NOT NULL UNIQUE REFERENCES public.trust_codes(id) ON DELETE CASCADE,
 claimed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.membership_invitation_claims TO authenticated;
GRANT ALL ON public.membership_invitation_claims TO service_role;
ALTER TABLE public.membership_invitation_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_invitation_claim ON public.membership_invitation_claims FOR SELECT TO authenticated USING (member_id=auth.uid());
CREATE OR REPLACE FUNCTION public.tellher_claim_signup_invitation(_member uuid, _code text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE tc public.trust_codes;
BEGIN
 IF _code IS NULL OR btrim(_code)='' OR EXISTS(SELECT 1 FROM public.member_access WHERE member_id=_member) THEN RETURN; END IF;
 SELECT * INTO tc FROM public.trust_codes WHERE code_hash=public.tellher_trust_code_hash(_code) AND membership_invite FOR UPDATE;
 IF NOT FOUND OR tc.cancelled_at IS NOT NULL OR tc.expires_at<=now() OR tc.uses>=tc.max_uses OR tc.creator_id=_member OR public.tellher_is_blocked(tc.creator_id,_member)
 OR NOT EXISTS(SELECT 1 FROM public.member_access a JOIN public.profiles p ON p.id=a.member_id JOIN auth.users u ON u.id=p.id WHERE a.member_id=tc.creator_id AND p.woman_attested_at IS NOT NULL AND u.email_confirmed_at IS NOT NULL) THEN
 RAISE EXCEPTION 'This membership invitation is unavailable. Please ask for a new membership invitation link.';
 END IF;
 INSERT INTO public.membership_invitation_claims(member_id,code_id) VALUES(_member,tc.id);
 UPDATE public.trust_codes SET uses=uses+1 WHERE id=tc.id;
END $$;
REVOKE ALL ON FUNCTION public.tellher_claim_signup_invitation(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tellher_claim_signup_invitation(uuid,text) TO service_role;
CREATE OR REPLACE FUNCTION public.tellher_finish_invitation(_member uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE tc public.trust_codes;
BEGIN
 PERFORM 1 FROM public.profiles WHERE id=_member FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.profiles p JOIN auth.users u ON u.id=p.id WHERE p.id=_member AND p.woman_attested_at IS NOT NULL AND btrim(p.first_name)<>'' AND btrim(p.last_name)<>'' AND u.email_confirmed_at IS NOT NULL) THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM public.member_access WHERE member_id=_member) THEN RETURN true; END IF;
 SELECT t.* INTO tc FROM public.membership_invitation_claims c JOIN public.trust_codes t ON t.id=c.code_id WHERE c.member_id=_member FOR UPDATE OF t;
 IF NOT FOUND OR tc.cancelled_at IS NOT NULL OR tc.creator_id=_member OR public.tellher_is_blocked(tc.creator_id,_member)
 OR NOT EXISTS(SELECT 1 FROM public.member_access a JOIN public.profiles p ON p.id=a.member_id JOIN auth.users u ON u.id=p.id WHERE a.member_id=tc.creator_id AND p.woman_attested_at IS NOT NULL AND u.email_confirmed_at IS NOT NULL) THEN RETURN false; END IF;
 INSERT INTO public.member_access(member_id,invited_by) VALUES(_member,tc.creator_id);
 INSERT INTO public.trust_code_redemptions(code_id,redeemer_id) VALUES(tc.id,_member);
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.tellher_finish_invitation(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tellher_finish_invitation(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.tellher_complete_membership() RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$ SELECT public.tellher_finish_invitation(auth.uid()); $$;
REVOKE ALL ON FUNCTION public.tellher_complete_membership() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.tellher_complete_membership() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.tellher_signup_invitation_trigger() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='INSERT' THEN PERFORM public.tellher_claim_signup_invitation(NEW.id,NEW.raw_user_meta_data->>'membership_invite'); END IF;
 PERFORM public.tellher_finish_invitation(NEW.id);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.tellher_signup_invitation_trigger() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_tellher_invitation_on_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.tellher_signup_invitation_trigger();
CREATE TRIGGER tellher_invitation_on_confirmation AFTER UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL) EXECUTE FUNCTION public.tellher_signup_invitation_trigger();
COMMENT ON TABLE public.membership_invitation_claims IS 'Private one-use invitation reservation made at signup; email confirmation admits only the bound account. No automatic Circle connection. Expiry checked when claiming; cancellation and sponsor eligibility rechecked at admission.';