ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS audience_scope text NOT NULL DEFAULT 'circle';
UPDATE public.questions SET audience_scope = CASE reach WHEN 'extended' THEN 'extended' WHEN 'community' THEN 'community' ELSE 'circle' END;
ALTER TABLE public.questions ADD CONSTRAINT questions_audience_scope_check CHECK (audience_scope IN ('circle','extended','community'));
ALTER TABLE public.questions ADD CONSTRAINT questions_category_len CHECK (char_length(category) BETWEEN 1 AND 60);
COMMENT ON COLUMN public.questions.reach IS 'DEPRECATED: replaced by audience_scope';
ALTER TABLE public.question_private_meta ADD COLUMN IF NOT EXISTS instinct_note text CHECK (instinct_note IS NULL OR char_length(instinct_note) <= 2000);

CREATE TABLE public.question_audience (
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trust_distance smallint NOT NULL CHECK (trust_distance IN (1,2)),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, recipient_id)
);
GRANT SELECT ON public.question_audience TO authenticated;
GRANT ALL ON public.question_audience TO service_role;
ALTER TABLE public.question_audience ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipients read own audience rows" ON public.question_audience FOR SELECT TO authenticated
  USING (public.tellher_member_ready() AND recipient_id = (SELECT auth.uid()));

CREATE TABLE public.replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  perspective_tag text CHECK (perspective_tag IS NULL OR char_length(perspective_tag) <= 60),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.replies TO authenticated;
GRANT ALL ON public.replies TO service_role;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own replies" ON public.replies FOR SELECT TO authenticated
  USING (public.tellher_member_ready() AND author_id = (SELECT auth.uid()));

CREATE TABLE public.wingwoman_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '' CHECK (char_length(title) <= 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wingwoman_sessions TO authenticated;
GRANT ALL ON public.wingwoman_sessions TO service_role;
ALTER TABLE public.wingwoman_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads sessions" ON public.wingwoman_sessions FOR SELECT TO authenticated USING (public.tellher_member_ready() AND owner_id = (SELECT auth.uid()));
CREATE POLICY "Owner creates sessions" ON public.wingwoman_sessions FOR INSERT TO authenticated WITH CHECK (public.tellher_member_ready() AND owner_id = (SELECT auth.uid()));
CREATE POLICY "Owner updates sessions" ON public.wingwoman_sessions FOR UPDATE TO authenticated USING (owner_id = (SELECT auth.uid())) WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY "Owner deletes sessions" ON public.wingwoman_sessions FOR DELETE TO authenticated USING (owner_id = (SELECT auth.uid()));

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
  reply_id uuid REFERENCES public.replies(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 1000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(question_id, reply_id) = 1)
);
GRANT SELECT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own reports" ON public.reports FOR SELECT TO authenticated
  USING (public.tellher_member_ready() AND reporter_id = (SELECT auth.uid()));