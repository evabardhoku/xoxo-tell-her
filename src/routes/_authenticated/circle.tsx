import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { useMemo, useState, type FormEvent } from 'react';
import { Check, Inbox, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { pageHead } from '@/lib/metadata';
import { circleQuery, memberName, type CircleEntry } from '@/lib/circle';
import { emailSchema } from '@/lib/profile';
import { TrustedPicks } from '@/components/trusted-picks';
import { ExtendedCircle } from '@/components/extended-circle';
import { InboxList } from '@/components/inbox-list';

export const Route = createFileRoute('/_authenticated/circle')({
 validateSearch: zodValidator(z.object({ view: fallback(z.string(), 'direct').default('direct') })),
 loader: ({ context }) => context.queryClient.ensureQueryData(circleQuery),
 head: () => pageHead('Circle', 'Your small circle of trusted women on TellHer.'),
 errorComponent: () => <p role="alert" className="form-note form-error">Your circle could not be loaded. Please refresh.</p>,
 component: Circle,
});

const message = (e: unknown) => (e as { message?: string } | null)?.message || 'Something went wrong.';
type View = 'direct' | 'extended' | 'messages' | 'requests';

function Circle() {
 const { view: raw } = Route.useSearch();
 const view: View = (['direct', 'extended', 'messages', 'requests'] as const).includes(raw as View) ? raw as View : 'direct';
 const { data } = useSuspenseQuery(circleQuery);
 const direct = data.entries.filter(e => e.kind === 'direct');
 const pending = data.entries.filter(e => e.kind === 'incoming' || e.kind === 'outgoing').length;
 const tab = (v: View, label: string) => <Link to="/circle" search={{ view: v }} className="ripple-tab" role="tab" aria-selected={view === v} data-active={view === v}>{label}</Link>;
 return <>
  <div className="page-heading"><div><div className="eyebrow">CIRCLE</div><h1>Trust starts close to home.</h1><p>The women you choose to trust. Only accepted trust shapes how far a Trust Ripple can travel.</p></div>
   {pending > 0 && <Link to="/circle" search={{ view: 'requests' }} className="requests-indicator" aria-label={`${pending} pending trust ${pending === 1 ? 'request' : 'requests'}`}><Inbox size={15} /><span className="requests-count">{pending}</span>Requests</Link>}
  </div>
  <div className="ripple-tabs" role="tablist" aria-label="Circle views">{tab('direct', 'Direct')}{tab('extended', 'Extended')}{tab('messages', 'Messages')}</div>
  {view === 'direct' && <DirectTab direct={direct} extendedCount={data.extendedCount} />}
  {view === 'extended' && <ExtendedCircle direct={direct} />}
  {view === 'messages' && <InboxList />}
  {view === 'requests' && <RequestsTab />}
  {view === 'direct' && <TrustedPicks />}
 </>;
}

function DirectTab({ direct, extendedCount }: { direct: CircleEntry[]; extendedCount: number }) {
 const qc = useQueryClient();
 const refresh = () => qc.invalidateQueries({ queryKey: circleQuery.queryKey });
 return <>
  <section className="circle-summary" aria-label="Your reach">
   <ReachRings direct={direct.length} extended={extendedCount} />
   <dl className="reach-stats">
    <div><dt>Direct Circle</dt><dd>{direct.length}</dd><p>{direct.length === 1 ? 'Woman' : 'Women'} you trust who accepted.</p></div>
    <div><dt>Extended Circle</dt><dd>{extendedCount}</dd><p>Additional women trusted by your Direct Circle, counted once and never including your Direct Circle. Shown only as a number.</p></div>
    <div><dt>Extended reach</dt><dd>Up to {direct.length + extendedCount}</dd><p>Women an Extended Circle Ripple can travel to through your trust network.</p></div>
   </dl>
  </section>
  <div className="circle-grid">
   <DirectCircle direct={direct} />
   <AddMember onSent={refresh} />
  </div>
 </>;
}

function RequestsTab() {
 const { data } = useSuspenseQuery(circleQuery);
 const qc = useQueryClient();
 const refresh = () => qc.invalidateQueries({ queryKey: circleQuery.queryKey });
 const by = (k: CircleEntry['kind']) => data.entries.filter(e => e.kind === k);
 const respond = useMutation({ mutationFn: async (v: { id: string; accept: boolean }) => { const { error } = await supabase.rpc('tellher_respond_trust', { _id: v.id, _accept: v.accept }); if (error) throw error; }, onSuccess: refresh });
 const cancel = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.rpc('tellher_cancel_trust', { _id: id }); if (error) throw error; }, onSuccess: refresh });
 return <div className="circle-grid">
  <section className="circle-card"><h2>Requests for you</h2>{by('incoming').length ? <ul className="member-list">{by('incoming').map(m => <Member key={m.connection_id} m={m}><Button size="sm" variant="editorial" disabled={respond.isPending} onClick={() => respond.mutate({ id: m.connection_id, accept: true })}><Check />Accept</Button><Button size="sm" variant="ghost" disabled={respond.isPending} onClick={() => respond.mutate({ id: m.connection_id, accept: false })}>Decline</Button></Member>)}</ul> : <p className="form-note">No requests waiting.</p>}{respond.isError && <p role="alert" className="form-note form-error">{message(respond.error)}</p>}</section>
  <section className="circle-card"><h2>Sent requests &amp; Trust Bridges</h2>{by('outgoing').length ? <ul className="member-list">{by('outgoing').map(m => <Member key={m.connection_id} m={m}><span className="status-label">Pending</span><Button size="sm" variant="ghost" aria-label={`Withdraw request to ${memberName(m)}`} disabled={cancel.isPending} onClick={() => cancel.mutate(m.connection_id)}><X /></Button></Member>)}</ul> : <p className="form-note">Nothing pending.</p>}</section>
 </div>;
}

