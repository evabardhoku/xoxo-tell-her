CREATE OR REPLACE FUNCTION public.validate_tellher_profile_details()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $$
DECLARE t text;
BEGIN
 NEW.occupation := nullif(btrim(NEW.occupation), '');
 IF NEW.occupation IS NOT NULL AND length(NEW.occupation) > 120 THEN RAISE EXCEPTION 'Occupation is too long'; END IF;
 IF cardinality(NEW.languages) > 8 OR cardinality(NEW.known_for) > 8 OR cardinality(NEW.ask_me_about) > 8 THEN RAISE EXCEPTION 'Up to 8 items per list'; END IF;
 FOREACH t IN ARRAY NEW.languages || NEW.known_for || NEW.ask_me_about LOOP
  IF t IS NULL OR length(btrim(t)) = 0 OR length(t) > 40 THEN RAISE EXCEPTION 'Each item must be 1-40 characters'; END IF;
 END LOOP;
 RETURN NEW;
END $$;