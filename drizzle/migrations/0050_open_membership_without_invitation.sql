-- Temporarily open membership: any confirmed, attested account with names is a member.
CREATE OR REPLACE FUNCTION public.tellher_member_ready() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$ SELECT public.tellher_enrollment_ready(); $$;
-- A stale or invalid invitation in signup metadata must never block account creation.
CREATE OR REPLACE FUNCTION public.tellher_signup_invitation_trigger() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 BEGIN
  IF TG_OP='INSERT' THEN PERFORM public.tellher_claim_signup_invitation(NEW.id,NEW.raw_user_meta_data->>'membership_invite'); END IF;
  PERFORM public.tellher_finish_invitation(NEW.id);
 EXCEPTION WHEN OTHERS THEN NULL;
 END;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.tellher_signup_invitation_trigger() FROM PUBLIC,anon,authenticated;