REVOKE ALL ON public.ripple_letters FROM authenticated, anon;
REVOKE ALL ON public.letter_helps FROM authenticated, anon;
GRANT SELECT (id, question_id, body, where_now, created_at, updated_at) ON public.ripple_letters TO authenticated;
GRANT UPDATE (body, where_now, updated_at) ON public.ripple_letters TO authenticated;
GRANT DELETE ON public.ripple_letters TO authenticated;