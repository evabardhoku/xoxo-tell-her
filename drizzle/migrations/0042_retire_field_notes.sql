REVOKE ALL ON FUNCTION public.tellher_save_field_note(uuid, text, text, text, text, uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tellher_field_note_context(uuid[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tellher_ripple_field_notes(uuid) FROM PUBLIC, anon, authenticated;
COMMENT ON FUNCTION public.tellher_save_field_note(uuid, text, text, text, text, uuid, boolean) IS 'DEPRECATED: Field Notes feature removed; Picks remain.';
COMMENT ON FUNCTION public.tellher_field_note_context(uuid[]) IS 'DEPRECATED: Field Notes feature removed.';
COMMENT ON FUNCTION public.tellher_ripple_field_notes(uuid) IS 'DEPRECATED: Field Notes feature removed.';
COMMENT ON COLUMN public.trust_notes.linked_ripple_id IS 'DEPRECATED: Field Notes feature removed; rows retained for data export only.';