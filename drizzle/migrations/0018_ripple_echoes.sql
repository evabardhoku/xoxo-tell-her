CREATE TABLE public.ripple_echoes (
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, member_id)
);
GRANT SELECT ON public.ripple_echoes TO authenticated;
GRANT ALL ON public.ripple_echoes TO service_role;
ALTER TABLE public.ripple_echoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own echoes" ON public.ripple_echoes FOR SELECT TO authenticated USING (member_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.tellher_echo(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.tellher_can_view(_id) THEN RAISE EXCEPTION 'This question is not available.'; END IF;
  IF EXISTS (SELECT 1 FROM question_private_meta WHERE question_id = _id AND owner_id = auth.uid()) THEN RAISE EXCEPTION 'You cannot echo your own Ripple.'; END IF;
  INSERT INTO ripple_echoes (question_id, member_id) VALUES (_id, auth.uid()) ON CONFLICT DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_unecho(_id uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM ripple_echoes WHERE question_id = _id AND member_id = auth.uid();
$$;

-- Exact count only at or above the privacy threshold of 3; never identities.
CREATE OR REPLACE FUNCTION public.tellher_echo_signal(_id uuid) RETURNS TABLE(echo_count integer, below_threshold boolean, mine boolean) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH n AS (SELECT count(*)::int AS c FROM ripple_echoes WHERE question_id = _id)
  SELECT CASE WHEN n.c >= 3 THEN n.c END, n.c > 0 AND n.c < 3,
         EXISTS (SELECT 1 FROM ripple_echoes WHERE question_id = _id AND member_id = auth.uid())
  FROM n WHERE public.tellher_can_view(_id);
$$;
REVOKE ALL ON FUNCTION public.tellher_echo(uuid), public.tellher_unecho(uuid), public.tellher_echo_signal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_echo(uuid), public.tellher_unecho(uuid), public.tellher_echo_signal(uuid) TO authenticated;