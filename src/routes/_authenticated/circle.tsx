import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Check, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { pageHead } from '@/lib/metadata';
import { circleQuery, memberName, type CircleEntry } from '@/lib/circle';
import { emailSchema } from '@/lib/profile';
import { TrustedPicks } from '@/components/trusted-picks';

export const Route = createFileRoute('/_authenticated/circle')({
 loader: ({ context }) => context.queryClient.ensureQueryData(circleQuery),
 head: () => pageHead('MyCircle', 'Your small circle of trusted women on TellHer.'),
 errorComponent: () => <p role="alert" className="form-note form-error">Your circle could not be loaded. Please refresh.</p>,
 component: Circle,
});

const message = (e: unknown) => (e as { message?: string } | null)?.message || 'Something went wrong.';

function Circle() {
 const { data } = useSuspenseQuery(circleQuery);
 const qc = useQueryClient();
 const refresh = () => qc.invalidateQueries({ queryKey: circleQuery.queryKey });
 const by = (k: CircleEntry['kind']) => data.entries.filter(e => e.kind === k);
 const direct = by('direct');
 const respond = useMutation({ mutationFn: async (v: { id: string; accept: boolean }) => { const { error } = await supabase.rpc('tellher_respond_trust', { _id: v.id, _accept: v.accept }); if (error) throw error; }, onSuccess: refresh });
 const cancel = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.rpc('tellher_cancel_trust', { _id: id }); if (error) throw error; }, onSuccess: refresh });
 return <>
  <div className="page-heading"><div><div className="eyebrow">MYCIRCLE</div><h1>Trust starts close to home.</h1><p>The women you choose to trust. Only accepted trust shapes how far a Ripple can travel.</p></div></div>
  <section className="circle-summary" aria-label="Your reach">
   <ReachRings direct={direct.length} extended={data.extendedCount} />
   <dl className="reach-stats">
    <div><dt>Direct circle</dt><dd>{direct.length}</dd><p>Women you trust who accepted.</p></div>
    <div><dt>Extended reach</dt><dd>{data.extendedCount}</dd><p>Women trusted by your circle. Shown only as a number.</p></div>
   </dl>
  </section>
  <div className="circle-grid">
   <section className="circle-card"><h2>Direct circle</h2>{direct.length ? <ul className="member-list">{direct.map(m => <Member key={m.connection_id} m={m} />)}</ul> : <p className="form-note">No one yet. Invite a woman you trust below.</p>}</section>
   <AddMember onSent={refresh} />
   <section className="circle-card"><h2>Requests for you</h2>{by('incoming').length ? <ul className="member-list">{by('incoming').map(m => <Member key={m.connection_id} m={m}><Button size="sm" variant="editorial" disabled={respond.isPending} onClick={() => respond.mutate({ id: m.connection_id, accept: true })}><Check />Accept</Button><Button size="sm" variant="ghost" disabled={respond.isPending} onClick={() => respond.mutate({ id: m.connection_id, accept: false })}>Decline</Button></Member>)}</ul> : <p className="form-note">No requests waiting.</p>}{respond.isError && <p role="alert" className="form-note form-error">{message(respond.error)}</p>}</section>
   <section className="circle-card"><h2>Sent requests</h2>{by('outgoing').length ? <ul className="member-list">{by('outgoing').map(m => <Member key={m.connection_id} m={m}><span className="status-label">Pending</span><Button size="sm" variant="ghost" aria-label={`Withdraw request to ${memberName(m)}`} disabled={cancel.isPending} onClick={() => cancel.mutate(m.connection_id)}><X /></Button></Member>)}</ul> : <p className="form-note">Nothing pending.</p>}</section>
  </div>
  <TrustedPicks />
 </>;
}

function Member({ m, children }: { m: CircleEntry; children?: React.ReactNode }) {
 return <li className="member-row"><span className="member-initial" aria-hidden>{m.first_name.slice(0, 1).toUpperCase()}</span><div className="member-meta"><strong>{memberName(m)}</strong>{m.city && <span>{m.city}</span>}</div>{children && <div className="member-actions">{children}</div>}</li>;
}

function AddMember({ onSent }: { onSent: () => void }) {
 const [email, setEmail] = useState('');
 const [found, setFound] = useState<{ member_id: string; first_name: string; last_initial: string; city: string | null } | null>(null);
 const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);
 const [busy, setBusy] = useState(false);
 const search = async (e: FormEvent) => {
  e.preventDefault(); setFound(null); setNote(null);
  const parsed = emailSchema.safeParse(email); if (!parsed.success) return setNote({ text: parsed.error.issues[0]?.message ?? "Enter a valid email address.", error: true });
  setBusy(true); const { data, error } = await supabase.rpc('tellher_find_member', { _email: parsed.data }); setBusy(false);
  if (error) return setNote({ text: message(error), error: true });
  if (!data?.length) return setNote({ text: 'No TellHer member matches that exact address.' });
  setFound(data[0] ?? null);
 };
 const send = async () => {
  if (!found) return; setBusy(true); const { error } = await supabase.rpc('tellher_send_trust', { _recipient: found.member_id }); setBusy(false);
  if (error) return setNote({ text: message(error), error: true });
  setNote({ text: `Trust request sent to ${memberName(found)}.` }); setFound(null); setEmail(''); onSent();
 };
 return <section className="circle-card"><h2>Add a woman you trust</h2><p className="form-note">Enter her exact email. It is only used to find her and is never shown to anyone.</p>
  <form className="add-member" onSubmit={search}><div className="field"><label htmlFor="trust-email">Her email address</label><Input id="trust-email" type="email" autoComplete="off" value={email} onChange={e => setEmail(e.target.value)} /></div><Button type="submit" variant="outline" disabled={busy}><Search />Find</Button></form>
  {found && <div className="member-row found-member"><span className="member-initial" aria-hidden>{found.first_name.slice(0, 1).toUpperCase()}</span><div className="member-meta"><strong>{memberName(found)}</strong>{found.city && <span>{found.city}</span>}</div><Button size="sm" variant="editorial" disabled={busy} onClick={send}>Send trust request</Button></div>}
  {note && <p role={note.error ? 'alert' : 'status'} className={`form-note ${note.error ? 'form-error' : 'form-success'}`}>{note.text}</p>}
 </section>;
}

function ReachRings({ direct, extended }: { direct: number; extended: number }) {
 return <svg className="reach-rings" viewBox="0 0 240 240" role="img" aria-label={`You, ${direct} in your direct circle, ${extended} in extended reach`}>
  <circle cx="120" cy="120" r="100" className="ring-extended" /><circle cx="120" cy="120" r="68" className="ring-direct" /><circle cx="120" cy="120" r="9" className="ring-you" />
  <text x="120" y="146" className="ring-label">You</text><text x="120" y="47" className="ring-label">Direct · {direct}</text><text x="120" y="236" className="ring-label">Extended · {extended}</text>
 </svg>;
}
