CREATE OR REPLACE FUNCTION public.tellher_save_field_note(_id uuid DEFAULT NULL, _title text DEFAULT NULL, _body text DEFAULT NULL, _topic text DEFAULT NULL, _location text DEFAULT NULL, _ripple uuid DEFAULT NULL, _confirm_reveal boolean DEFAULT false) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE me uuid := auth.uid(); nid uuid := coalesce(_id,gen_random_uuid()); old_link uuid;
BEGIN
 IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
 IF _id IS NOT NULL THEN
  SELECT n.linked_ripple_id INTO old_link FROM public.trust_notes n WHERE n.id=_id AND n.author_id=me;
  IF NOT FOUND THEN RAISE EXCEPTION 'Only the author can edit this Field Note'; END IF;
 END IF;
 IF char_length(btrim(coalesce(_body,''))) NOT BETWEEN 20 AND 2500 OR char_length(btrim(coalesce(_title,''))) NOT BETWEEN 4 AND 140 OR _topic IS NULL THEN RAISE EXCEPTION 'Check the Field Note title, topic and body'; END IF;
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