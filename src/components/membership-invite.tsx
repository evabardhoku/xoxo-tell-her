import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export function MembershipInvite() {
 const [vouch, setVouch] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
 const [invite, setInvite] = useState<{ id: string; code: string; expires_at: string } | null>(null);
 async function create() {
  if (!vouch) return; setBusy(true); setError('');
  try { const { data, error } = await supabase.rpc('tellher_create_membership_invite', { _vouch: vouch });
   if (error || !data?.[0]) throw new Error('Your invitation could not be created. Please try again later.'); setInvite(data[0]);
  } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); } finally { setBusy(false); }
 }
 async function cancel() { if (!invite) return; const { error } = await supabase.rpc('tellher_cancel_trust_code', { _id: invite.id }); if (error) setError('Your invitation could not be cancelled.'); else setInvite(null); }
 const link = invite ? `${window.location.origin}/join?invite=${encodeURIComponent(invite.code)}` : '';
 return <section className="circle-invitation" aria-labelledby="membership-invite-title"><div className="eyebrow">NEW TO TELLHER</div><h2 id="membership-invite-title">Invite a woman to join</h2><p className="form-note">A private, one-use invitation for a woman you personally know who isn’t a member yet.</p>
 {!invite ? <><label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={vouch} onChange={e => setVouch(e.target.checked)} className="mt-1 accent-primary" />I personally know her and vouch for her joining this women-centered community.</label><Button variant="editorial" disabled={!vouch || busy} onClick={() => void create()}>{busy ? 'Creating…' : 'Create one-use invitation'}</Button></> : <div className="trust-code"><QRCodeSVG value={link} size={168} bgColor="transparent" fgColor="currentColor" aria-label="Single-use membership invitation" /><div className="field w-full"><label htmlFor="membership-link">Private invitation link</label><Input id="membership-link" value={link} readOnly onFocus={e => e.currentTarget.select()} /></div><p className="form-note">One use · expires {new Date(invite.expires_at).toLocaleDateString()} · does not automatically add a Circle connection</p><Button variant="ghost" onClick={() => void cancel()}>Cancel invitation</Button></div>}
 {error && <p role="alert" className="form-note form-error">{error}</p>}</section>;
}
