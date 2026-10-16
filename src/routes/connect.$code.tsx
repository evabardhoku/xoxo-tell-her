import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PENDING_CODE } from '@/components/trust-code';

/** Landing for a scanned in-person QR. Nothing connects here: the code is held until she is signed in and set up, then confirmed in My Circle. */
export const Route = createFileRoute('/connect/$code')({
 head: () => ({ meta: [{ title: 'Connect in person · TellHer' }, { name: 'description', content: 'Confirm an in-person connection on TellHer.' }, { property: 'og:title', content: 'Connect in person · TellHer' }, { property: 'og:description', content: 'Confirm an in-person connection on TellHer.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' }] }),
 component: ConnectLanding,
});

function ConnectLanding() {
 const { code } = Route.useParams(); const navigate = useNavigate();
 useEffect(() => {
  const clean = code.slice(0, 20);
  try { sessionStorage.setItem(PENDING_CODE, clean); } catch { /* storage unavailable */ }
  void supabase.auth.getUser().then(({ data }) => data.user ? navigate({ to: '/circle', search: { view: 'direct', code: clean }, replace: true }) : navigate({ to: '/auth', replace: true }));
 }, [code, navigate]);
 return <main className="app-main"><p role="status" className="form-note">Opening your connection… If you’re new, you’ll create your account first, then confirm.</p></main>;
}
