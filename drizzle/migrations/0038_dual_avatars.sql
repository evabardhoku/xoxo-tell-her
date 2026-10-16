ALTER TABLE public.profiles ADD COLUMN open_avatar_type text NOT NULL DEFAULT 'photo';
ALTER TABLE public.profiles ADD COLUMN open_avatar_config jsonb;
ALTER TABLE public.profiles ADD COLUMN anonymous_style_config jsonb;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_open_avatar_type_check CHECK (open_avatar_type IN ('photo','illustrated'));
COMMENT ON COLUMN public.profiles.anonymous_style_config IS 'Private Undercover Look preferences. Owner-only; never returned by any function.';
ALTER TABLE public.questions ADD COLUMN anonymous_avatar jsonb;
COMMENT ON COLUMN public.questions.anonymous_avatar IS 'Resolved per-Ripple anonymous visual (traits only, no seed linking to the member).';

CREATE OR REPLACE FUNCTION public.validate_tellher_avatar_config() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
 IF NEW.open_avatar_config IS NOT NULL AND (jsonb_typeof(NEW.open_avatar_config) <> 'object' OR length(NEW.open_avatar_config::text) > 600) THEN RAISE EXCEPTION 'Invalid avatar'; END IF;
 IF NEW.anonymous_style_config IS NOT NULL AND (jsonb_typeof(NEW.anonymous_style_config) <> 'object' OR length(NEW.anonymous_style_config::text) > 400) THEN RAISE EXCEPTION 'Invalid style'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_tellher_avatar_config BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_tellher_avatar_config();

-- Each trait follows the private preference about half the time, otherwise random, so Ripples by one woman don't share a look.
CREATE OR REPLACE FUNCTION public.tellher_resolve_anonymous_avatar(_style jsonb) RETURNS jsonb LANGUAGE plpgsql VOLATILE SET search_path = '' AS $$
DECLARE r jsonb := '{}'::jsonb; k text; n int;
BEGIN
 FOREACH k IN ARRAY ARRAY['silhouette','palette','hair','accessory','motif'] LOOP
  n := CASE k WHEN 'palette' THEN 6 ELSE 4 END;
  r := r || jsonb_build_object(k, CASE WHEN _style ? k AND random() < 0.5 AND (_style->>k) ~ '^[0-9]$' THEN least((_style->>k)::int, n - 1) ELSE floor(random() * n)::int END);
 END LOOP;
 RETURN r || jsonb_build_object('variant', floor(random() * 360)::int);
END $$;

CREATE OR REPLACE FUNCTION public.tellher_assign_anonymous_avatar() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 UPDATE questions SET anonymous_avatar = tellher_resolve_anonymous_avatar((SELECT anonymous_style_config FROM profiles WHERE id = NEW.owner_id))
 WHERE id = NEW.question_id AND author_visibility = 'anonymous' AND anonymous_avatar IS NULL;
 RETURN NEW;
END $$;
CREATE TRIGGER assign_anonymous_avatar AFTER INSERT ON public.question_private_meta FOR EACH ROW EXECUTE FUNCTION public.tellher_assign_anonymous_avatar();

-- Existing anonymous Ripples get a safe random visual (no preferences existed).
UPDATE public.questions SET anonymous_avatar = public.tellher_resolve_anonymous_avatar(NULL) WHERE author_visibility = 'anonymous' AND anonymous_avatar IS NULL;

CREATE OR REPLACE FUNCTION public.tellher_anonymous_avatars(_ids uuid[]) RETURNS TABLE(question_id uuid, avatar jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
 IF cardinality(_ids) > 1000 THEN RAISE EXCEPTION 'Too many Ripples'; END IF;
 RETURN QUERY SELECT q.id, q.anonymous_avatar FROM questions q WHERE q.id = ANY(_ids) AND q.author_visibility = 'anonymous' AND tellher_can_view(q.id);
END $$;

-- Open avatars only for members whose safe profile the viewer may already see (or herself).
CREATE OR REPLACE FUNCTION public.tellher_open_avatars(_ids uuid[]) RETURNS TABLE(member_id uuid, kind text, config jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
 IF cardinality(_ids) > 200 THEN RAISE EXCEPTION 'Too many members'; END IF;
 RETURN QUERY SELECT p.id, p.open_avatar_type, CASE WHEN p.open_avatar_type = 'illustrated' THEN p.open_avatar_config END
 FROM profiles p WHERE p.id = ANY(_ids) AND (p.id = auth.uid() OR EXISTS (SELECT 1 FROM tellher_member_profile(p.id)));
END $$;

REVOKE ALL ON FUNCTION public.tellher_resolve_anonymous_avatar(jsonb), public.tellher_assign_anonymous_avatar() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tellher_anonymous_avatars(uuid[]), public.tellher_open_avatars(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_anonymous_avatars(uuid[]), public.tellher_open_avatars(uuid[]) TO authenticated;