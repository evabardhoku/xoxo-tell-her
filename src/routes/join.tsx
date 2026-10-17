import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProfileEditor } from '@/components/profile-editor';
import { useAccount } from '@/hooks/account';
import { supabase } from '@/integrations/supabase/client';
import { membershipQuery } from '@/lib/membership';
import { profileQuery } from '@/lib/profile';
import { pageHead } from '@/lib/metadata';
import { invitationCode, pendingInvitation, rememberInvitation } from '@/lib/invitation';
export const Route = createFileRoute('/join')({ ssr: false,
 validateSearch: (s: Record<string, unknown>): { invite?: string } => invitationCode(s['invite']) ? { invite: invitationCode(s['invite']) } : {},
 head: () => ({ meta: [...pageHead('Your invitation', 'Confirm your personal invitation to join the TellHer community.').meta, { name: 'robots', content: 'noindex, nofollow' }, { name: 'referrer', content: 'no-referrer' }] }), component: Join });
function Join() {
 const { invite } = Route.useSearch(); const { user, ready } = useAccount(); const go = useNavigate(); const qc = useQueryClient();
 const [code, setCode] = useState(invite ?? ''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
 const attempted = useRef('');
 const profile = useQuery({ ...profileQuery, enabled: Boolean(user) }); const membership = useQuery({ ...membershipQuery, enabled: Boolean(user) });
 useEffect(() => { const saved = pendingInvitation(invite); setCode(saved ?? ''); if (saved) rememberInvitation(saved); }, [invite]);
 useEffect(() => { if (membership.data) void go({ to: '/feed', replace: true }); }, [membership.data, go]);
 async function complete() {
  setBusy(true); setError('');
  try {
   const claimed = await supabase.rpc('tellher_complete_membership');
   if (claimed.error) throw new Error('Your invitation could not be checked. Please try again.');
   if (claimed.data === true) { rememberInvitation(); await qc.invalidateQueries(); await go({ to: '/feed', replace: true }); return; }
   if (!code.trim()) return;
   if (!invitationCode(code.trim())) throw new Error('This is a connection code, not a membership invitation. Open the invitation link shared with you.');
   const { data, error } = await supabase.rpc('tellher_redeem_membership_invite', { _code: code.trim() });
   if (error) throw new Error('Your invitation could not be checked. Please try again.');
   if (data !== 'admitted' && data !== 'already') throw new Error(data === 'rate_limited' ? 'Too many attempts. Please wait before trying again.' : data === 'not_ready' ? 'Confirm your email and complete your profile first.' : 'This invitation is unavailable, expired or already used. Ask for a new one.');
   rememberInvitation();
   await qc.invalidateQueries(); await go({ to: '/feed', replace: true });
  } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); } finally { setBusy(false); }
 }
 async function redeem(e: FormEvent) { e.preventDefault(); await complete(); }
 useEffect(() => {
  if (!user?.email_confirmed_at || profile.isPending || membership.isPending || profile.isError || membership.isError || membership.data || !profile.data?.woman_attested_at || !profile.data.first_name.trim() || !profile.data.last_name.trim()) return;
  const key = `${user.id}:${code}`; if (attempted.current === key) return; attempted.current = key; void complete();
 }, [user, code, profile.data, profile.isPending, profile.isError, membership.data, membership.isPending, membership.isError]); // eslint-disable-line react-hooks/exhaustive-deps
 async function signOut() { await supabase.auth.signOut(); qc.clear(); await go({ to: '/auth', replace: true }); }
 return <main className="auth-page"><Brand /><section className="auth-panel"><div className="eyebrow">A personal welcome</div><h1>Your invitation to TellHer.</h1><p>Create your account and confirm your email. Your invitation brings you into the community; adding Circle friends is your choice afterward.</p>
 {!ready ? <p role="status" className="form-note">Opening your invitation…</p> : !user ? <div className="account-form"><Button variant="editorial" onClick={() => void go({ to: '/auth', search: { mode: 'signup', invite: invitationCode(code) } })}>Create your account</Button><Button variant="outline" onClick={() => void go({ to: '/auth', search: { mode: 'signin', invite: invitationCode(code) } })}>Sign in</Button><p className="form-note">Your invitation travels with your account signup.</p></div>
 : profile.isPending || membership.isPending ? <p role="status" className="form-note">Checking your account…</p>
 : profile.isError || membership.isError ? <><p role="alert" className="form-note form-error">Your account could not be checked.</p><Button onClick={() => { void profile.refetch(); void membership.refetch(); }}>Try again</Button></>
 : !user.email_confirmed_at ? <p role="alert" className="form-note">Confirm your email using the link sent to you before continuing.</p>
 : profile.data && (!profile.data.woman_attested_at || !profile.data.first_name.trim() || !profile.data.last_name.trim()) ? <ProfileEditor profile={profile.data} onSaved={async () => { await profile.refetch(); await membership.refetch(); }} />
 : busy ? <p role="status" className="form-note">Opening TellHer with your invitation…</p>
 : <div className="account-form">{error && <p role="alert" className="form-note form-error">{error}</p>}{code ? <Button variant="editorial" onClick={() => void complete()}>Try invitation again</Button> : <><p className="form-note">Open the membership invitation link shared with you. If you signed up from an invitation, you can retry below.</p><Button variant="editorial" onClick={() => void complete()}>Check my invitation</Button><details><summary>I have a membership invitation code</summary><form className="account-form" onSubmit={redeem}><div className="field"><label htmlFor="invite-code">Membership invitation code</label><Input id="invite-code" value={code} onChange={e => setCode(e.target.value)} required maxLength={32} autoComplete="off" /></div><Button variant="outline">Accept invitation</Button></form></details></>}</div>}
 {user && <Button className="mt-6" variant="ghost" onClick={() => void signOut()}>Sign out</Button>}<p className="form-note mt-7">Invitations add personal accountability. Membership is self-attested, not identity or gender verified.</p></section></main>;
}
