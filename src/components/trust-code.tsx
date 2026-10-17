import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorText } from '@/lib/askher';
import { trustCodeMessage } from '@/lib/trust-code';

/** A scanned code waiting for sign-in/onboarding; cleared once shown for confirmation. */
export const PENDING_CODE = 'tellher-pending-code';
type Created = { id: string; code: string; expires_at: string; max_uses: number };

function useNow() { const [n, setN] = useState(Date.now()); useEffect(() => { const t = setInterval(() => setN(Date.now()), 1000); return () => clearInterval(t); }, []); return n; }
const left = (iso: string, now: number) => { const s = Math.max(0, Math.round((Date.parse(iso) - now) / 1000)); return s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/** Connect in person: a short-lived, cancellable code that creates an ordinary Direct Circle connection. */
export function ConnectInPerson({ embedded = false }: { embedded?: boolean }) {
 const qc = useQueryClient(); const now = useNow();
 const [created, setCreated] = useState<Created | null>(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
 const active = useQuery({ queryKey: ['trust-codes'], queryFn: async () => {
  const { data, error } = await supabase.from('trust_codes').select('id, max_uses, uses, expires_at, cancelled_at').eq('membership_invite', false).is('cancelled_at', null).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(5);
  if (error) throw error; return (data ?? []).filter(c => c.uses < c.max_uses);
 } });
 const create = async (group: boolean) => {
  setBusy(true); setError('');
  const { data, error } = await supabase.rpc('tellher_create_trust_code', { _group: group });
  setBusy(false); if (error) return setError(errorText(error));
  setCreated((data as Created[])[0] ?? null); void qc.invalidateQueries({ queryKey: ['trust-codes'] });
 };
 const cancel = async (id: string) => {
  const { error } = await supabase.rpc('tellher_cancel_trust_code', { _id: id });
  if (error) return setError(errorText(error));
  if (created?.id === id) setCreated(null); void qc.invalidateQueries({ queryKey: ['trust-codes'] });
 };
 const shown = created && Date.parse(created.expires_at) > now ? created : null;
 const live = active.data?.find(c => c.id === shown?.id);
 const others = (active.data ?? []).filter(c => c.id !== shown?.id);
 const Container = embedded ? 'div' : 'details';
 return <Container className="add-trust-disclosure connect-in-person">{!embedded && <summary>Connect with a member</summary>}
  <p className="form-note">For women already on TellHer. Share your QR or code to join each other’s Direct Circle.</p>
  {shown ? <div className="trust-code">
   <QRCodeSVG value={`${window.location.origin}/connect/${encodeURIComponent(shown.code)}`} size={168} bgColor="transparent" fgColor="currentColor" aria-label="One-time QR code to connect with you" />
   <p className="trust-code-text" aria-label={`Code ${shown.code.split('').join(' ')}`}>{shown.code}</p>
   <p className="form-note">Expires in {left(shown.expires_at, now)} · {(live ? live.max_uses - live.uses : shown.max_uses)} {shown.max_uses === 1 ? 'use' : 'uses'} left</p>
   <Button variant="ghost" size="sm" onClick={() => void cancel(shown.id)}>Cancel</Button>
  </div> : <div className="flex gap-2 flex-wrap">
   <Button variant="outline" size="sm" disabled={busy} onClick={() => void create(false)}>Show my one-time QR</Button>
   <Button variant="ghost" size="sm" disabled={busy} onClick={() => void create(true)}>Small group (up to 5, 2 hours)</Button>
  </div>}
  {others.length > 0 && <ul className="form-note">{others.map(c => <li key={c.id}>Active code · {c.max_uses - c.uses} left · expires in {left(c.expires_at, now)} <Button variant="ghost" size="sm" onClick={() => void cancel(c.id)}>Cancel</Button></li>)}</ul>}
  {error && <p role="alert" className="form-note form-error">{error}</p>}
 </Container>;
}

export function RedeemTrustCode({ initial, embedded = false }: { initial?: string | undefined; embedded?: boolean }) {
 const qc = useQueryClient();
 const [code, setCode] = useState(initial ?? ''); const [preview, setPreview] = useState<string | null>(null);
 useEffect(() => { if (initial) void check(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
 const [note, setNote] = useState(''); const [busy, setBusy] = useState(false);
 const check = async () => {
  setBusy(true); setNote(''); setPreview(null);
  const { data, error } = await supabase.rpc('tellher_preview_trust_code', { _code: code });
  setBusy(false); const r = (data as { status: string; first_name: string | null }[] | null)?.[0];
  if (error || !r) return setNote('Something went wrong. Please try again.');
  if (r.status !== 'not_ready') { try { sessionStorage.removeItem(PENDING_CODE); } catch { /* storage unavailable */ } }
  if (r.status === 'ok') setPreview(r.first_name ?? ''); else setNote(trustCodeMessage(r.status, r.first_name));
 };
 const redeem = async () => {
  setBusy(true);
  const { data, error } = await supabase.rpc('tellher_redeem_trust_code', { _code: code });
  setBusy(false); setPreview(null); const r = (data as { status: string; first_name: string | null }[] | null)?.[0];
  if (error || !r) return setNote('Something went wrong. Please try again.');
  setNote(trustCodeMessage(r.status, r.first_name)); if (r.status === 'connected') { setCode(''); void qc.invalidateQueries(); }
 };
 const Container = embedded ? 'div' : 'details';
 return <Container className="add-trust-disclosure" {...(!embedded ? { open: Boolean(initial) } : {})}>{!embedded && <summary>Enter a connection code</summary>}
  <div className="field"><label htmlFor="tc-in">Her code</label><Input id="tc-in" value={code} autoComplete="off" autoCapitalize="characters" maxLength={20} onChange={e => { setCode(e.target.value); setPreview(null); }} placeholder="ABCDE-FGH23" /></div>
  {preview === null ? <Button variant="outline" size="sm" disabled={busy || code.replace(/[^a-z0-9]/gi, '').length < 10} onClick={() => void check()}>Check code</Button>
   : <div className="connect-confirm" role="dialog" aria-labelledby="connect-title"><span className="member-initial" aria-hidden>{preview.slice(0, 1)}</span><h3 id="connect-title">Connect with {preview}?</h3><p className="form-note">You’ll be in each other’s Circle.</p><div className="flex gap-2 justify-center"><Button variant="ghost" size="sm" onClick={() => { setPreview(null); setCode(''); }}>Cancel</Button><Button variant="editorial" size="sm" disabled={busy} onClick={() => void redeem()}>Add to My Circle</Button></div></div>}
  {note && <p role="status" className="form-note">{note}</p>}
 </Container>;
}

/** Both directions of an existing-member code exchange, separate from membership admission. */
export function CircleConnection({ initial }: { initial?: string | undefined }) {
 const [mode, setMode] = useState<'share' | 'enter'>(initial ? 'enter' : 'share');
 return <section className="circle-connection" aria-labelledby="circle-connect-title">
  <div className="eyebrow">ALREADY ON TELLHER</div><h2 id="circle-connect-title">Connect with a member</h2><p className="voice-line">Met someone worth keeping in your circle?</p>
  <div className="circle-code-modes" role="group" aria-label="Connection code options">
   <Button variant={mode === 'share' ? 'editorial' : 'ghost'} size="sm" aria-pressed={mode === 'share'} onClick={() => setMode('share')}>Share my code</Button>
   <Button variant={mode === 'enter' ? 'editorial' : 'ghost'} size="sm" aria-pressed={mode === 'enter'} onClick={() => setMode('enter')}>Enter her code</Button>
  </div>
  <div hidden={mode !== 'share'}><ConnectInPerson embedded /></div>
  <div hidden={mode !== 'enter'}><RedeemTrustCode initial={initial} embedded /></div>
 </section>;
}
