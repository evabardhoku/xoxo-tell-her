DROP INDEX IF EXISTS public.trust_connection_pair;
CREATE UNIQUE INDEX trust_connection_active_edge ON public.trust_connections (requester_id, recipient_id) WHERE status IN ('pending','accepted');
ALTER TABLE public.trust_connections DROP CONSTRAINT IF EXISTS trust_connections_status_check;
ALTER TABLE public.trust_connections ADD CONSTRAINT trust_connections_status_check CHECK (status IN ('pending','accepted','declined','cancelled')) NOT VALID;
ALTER TABLE public.trust_connections DROP CONSTRAINT IF EXISTS trust_connections_no_self;
ALTER TABLE public.trust_connections ADD CONSTRAINT trust_connections_no_self CHECK (requester_id <> recipient_id) NOT VALID;

CREATE OR REPLACE FUNCTION public.tellher_find_member(_email text)
RETURNS TABLE (member_id uuid, first_name text, last_initial text, city text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN QUERY SELECT p.id, p.first_name, left(p.last_name, 1), p.city
    FROM auth.users u JOIN public.profiles p ON p.id = u.id
    WHERE lower(u.email) = lower(trim(_email)) AND p.woman_attested_at IS NOT NULL AND p.id <> auth.uid()
    LIMIT 1;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_send_trust(_recipient uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF _recipient = auth.uid() THEN RAISE EXCEPTION 'You cannot add yourself'; END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = _recipient AND woman_attested_at IS NOT NULL) THEN RAISE EXCEPTION 'Member not found'; END IF;
  IF EXISTS (SELECT 1 FROM trust_connections WHERE requester_id = auth.uid() AND recipient_id = _recipient AND status IN ('pending','accepted')) THEN RAISE EXCEPTION 'A request already exists'; END IF;
  INSERT INTO trust_connections (requester_id, recipient_id) VALUES (auth.uid(), _recipient);
END $$;

CREATE OR REPLACE FUNCTION public.tellher_respond_trust(_id uuid, _accept boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  UPDATE trust_connections SET status = CASE WHEN _accept THEN 'accepted' ELSE 'declined' END, updated_at = now()
    WHERE id = _id AND recipient_id = auth.uid() AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_cancel_trust(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE trust_connections SET status = 'cancelled', updated_at = now()
    WHERE id = _id AND requester_id = auth.uid() AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.tellher_my_circle()
RETURNS TABLE (connection_id uuid, kind text, first_name text, last_initial text, city text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN QUERY
    SELECT t.id, CASE WHEN t.status = 'accepted' THEN 'direct' ELSE 'outgoing' END, p.first_name, left(p.last_name,1), p.city, t.created_at
      FROM trust_connections t JOIN profiles p ON p.id = t.recipient_id
      WHERE t.requester_id = auth.uid() AND t.status IN ('pending','accepted')
    UNION ALL
    SELECT t.id, 'incoming', p.first_name, left(p.last_name,1), p.city, t.created_at
      FROM trust_connections t JOIN profiles p ON p.id = t.requester_id
      WHERE t.recipient_id = auth.uid() AND t.status = 'pending';
END $$;

CREATE OR REPLACE FUNCTION public.tellher_extended_reach_count()
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN (SELECT count(DISTINCT t2.recipient_id)::int
    FROM trust_connections t1 JOIN trust_connections t2 ON t2.requester_id = t1.recipient_id AND t2.status = 'accepted'
    WHERE t1.requester_id = auth.uid() AND t1.status = 'accepted'
      AND t2.recipient_id <> auth.uid()
      AND NOT EXISTS (SELECT 1 FROM trust_connections d WHERE d.requester_id = auth.uid() AND d.recipient_id = t2.recipient_id AND d.status = 'accepted'));
END $$;

REVOKE ALL ON FUNCTION public.tellher_find_member(text), public.tellher_send_trust(uuid), public.tellher_respond_trust(uuid, boolean), public.tellher_cancel_trust(uuid), public.tellher_my_circle(), public.tellher_extended_reach_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tellher_find_member(text), public.tellher_send_trust(uuid), public.tellher_respond_trust(uuid, boolean), public.tellher_cancel_trust(uuid), public.tellher_my_circle(), public.tellher_extended_reach_count() TO authenticated;