ALTER TABLE public.trust_notes ADD COLUMN linked_ripple_id uuid REFERENCES public.questions(id) ON DELETE SET NULL;
CREATE INDEX trust_notes_ripple_idx ON public.trust_notes(linked_ripple_id) WHERE linked_ripple_id IS NOT NULL;
CREATE TABLE public.field_note_identity_reveals (
 question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
 member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 confirmed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(question_id, member_id)
);
GRANT ALL ON public.field_note_identity_reveals TO service_role;
ALTER TABLE public.field_note_identity_reveals ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE ON public.trust_notes FROM authenticated;
GRANT INSERT(author_id,title,body,topic,location), UPDATE(title,body,topic,location) ON public.trust_notes TO authenticated;
CREATE OR REPLACE FUNCTION public.validate_field_note_link() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
 IF TG_OP = 'INSERT' OR NEW.body IS DISTINCT FROM OLD.body THEN
  IF char_length(btrim(NEW.body)) NOT BETWEEN 20 AND 2500 THEN RAISE EXCEPTION 'Field Notes must contain 20 to 2500 characters'; END IF;
 END IF;
 IF NEW.linked_ripple_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.linked_ripple_id IS DISTINCT FROM OLD.linked_ripple_id) THEN
  IF auth.uid() IS DISTINCT FROM NEW.author_id OR NOT public.tellher_can_view(NEW.linked_ripple_id) THEN RAISE EXCEPTION 'This Ripple is not available to link'; END IF;
  IF EXISTS(SELECT 1 FROM public.question_private_meta m JOIN public.questions q ON q.id=m.question_id WHERE m.question_id=NEW.linked_ripple_id AND m.owner_id=NEW.author_id AND q.author_visibility='anonymous') AND NOT EXISTS(SELECT 1 FROM public.field_note_identity_reveals r WHERE r.question_id=NEW.linked_ripple_id AND r.member_id=NEW.author_id) THEN RAISE EXCEPTION 'Explicit identity reveal confirmation required'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_field_note_link BEFORE INSERT OR UPDATE ON public.trust_notes FOR EACH ROW EXECUTE FUNCTION public.validate_field_note_link();
CREATE OR REPLACE FUNCTION public.tellher_save_field_note(_id uuid, _title text, _body text, _topic text, _location text, _ripple uuid DEFAULT NULL, _confirm_reveal boolean DEFAULT false) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE me uuid := auth.uid(); nid uuid := coalesce(_id,gen_random_uuid()); old_link uuid;
BEGIN
 IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
 IF _id IS NOT NULL THEN
  SELECT n.linked_ripple_id INTO old_link FROM public.trust_notes n WHERE n.id=_id AND n.author_id=me;
  IF NOT FOUND THEN RAISE EXCEPTION 'Only the author can edit this Field Note'; END IF;
 END IF;
 IF char_length(btrim(coalesce(_body,''))) NOT BETWEEN 20 AND 2500 THEN RAISE EXCEPTION 'Field Notes must contain 20 to 2500 characters'; END IF;
 IF _ripple IS NOT NULL AND _ripple IS DISTINCT FROM old_link THEN
  IF NOT public.tellher_can_view(_ripple) THEN RAISE EXCEPTION 'This Ripple is not available to link'; END IF;
  IF EXISTS(SELECT 1 FROM public.question_private_meta m JOIN public.questions q ON q.id=m.question_id WHERE m.question_id=_ripple AND m.owner_id=me AND q.author_visibility='anonymous') THEN
   IF NOT coalesce(_confirm_reveal,false) THEN RAISE EXCEPTION 'Explicit identity reveal confirmation required'; END IF;
   INSERT INTO public.field_note_identity_reveals(question_id,member_id) VALUES(_ripple,me) ON CONFLICT DO NOTHING;
  END IF;
 END IF;
 IF _id IS NULL THEN
  INSERT INTO public.trust_notes(id,author_id,title,body,topic,location,linked_ripple_id) VALUES(nid,me,btrim(_title),btrim(_body),_topic,nullif(btrim(_location),''),_ripple);
 ELSE
  UPDATE public.trust_notes SET title=btrim(_title),body=btrim(_body),topic=_topic,location=nullif(btrim(_location),''),linked_ripple_id=_ripple WHERE id=nid AND author_id=me;
 END IF;
 RETURN nid;
END $$;
REVOKE ALL ON FUNCTION public.tellher_save_field_note(uuid,text,text,text,text,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.tellher_save_field_note(uuid,text,text,text,text,uuid,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.tellher_field_note_context(_ids uuid[]) RETURNS TABLE(note_id uuid,question_id uuid,category text,perspective_count integer,identity_revealed boolean) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
 IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
 RETURN QUERY SELECT n.id,q.id,q.category,CASE WHEN c.n>=3 THEN c.n ELSE NULL END,EXISTS(SELECT 1 FROM public.field_note_identity_reveals r WHERE r.question_id=q.id AND r.member_id=n.author_id)
 FROM public.trust_notes n JOIN public.questions q ON q.id=n.linked_ripple_id
 CROSS JOIN LATERAL (SELECT count(*)::integer n FROM public.tellher_replies(q.id)) c
 WHERE n.id=ANY(_ids) AND public.tellher_can_view(q.id) AND EXISTS(SELECT 1 FROM public.tellher_member_profile(n.author_id));
END $$;
REVOKE ALL ON FUNCTION public.tellher_field_note_context(uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.tellher_field_note_context(uuid[]) TO authenticated;
CREATE OR REPLACE FUNCTION public.tellher_ripple_field_notes(_q uuid) RETURNS TABLE(id uuid,title text,body text,category text,location text,created_at timestamptz,member_id uuid,first_name text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
 IF NOT public.tellher_member_ready() OR NOT public.tellher_can_view(_q) THEN RETURN; END IF;
 RETURN QUERY SELECT n.id,n.title,n.body,n.topic,n.location,n.created_at,n.author_id,p.first_name FROM public.trust_notes n CROSS JOIN LATERAL public.tellher_member_profile(n.author_id) p WHERE n.linked_ripple_id=_q ORDER BY n.created_at DESC LIMIT 50;
END $$;
REVOKE ALL ON FUNCTION public.tellher_ripple_field_notes(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.tellher_ripple_field_notes(uuid) TO authenticated;