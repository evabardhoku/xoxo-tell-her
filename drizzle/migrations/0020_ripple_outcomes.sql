CREATE TABLE public.ripple_outcomes (
  question_id uuid PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
  status text CHECK (status IS NULL OR status IN ('boundary','moved_forward','observed','talked','left','figuring_out','other')),
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 280),
  note text CHECK (note IS NULL OR char_length(note) <= 2000),
  shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ripple_outcomes TO service_role;
ALTER TABLE public.ripple_outcomes ENABLE ROW LEVEL SECURITY;
-- No member policies: read and write only through the checked functions below; author identity is never stored here.

CREATE OR REPLACE FUNCTION public.tellher_is_question_author(_q uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.tellher_member_ready() AND EXISTS (SELECT 1 FROM question_private_meta WHERE question_id = _q AND owner_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.tellher_set_outcome(_q uuid, _status text, _summary text, _note text, _shared boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.tellher_is_question_author(_q) THEN RAISE EXCEPTION 'Only the woman who asked can add what happened next.'; END IF;
  IF char_length(btrim(coalesce(_summary, ''))) = 0 THEN RAISE EXCEPTION 'Add a short summary.'; END IF;
  INSERT INTO ripple_outcomes (question_id, status, summary, note, shared)
  VALUES (_q, nullif(_status, ''), btrim(_summary), nullif(btrim(coalesce(_note, '')), ''), coalesce(_shared, false))
  ON CONFLICT (question_id) DO UPDATE SET status = excluded.status, summary = excluded.summary, note = excluded.note, shared = excluded.shared, updated_at = now();
END $$;

CREATE OR REPLACE FUNCTION public.tellher_delete_outcome(_q uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.tellher_is_question_author(_q) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  DELETE FROM ripple_outcomes WHERE question_id = _q;
END $$;

-- Author sees her own (shared or private); others only shared outcomes on Ripples they can already view.
CREATE OR REPLACE FUNCTION public.tellher_outcome(_q uuid) RETURNS TABLE(status text, summary text, note text, shared boolean, updated_at timestamptz, is_mine boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.status, o.summary, o.note, o.shared, o.updated_at, public.tellher_is_question_author(_q)
  FROM ripple_outcomes o
  WHERE o.question_id = _q AND public.tellher_can_view(_q) AND (o.shared OR public.tellher_is_question_author(_q));
$$;

REVOKE ALL ON FUNCTION public.tellher_is_question_author(uuid), public.tellher_set_outcome(uuid, text, text, text, boolean), public.tellher_delete_outcome(uuid), public.tellher_outcome(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_is_question_author(uuid), public.tellher_set_outcome(uuid, text, text, text, boolean), public.tellher_delete_outcome(uuid), public.tellher_outcome(uuid) TO authenticated;