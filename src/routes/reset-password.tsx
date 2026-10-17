import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { pageHead } from '@/lib/metadata';
import { hasRecovery, rememberRecovery } from '@/lib/password-recovery';
export const Route = createFileRoute('/reset-password')({ head: () => ({ meta: [...pageHead('Reset password', 'Securely set a new password for your TellHer account.').meta, { name: 'robots', content: 'noindex, nofollow' }] }), component: ResetPassword });
function ResetPassword() {
 const [recovery, setRecovery] = useState(false); const [checking, setChecking] = useState(true); const [error, setError] = useState(''); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false);
 useEffect(() => {
  let active = true; let liveRecovery = false;
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
   if (!active) return;
   if (event === 'PASSWORD_RECOVERY' && session?.user) { liveRecovery = true; rememberRecovery(session.user.id); setRecovery(true); setChecking(false); }
   if (event === 'SIGNED_OUT') { liveRecovery = false; setRecovery(false); }
  });
  void supabase.auth.getUser().then(({ data, error }) => {
   if (!active) return;
   if (!liveRecovery) setRecovery(!error && Boolean(data.user && hasRecovery(data.user.id)));
   setChecking(false);
  }).catch(() => { if (active) { setRecovery(false); setChecking(false); } });
  return () => { active = false; subscription.unsubscribe(); };
 }, []);
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); if (!recovery || busy) return;
  setError(''); setBusy(true); const fields = new FormData(event.currentTarget); const password = String(fields.get('password'));
  try {
   if (password !== fields.get('confirm')) throw new Error('Your passwords don’t match.');
   const { error } = await supabase.auth.updateUser({ password }); if (error) throw error;
   setDone(true); rememberRecovery(null);
  } catch (err) { setError(err instanceof Error ? err.message : 'Your password could not be updated. Please try again.'); }
  finally { setBusy(false); }
 }
 return <main className="auth-page"><Brand /><section className="auth-panel"><h1>A fresh start.</h1>{checking ? <p role="status">Checking your reset link…</p> : done ? <><p role="status">Your password has been updated.</p><Button asChild variant="editorial"><Link to="/feed">Return to your space</Link></Button></> : recovery ? <form className="account-form" onSubmit={submit}><div className="field"><label htmlFor="new-password">New password</label><Input id="new-password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} /></div><div className="field"><label htmlFor="confirm-password">Confirm new password</label><Input id="confirm-password" name="confirm" type="password" autoComplete="new-password" required minLength={8} maxLength={128} /></div>{error && <p role="alert" className="form-error form-note">{error}</p>}<Button variant="editorial" disabled={busy}>{busy ? 'Saving…' : 'Set new password'}</Button></form> : <><p>This reset link is missing, expired, or already used. Request a fresh link from sign in.</p><Button asChild variant="editorial"><Link to="/auth">Back to sign in</Link></Button></>}</section></main>;
}
