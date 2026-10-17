ALTER TABLE public.trust_connections ADD COLUMN connection_kind text NOT NULL DEFAULT 'direct' CHECK (connection_kind IN ('direct','extended'));
CREATE OR REPLACE FUNCTION public.tellher_is_direct(_a uuid,_b uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.tellher_member_ready() AND _a<>_b AND EXISTS(SELECT 1 FROM trust_connections WHERE status='accepted' AND connection_kind='direct' AND ((requester_id=_a AND recipient_id=_b) OR (requester_id=_b AND recipient_id=_a))); $$;
CREATE OR REPLACE FUNCTION public.tellher_ripple_audience(_author uuid,_scope text) RETURNS TABLE(recipient_id uuid,trust_distance smallint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
WITH d1 AS (SELECT recipient_id rid,1::smallint dist FROM trust_connections WHERE requester_id=_author AND status='accepted' AND connection_kind='direct'), d2 AS (SELECT t.recipient_id rid,2::smallint dist FROM d1 JOIN trust_connections t ON t.requester_id=d1.rid AND t.status='accepted' AND t.connection_kind='direct' WHERE _scope='extended' UNION ALL SELECT recipient_id,2::smallint FROM trust_connections WHERE requester_id=_author AND status='accepted' AND connection_kind='extended' AND _scope='extended'), u AS (SELECT * FROM d1 UNION ALL SELECT * FROM d2) SELECT u.rid,min(u.dist)::smallint FROM u JOIN profiles p ON p.id=u.rid AND p.woman_attested_at IS NOT NULL WHERE u.rid<>_author AND _scope IN ('circle','extended') GROUP BY u.rid; $$;
CREATE OR REPLACE FUNCTION public.tellher_respond_trust_tier(_id uuid,_circle text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t trust_connections;
BEGIN
IF NOT tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
IF _circle NOT IN ('direct','extended','decline') OR _circle IS NULL THEN RAISE EXCEPTION 'Unknown circle'; END IF;
SELECT * INTO t FROM trust_connections WHERE id=_id AND recipient_id=auth.uid() AND status='pending' FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
IF tellher_is_blocked(t.requester_id,t.recipient_id) THEN RAISE EXCEPTION 'Connection unavailable'; END IF;
UPDATE trust_connections SET status=CASE WHEN _circle='decline' THEN 'declined' ELSE 'accepted' END,connection_kind=CASE WHEN _circle='decline' THEN 'direct' ELSE _circle END,updated_at=now() WHERE id=_id;
IF _circle<>'decline' THEN
INSERT INTO trust_connections(requester_id,recipient_id,status,connection_kind) VALUES(t.recipient_id,t.requester_id,'accepted',_circle)
ON CONFLICT(requester_id,recipient_id) WHERE status IN ('pending','accepted') DO UPDATE SET status='accepted',connection_kind=excluded.connection_kind,updated_at=now();
END IF;
END $$;
CREATE OR REPLACE FUNCTION public.tellher_my_circle() RETURNS TABLE(connection_id uuid,kind text,first_name text,last_initial text,city text,created_at timestamptz,member_id uuid) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NOT tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
RETURN QUERY SELECT t.id,CASE WHEN t.status='accepted' THEN t.connection_kind ELSE 'outgoing' END,p.first_name,left(p.last_name,1),p.city,t.created_at,p.id FROM trust_connections t JOIN profiles p ON p.id=t.recipient_id WHERE t.requester_id=auth.uid() AND t.status IN ('pending','accepted') UNION ALL SELECT t.id,'incoming',p.first_name,left(p.last_name,1),p.city,t.created_at,p.id FROM trust_connections t JOIN profiles p ON p.id=t.requester_id WHERE t.recipient_id=auth.uid() AND t.status='pending'; END $$;
CREATE OR REPLACE FUNCTION public.tellher_send_trust(_recipient uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NOT tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
IF _recipient=auth.uid() THEN RAISE EXCEPTION 'You cannot add yourself'; END IF;
IF tellher_is_blocked(auth.uid(),_recipient) THEN RAISE EXCEPTION 'Connection unavailable'; END IF;
IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=_recipient AND woman_attested_at IS NOT NULL) THEN RAISE EXCEPTION 'Member not found'; END IF;
IF EXISTS(SELECT 1 FROM trust_connections WHERE requester_id=auth.uid() AND recipient_id=_recipient AND status IN ('pending','accepted')) THEN RAISE EXCEPTION 'A request already exists'; END IF;
IF EXISTS(SELECT 1 FROM trust_connections WHERE requester_id=_recipient AND recipient_id=auth.uid() AND status='pending') THEN RAISE EXCEPTION 'Respond to her incoming request first'; END IF;
INSERT INTO trust_connections(requester_id,recipient_id) VALUES(auth.uid(),_recipient); END $$;
CREATE OR REPLACE FUNCTION public.tellher_extended_reach_count() RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NOT tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF; RETURN (SELECT count(*)::int FROM tellher_ripple_audience(auth.uid(),'extended') WHERE trust_distance=2); END $$;
CREATE OR REPLACE FUNCTION public.tellher_member_profile(_id uuid) RETURNS TABLE(first_name text,last_name text,city text,country text,bio text,languages text[],occupation text,known_for text[],ask_me_about text[],has_avatar boolean,relation text,via text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE me uuid:=auth.uid(); p profiles; rel text; v text;
BEGIN
IF NOT tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
SELECT * INTO p FROM profiles WHERE id=_id AND woman_attested_at IS NOT NULL;
IF NOT FOUND OR tellher_is_blocked(me,_id) THEN RETURN; END IF;
IF _id=me THEN rel:='self';
ELSIF EXISTS(SELECT 1 FROM tellher_ripple_audience(me,'circle') WHERE recipient_id=_id) THEN rel:='direct';
ELSIF EXISTS(SELECT 1 FROM tellher_ripple_audience(me,'extended') WHERE recipient_id=_id AND trust_distance=2) THEN rel:='extended';
ELSE rel:='community'; END IF;
SELECT m.first_name INTO v FROM trust_connections a JOIN trust_connections b ON b.requester_id=a.recipient_id AND b.recipient_id=_id AND b.status='accepted' AND b.connection_kind='direct' JOIN profiles m ON m.id=a.recipient_id WHERE a.requester_id=me AND a.status='accepted' AND a.connection_kind='direct' ORDER BY m.first_name LIMIT 1;
IF NOT (rel='self' OR p.discoverability='community' OR EXISTS(SELECT 1 FROM tellher_ripple_audience(_id,'circle') WHERE recipient_id=me) OR (p.discoverability='extended' AND (rel='extended' OR EXISTS(SELECT 1 FROM tellher_ripple_audience(_id,'extended') WHERE recipient_id=me)))) THEN RETURN; END IF;
RETURN QUERY SELECT p.first_name,CASE WHEN rel IN ('self','direct') THEN p.last_name ELSE left(p.last_name,1) END,p.city,p.country,p.bio,p.languages,p.occupation,p.known_for,p.ask_me_about,p.avatar_path IS NOT NULL,rel,v;
END $$;
CREATE OR REPLACE FUNCTION public.tellher_extended_circle(_via uuid DEFAULT NULL) RETURNS TABLE(member_id uuid,first_name text,last_initial text,city text,country text,known_for text[],ask_me_about text[],has_avatar boolean,via text,via_id uuid,bridge_pending boolean) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NOT tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF;
RETURN QUERY WITH paths AS (
SELECT b.recipient_id rid,m.first_name bridge,m.id bid FROM trust_connections a JOIN trust_connections b ON b.requester_id=a.recipient_id AND b.status='accepted' AND b.connection_kind='direct' JOIN profiles m ON m.id=a.recipient_id WHERE a.requester_id=auth.uid() AND a.status='accepted' AND a.connection_kind='direct' AND (_via IS NULL OR a.recipient_id=_via)
UNION ALL SELECT t.recipient_id,NULL::text,NULL::uuid FROM trust_connections t WHERE t.requester_id=auth.uid() AND t.status='accepted' AND t.connection_kind='extended' AND _via IS NULL)
SELECT DISTINCT ON(p.id) p.id,p.first_name,left(p.last_name,1),p.city,p.country,p.known_for,p.ask_me_about,p.avatar_path IS NOT NULL,x.bridge,x.bid,EXISTS(SELECT 1 FROM trust_connections t WHERE t.requester_id=auth.uid() AND t.recipient_id=p.id AND t.status='pending') FROM paths x JOIN profiles p ON p.id=x.rid WHERE p.id<>auth.uid() AND p.discoverability IN ('extended','community') AND p.woman_attested_at IS NOT NULL AND NOT tellher_is_blocked(auth.uid(),p.id) AND NOT EXISTS(SELECT 1 FROM tellher_ripple_audience(auth.uid(),'circle') d WHERE d.recipient_id=p.id) ORDER BY p.id,x.bridge NULLS FIRST; END $$;
CREATE OR REPLACE FUNCTION public.tellher_circle_picks() RETURNS TABLE(id uuid,title text,category text,note text,location text,created_at timestamptz,recommender text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT p.id,p.title,p.category,p.note,p.location,p.created_at,pr.first_name FROM trust_connections t JOIN trusted_picks p ON p.owner_id=t.recipient_id JOIN profiles pr ON pr.id=p.owner_id WHERE tellher_member_ready() AND t.requester_id=auth.uid() AND t.status='accepted' AND t.connection_kind='direct' AND t.recipient_id<>auth.uid() ORDER BY p.created_at DESC LIMIT 100; $$;
CREATE OR REPLACE FUNCTION public.tellher_member_shelf(_id uuid) RETURNS TABLE(kind text,id uuid,title text,body text,category text,location text,created_at timestamptz) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NOT EXISTS(SELECT 1 FROM tellher_member_profile(_id)) THEN RETURN; END IF; IF _id=auth.uid() OR EXISTS(SELECT 1 FROM trust_connections WHERE requester_id=auth.uid() AND recipient_id=_id AND status='accepted' AND connection_kind='direct') THEN RETURN QUERY SELECT 'pick'::text,p.id,p.title,p.note,p.category,p.location,p.created_at FROM trusted_picks p WHERE p.owner_id=_id ORDER BY p.created_at DESC LIMIT 50; END IF; END $$;
CREATE OR REPLACE FUNCTION public.tellher_taggable() RETURNS TABLE(member_id uuid,first_name text,last_initial text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NOT tellher_member_ready() THEN RAISE EXCEPTION 'Not allowed'; END IF; RETURN QUERY SELECT DISTINCT p.id,p.first_name,left(p.last_name,1) FROM trust_connections t JOIN profiles p ON p.id=CASE WHEN t.requester_id=auth.uid() THEN t.recipient_id ELSE t.requester_id END WHERE t.status='accepted' AND t.connection_kind='direct' AND (t.requester_id=auth.uid() OR t.recipient_id=auth.uid()); END $$;
REVOKE ALL ON FUNCTION public.tellher_respond_trust_tier(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.tellher_respond_trust_tier(uuid,text) TO authenticated,service_role;
