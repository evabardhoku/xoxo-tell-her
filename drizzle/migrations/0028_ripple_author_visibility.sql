ALTER TABLE public.questions ADD COLUMN author_visibility text NOT NULL DEFAULT 'anonymous';
ALTER TABLE public.questions ADD CONSTRAINT questions_author_visibility_valid CHECK (author_visibility IN ('anonymous','named'));
CREATE FUNCTION public.tellher_lock_author_visibility() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN IF NEW.author_visibility IS DISTINCT FROM OLD.author_visibility THEN RAISE EXCEPTION 'Ripple identity is locked after publication'; END IF; RETURN NEW; END $$;
CREATE TRIGGER lock_ripple_author_visibility BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.tellher_lock_author_visibility();
CREATE FUNCTION public.tellher_publish_question_identity(_category text, _body text, _scope text, _instinct text, _note text, _author_visibility text DEFAULT 'anonymous') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE qid uuid;
BEGIN
 IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
 IF _author_visibility IS NULL OR _author_visibility NOT IN ('anonymous','named') THEN RAISE EXCEPTION 'Choose how you appear'; END IF;
 IF _category NOT IN ('Work','Dating & Boundaries','Housing & Moving','Travel','Services','Everyday Life') THEN RAISE EXCEPTION 'Choose a category'; END IF;
 IF char_length(trim(coalesce(_body,''))) < 10 OR char_length(_body) > 2000 THEN RAISE EXCEPTION 'Your question should be 10 to 2000 characters'; END IF;
 IF _scope IS NULL OR _scope NOT IN ('circle','extended','community') THEN RAISE EXCEPTION 'Choose how far it travels'; END IF;
 IF _instinct IS NULL OR _instinct NOT IN ('feels_okay','unsure','feels_off') THEN RAISE EXCEPTION 'Choose your instinct'; END IF;
 IF _note IS NOT NULL AND char_length(_note) > 140 THEN RAISE EXCEPTION 'Keep the note to one line'; END IF;
 IF _scope <> 'community' AND NOT EXISTS (SELECT 1 FROM public.tellher_ripple_audience(auth.uid(), _scope)) THEN RAISE EXCEPTION 'No one is in this reach yet'; END IF;
 INSERT INTO public.questions(body, category, audience_scope, reach, status, author_visibility) VALUES(trim(_body),_category,_scope,CASE WHEN _scope='circle' THEN 'direct' ELSE _scope END,'open',_author_visibility) RETURNING id INTO qid;
 INSERT INTO public.question_private_meta(question_id,owner_id,initial_instinct,instinct_note) VALUES(qid,auth.uid(),_instinct,nullif(trim(coalesce(_note,'')),''));
 IF _scope <> 'community' THEN INSERT INTO public.question_audience(question_id,recipient_id,trust_distance) SELECT qid,a.recipient_id,a.trust_distance FROM public.tellher_ripple_audience(auth.uid(),_scope) a; END IF;
 RETURN qid;
END $$;
REVOKE ALL ON FUNCTION public.tellher_publish_question_identity(text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_publish_question_identity(text,text,text,text,text,text) TO authenticated;
CREATE FUNCTION public.tellher_ripple_identities(_ids uuid[]) RETURNS TABLE(question_id uuid,author_visibility text,first_name text,profile_id uuid,has_avatar boolean) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
 IF cardinality(_ids) > 1000 THEN RAISE EXCEPTION 'Too many Ripples'; END IF;
 RETURN QUERY SELECT q.id,q.author_visibility,CASE WHEN q.author_visibility='named' THEN p.first_name END,CASE WHEN q.author_visibility='named' AND mp.first_name IS NOT NULL THEN p.id END,CASE WHEN q.author_visibility='named' AND mp.first_name IS NOT NULL THEN mp.has_avatar ELSE false END
 FROM public.questions q
 JOIN public.question_private_meta m ON m.question_id=q.id
 LEFT JOIN public.profiles p ON q.author_visibility='named' AND p.id=m.owner_id
 LEFT JOIN LATERAL public.tellher_member_profile(p.id) mp ON q.author_visibility='named' AND p.id IS NOT NULL
 WHERE q.id=ANY(_ids) AND public.tellher_can_view(q.id);
END $$;
REVOKE ALL ON FUNCTION public.tellher_ripple_identities(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_ripple_identities(uuid[]) TO authenticated;
COMMENT ON COLUMN public.questions.author_visibility IS 'Independent of reach; immutable after insert. Ownership remains in private metadata.';