function Member({ m, children }: { m: CircleEntry; children?: React.ReactNode }) {
 return <li className="member-row"><span className="member-initial" aria-hidden>{m.first_name.slice(0, 1).toUpperCase()}</span><div className="member-meta"><Link to="/profile/$memberId" params={{ memberId: m.member_id }} className="member-link"><strong>{memberName(m)}</strong></Link>{m.city && <span>{m.city}</span>}</div>{children && <div className="member-actions">{children}</div>}</li>;
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
 return <svg className="reach-rings" viewBox="0 0 240 240" role="img" aria-label={`You, ${direct} in your Direct Circle, ${extended} more in your Extended Circle`}>
  <circle cx="120" cy="120" r="100" className="ring-extended" /><circle cx="120" cy="120" r="68" className="ring-direct" /><circle cx="120" cy="120" r="9" className="ring-you" />
  <text x="120" y="146" className="ring-label">You</text><text x="120" y="47" className="ring-label">Direct · {direct}</text><text x="120" y="236" className="ring-label">Extended · {extended}</text>
 </svg>;
}

type Field = 'all' | 'name' | 'location' | 'known' | 'ask';
function DirectCircle({ direct }: { direct: CircleEntry[] }) {
 const [text, setText] = useState(''); const [field, setField] = useState<Field>('all');
 // Details come only from the viewer-checked member profile function, one call per Direct Circle member.
 const details = useQuery({ queryKey: ['direct-details', direct.map(d => d.member_id).join()], enabled: direct.length > 0, queryFn: async () => Object.fromEntries(await Promise.all(direct.map(async d => [d.member_id, (await supabase.rpc('tellher_member_profile', { _id: d.member_id })).data?.[0] ?? null] as const))) });
 const shown = useMemo(() => {
  const q = text.trim().toLowerCase(); if (!q) return direct;
  return direct.filter(d => { const p = details.data?.[d.member_id];
   const f: Record<Exclude<Field, 'all'>, string[]> = { name: [d.first_name, p?.last_name ?? d.last_initial], location: [d.city ?? '', p?.country ?? ''], known: p?.known_for ?? [], ask: p?.ask_me_about ?? [] };
   return (field === 'all' ? Object.values(f).flat() : f[field]).some(v => v.toLowerCase().includes(q)); });
 }, [direct, details.data, text, field]);
 return <section className="circle-card"><h2>Direct Circle</h2>
  {direct.length > 1 && <div className="shelf-filters" role="search" aria-label="Filter Direct Circle"><div className="field"><label htmlFor="dc-q">Search</label><Input id="dc-q" value={text} onChange={e => setText(e.target.value)} placeholder="Name, city, topic…" /></div><div className="field"><label htmlFor="dc-f">Search in</label><select id="dc-f" className="ext-select" value={field} onChange={e => setField(e.target.value as Field)}><option value="all">Everything</option><option value="name">Name</option><option value="location">Location</option><option value="known">Known for</option><option value="ask">Ask me about</option></select></div></div>}
  {direct.length ? shown.length ? <ScrollPanel label="Direct Circle members" className="member-list">{shown.map(m => <Member key={m.connection_id} m={m} />)}</ScrollPanel> : <p className="form-note">No one in your Direct Circle matches.</p> : <p className="form-note">No one yet. Invite a woman you trust below.</p>}</section>;
}
