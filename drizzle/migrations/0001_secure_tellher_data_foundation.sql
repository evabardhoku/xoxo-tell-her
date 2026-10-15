ALTER TABLE public.profiles ADD COLUMN first_name text NOT NULL DEFAULT '', ADD COLUMN last_name text NOT NULL DEFAULT '', ADD COLUMN city text, ADD COLUMN country text, ADD COLUMN bio text, ADD COLUMN avatar_path text, ADD COLUMN woman_attested_at timestamptz, ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
COMMENT ON COLUMN public.profiles.display_name IS 'DEPRECATED: use explicit first_name and last_name; retained for compatibility.';
ALTER TABLE public.profiles ADD CONSTRAINT profile_text_limits CHECK (char_length(first_name) <= 80 AND char_length(last_name) <= 80 AND char_length(city) <= 100 AND char_length(country) <= 100 AND char_length(bio) <= 1000 AND char_length(avatar_path) <= 200);
CREATE FUNCTION public.validate_tellher_profile() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
 NEW.first_name := btrim(NEW.first_name); NEW.last_name := btrim(NEW.last_name);
 IF TG_OP = 'UPDATE' AND OLD.woman_attested_at IS NOT NULL AND NEW.woman_attested_at IS DISTINCT FROM OLD.woman_attested_at THEN RAISE EXCEPTION 'Community attestation cannot be changed'; END IF;
 IF NEW.woman_attested_at IS NOT NULL THEN
  IF NEW.first_name = '' OR NEW.last_name = '' THEN RAISE EXCEPTION 'First name and last name are required'; END IF;
  IF TG_OP = 'INSERT' OR OLD.woman_attested_at IS NULL THEN NEW.woman_attested_at := now(); END IF;
 END IF;
 IF NEW.avatar_path IS NOT NULL AND NEW.avatar_path !~ ('^' || NEW.id::text || '/[0-9a-f-]+\.(jpg|png|webp)$') THEN RAISE EXCEPTION 'Invalid private avatar path'; END IF;
 NEW.updated_at := now(); RETURN NEW;
END;
$$;
CREATE TRIGGER validate_tellher_profile BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_tellher_profile();
CREATE OR REPLACE FUNCTION public.create_tellher_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NEW.raw_app_meta_data->>'provider' = 'email' AND COALESCE(NEW.raw_user_meta_data->>'woman_attested', 'false') <> 'true' THEN RAISE EXCEPTION 'Community self-attestation is required'; END IF;
 INSERT INTO public.profiles (id, first_name, last_name, woman_attested_at) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'first_name', ''), COALESCE(NEW.raw_user_meta_data->>'last_name', ''), CASE WHEN NEW.raw_user_meta_data->>'woman_attested' = 'true' THEN now() ELSE NULL END);
 RETURN NEW;
END;
$$;
CREATE FUNCTION public.tellher_member_ready() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND woman_attested_at IS NOT NULL AND first_name <> '' AND last_name <> ''); $$;
REVOKE ALL ON FUNCTION public.tellher_member_ready() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_member_ready() TO authenticated;
CREATE TABLE public.trust_connections (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','revoked')), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK (requester_id <> recipient_id));
GRANT SELECT ON public.trust_connections TO authenticated;
GRANT ALL ON public.trust_connections TO service_role;
ALTER TABLE public.trust_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own trust connections" ON public.trust_connections FOR SELECT TO authenticated USING (public.tellher_member_ready() AND (requester_id = (SELECT auth.uid()) OR recipient_id = (SELECT auth.uid())));
CREATE UNIQUE INDEX trust_connection_pair ON public.trust_connections (LEAST(requester_id, recipient_id), GREATEST(requester_id, recipient_id));
CREATE TABLE public.questions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 5000), reach text NOT NULL DEFAULT 'direct' CHECK (reach IN ('direct','extended','community')), status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','closed','archived')), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.question_private_meta (question_id uuid PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE, owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, initial_instinct text CHECK (char_length(initial_instinct) <= 5000), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.question_private_meta TO authenticated;
GRANT ALL ON public.question_private_meta TO service_role;
ALTER TABLE public.question_private_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own private question metadata" ON public.question_private_meta FOR SELECT TO authenticated USING (public.tellher_member_ready() AND owner_id = (SELECT auth.uid()));
CREATE INDEX question_private_owner ON public.question_private_meta(owner_id);
CREATE POLICY "Read own questions only" ON public.questions FOR SELECT TO authenticated USING (public.tellher_member_ready() AND EXISTS (SELECT 1 FROM public.question_private_meta m WHERE m.question_id = questions.id AND m.owner_id = (SELECT auth.uid())));
COMMENT ON TABLE public.questions IS 'Foundation only: no member write grants or distribution policies; author identity is isolated in question_private_meta.';
COMMENT ON TABLE public.trust_connections IS 'Foundation only: writes disabled until secure invitation and acceptance workflows are implemented.';
CREATE POLICY "Read private own avatar" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "Upload private own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text AND name ~ ('^' || (SELECT auth.uid())::text || '/[0-9a-f-]+\.(jpg|png|webp)$'));
CREATE POLICY "Delete private own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);