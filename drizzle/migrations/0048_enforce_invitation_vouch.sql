CREATE OR REPLACE FUNCTION public.tellher_create_membership_invite(_vouch boolean DEFAULT false)
RETURNS TABLE(id uuid, code text, expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$ DECLARE c text; rid uuid; exp timestamptz := now() + interval '7 days'; BEGIN
 IF _vouch IS DISTINCT FROM true OR NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Membership and personal vouch required'; END IF;
 c := upper(encode(extensions.gen_random_bytes(16), 'hex'));
 INSERT INTO public.trust_codes(creator_id, code_hash, max_uses, expires_at, membership_invite) VALUES(auth.uid(), public.tellher_trust_code_hash(c), 1, exp, true) RETURNING trust_codes.id INTO rid;
 RETURN QUERY SELECT rid, c, exp;
END $$;
REVOKE ALL ON FUNCTION public.tellher_create_membership_invite(), public.tellher_create_membership_invite(boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tellher_create_membership_invite(boolean) TO authenticated, service_role;
COMMENT ON FUNCTION public.tellher_create_membership_invite() IS 'DEPRECATED: no-argument admission invitation replaced by explicit personal vouch';
DO $$ DECLARE r record; d text; BEGIN
 FOR r IN SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('tellher_preview_trust_code','tellher_redeem_trust_code') LOOP
 d := pg_get_functiondef(r.oid);
 d := replace(d, 'code_hash = public.tellher_trust_code_hash(_code)', 'code_hash = public.tellher_trust_code_hash(_code) AND NOT membership_invite');
 EXECUTE d;
 END LOOP;
END $$;