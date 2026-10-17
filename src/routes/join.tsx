import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProfileEditor } from '@/components/profile-editor';
import { useAccount } from '@/hooks/account';
import { supabase } from '@/integrations/supabase/client';
import { membershipQuery } from '@/lib/membership';
import { profileQuery } from '@/lib/profile';
import { pageHead } from '@/lib/metadata';
const PENDING_INVITE = 'tellher-membership-invite';
export const Route = createFileRoute('/join')({ ssr: false,
 validateSearch: (s: Record<string, unknown>): { invite?: string } => typeof s['invite'] === 'string' && /^[a-fA-F0-9]{32}$/.test(s['invite']) ? { invite: s['invite'] } : {},
 head: () => ({ meta: [...pageHead('Your invitation', 'Confirm your personal invitation to join the TellHer community.').meta, { name: 'robots', content: 'noindex, nofollow' }, { name: 'referrer', content: 'no-referrer' }] }), component: Join });
function Join() {
 const { invite } = Route.useSearch(); const { user, ready } = useAccount(); const go = useNavigate(); const qc = useQueryClient();
 const [code, setCode] = useState(invite ?? ''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
 const profile = useQuery({ ...profileQuery, enabled: Boolean(user) }); const membership = useQuery({ ...membershipQuery, enabled: Boolean(user) });
 useEffect(() => { try { if (invite) sessionStorage.setItem(PENDING_INVITE, invite); else setCode(sessionStorage.getItem(PENDING_INVITE) ?? ''); } catch { /* manual entry works */ } }, [invite]);
 useEffect(() => { if (membership.data) void go({ to: '/feed', replace: true }); }, [membership.data, go]);
 async function redeem(e: FormEvent) {
  e.preventDefault(); setBusy(true); setError('');
  try { const { data, error } = await supabase.rpc('tellher_redeem_membership_invite', { _code: code.trim() });
   if (error) throw new Error('Your invitation could not be checked. Please try again.');
   if (data !== 'admitted' && data !== 'already') throw new Error(data === 'rate_limited' ? 'Too many attempts. Please wait before trying again.' : data === 'not_ready' ? 'Confirm your email and complete your profile first.' : 'This invitation is unavailable, expired or already used. Ask for a new one.');
   try { sessionStorage.removeItem(PENDING_INVITE); } catch { /* storage unavailable */ }
   await qc.invalidateQueries(); await go({ to: '/feed', replace: true });
  } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); } finally { setBusy(false); }
 }
 async function signOut() { await supabase.auth.signOut(); qc.clear(); await go({ to: '/auth', replace: true }); }
 return <main className="auth-page"><Brand /><section className="auth-panel"><div className="eyebrow">A personal welcome</div><h1>Your invitation to TellHer.</h1><p>A woman you know invites you in. Confirm your email, make your community self-attestation, then redeem her private one-use invitation.</p>
 {!ready ? <p role="status" className="form-note">Opening your invitation…</p> : !user ? <div className="account-form"><Button variant="editorial" onClick={() => void go({ to: '/auth', search: { mode: 'signup' } })}>Create your account</Button><Button variant="outline" onClick={() => void go({ to: '/auth', search: { mode: 'signin' } })}>Sign in</Button><p className="form-note">Keep your invitation link for after email confirmation.</p></div>
 : profile.isPending || membership.isPending ? <p role="status" className="form-note">Checking your account…</p>
 : profile.isError || membership.isError ? <><p role="alert" className="form-note form-error">Your account could not be checked.</p><Button onClick={() => { void profile.refetch(); void membership.refetch(); }}>Try again</Button></>
 : !user.email_confirmed_at ? <p role="alert" className="form-note">Confirm your email using the link sent to you before continuing.</p>
 : profile.data && (!profile.data.woman_attested_at || !profile.data.first_name.trim() || !profile.data.last_name.trim()) ? <ProfileEditor profile={profile.data} onSaved={async () => { await profile.refetch(); await membership.refetch(); }} />
 : <form className="account-form" onSubmit={redeem}><div className="field"><label htmlFor="invite-code">Invitation code</label><Input id="invite-code" value={code} onChange={e => setCode(e.target.value)} required maxLength={64} autoComplete="off" /></div><Button variant="editorial" disabled={busy}>{busy ? 'Checking…' : 'Accept invitation'}</Button>{error && <p role="alert" className="form-note form-error">{error}</p>}</form>}
 {user && <Button className="mt-6" variant="ghost" onClick={() => void signOut()}>Sign out</Button>}<p className="form-note mt-7">Invitations add personal accountability. Membership is self-attested, not identity or gender verified.</p></section></main>;
}
