-- Notify on new trust requests and on acceptance, without touching existing checked functions.
CREATE OR REPLACE FUNCTION public.tellher_trust_notify() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    INSERT INTO notifications (recipient_id, kind, title, body, link)
    VALUES (NEW.recipient_id, 'trust_request', 'New trust request', 'Someone would like to add you to her Direct Circle.', '/circle');
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    INSERT INTO notifications (recipient_id, kind, title, body, link)
    VALUES (NEW.requester_id, 'trust_accepted', 'Trust request accepted', 'She accepted — you are now in each other''s Direct Circle.', '/circle');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trust_connections_notify
AFTER INSERT OR UPDATE OF status ON public.trust_connections
FOR EACH ROW EXECUTE FUNCTION public.tellher_trust_notify();