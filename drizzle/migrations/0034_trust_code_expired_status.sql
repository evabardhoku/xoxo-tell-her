DO $$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY['public.tellher_preview_trust_code(text)','public.tellher_redeem_trust_code(text)'] LOOP
    EXECUTE replace(pg_get_functiondef(f::regprocedure), 'WHEN FOUND AND tc.expires_at', 'WHEN tc.id IS NOT NULL AND tc.expires_at');
  END LOOP;
END $$;