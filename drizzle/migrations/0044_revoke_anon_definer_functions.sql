DO $$ DECLARE r record; BEGIN
FOR r IN SELECT p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.prosecdef AND p.proname IN ('validate_field_note_link','has_role','tellher_is_moderator','tellher_mod_reports','tellher_mod_act','tellher_rate_limit','tellher_create_trust_code','tellher_cancel_trust_code','tellher_trust_code_allowed','tellher_preview_trust_code','tellher_redeem_trust_code','tellher_constellation')
LOOP EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig); END LOOP; END $$;