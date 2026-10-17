import { MemberAvatar } from '@/components/avatars';
import { CircleConnection } from '@/components/trust-code';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { pageHead } from '@/lib/metadata';
import { circleQuery, memberName, type CircleEntry } from '@/lib/circle';
import { ExtendedCircle } from '@/components/extended-circle';
import { InboxList } from '@/components/inbox-list';
import { ScrollPanel } from '@/components/scroll-panel';
import { useDiscovery } from '@/hooks/discovery';

export const Route = createFileRoute('/_authenticated/circle')({
 validateSearch: zodValidator(z.object({ view: fallback(z.string(), 'direct').default('direct'), code: fallback(z.string().max(20).optional(), undefined) })),
 loader: ({ context }) => context.queryClient.ensureQueryData(circleQuery),
 head: () => pageHead('Circle', 'Your small circle of trusted women on TellHer.'),
 errorComponent: () => <p role="alert" className="form-note form-error">Your circle could not be loaded. Please refresh.</p>,
 component: Circle,
});

const message = (e: unknown) => (e as { message?: string } | null)?.message || 'Something went wrong.';
type View = 'direct' | 'extended' | 'messages' | 'requests';

function Circle() {
 const { view: raw, code } = Route.useSearch();
 const view: View = (['direct', 'extended', 'messages', 'requests'] as const).includes(raw as View) ? raw as View : 'direct';
 const { data } = useSuspenseQuery(circleQuery);
 const direct = data.entries.filter(e => e.kind === 'direct');
 const pending = data.entries.filter(e => e.kind === 'incoming' || e.kind === 'outgoing').length;
 const { isNew } = useDiscovery();
 const easing = isNew && direct.length === 0;
 const tab = (v: View, label: string, hint?: string) => <Link to="/circle" search={{ view: v }} className="ripple-tab" role="tab" aria-selected={view === v} data-active={view === v}>{label}{hint && <span className="tab-hint"> · {hint}</span>}</Link>;
 return <>
  <div className="page-heading"><div><h1>My Circle</h1><p>Women you chose to trust directly.</p><p className="voice-line">Not followers. Women you actually trust.</p></div></div>
  <div className="ripple-tabs" role="tablist" aria-label="Circle views">{tab('direct', 'My Circle')}{tab('extended', 'Extended')}{tab('requests', 'Requests', pending > 0 ? String(pending) : undefined)}{tab('messages', 'Messages')}</div>
  {view === 'direct' && <DirectTab direct={direct} extendedCount={data.extendedCount} code={code} />}
  {view === 'extended' && easing && <p className="form-note discovery-hint">Your Direct Circle introduces new paths as it grows. <Link to="/circle" search={{ view: 'direct' }} className="member-link">Add your first trusted woman</Link></p>}
  {view === 'extended' && <ExtendedCircle direct={direct} />}
  {view === 'messages' && <InboxList />}
  {view === 'requests' && <RequestsTab />}
 </>;
}

function DirectTab({ direct, extendedCount, code }: { direct: CircleEntry[]; extendedCount: number; code?: string | undefined }) {
 return <div className="circle-direct-layout"><div className="circle-grid"><section className="circle-card circle-hero" aria-label="Your trust network at a glance"><CircleRipple direct={direct.length} extended={extendedCount} /><div className="circle-hero-text"><h2>Your trust network</h2><p className="form-note">{direct.length === 0 ? 'Every connection starts with one woman you trust.' : `${direct.length} ${direct.length === 1 ? 'woman' : 'women'} in your Direct Circle, ${extendedCount} more within reach.`}</p></div></section><DirectCircle direct={direct} /></div><div className="circle-connect-layout"><CircleConnection initial={code} /></div></div>;
}

function RequestsTab() {
 const { data } = useSuspenseQuery(circleQuery);
 const qc = useQueryClient();
 const refresh = () => qc.invalidateQueries({ queryKey: circleQuery.queryKey });
 const by = (k: CircleEntry['kind']) => data.entries.filter(e => e.kind === k);
 const respond = useMutation({ mutationFn: async (v: { id: string; circle: 'direct' | 'extended' | 'decline' }) => { const { error } = await supabase.rpc('tellher_respond_trust_tier', { _id: v.id, _circle: v.circle }); if (error) throw error; }, onSuccess: () => { refresh(); for (const key of ['member-profile', 'extended-circle', 'can-message']) void qc.invalidateQueries({ queryKey: [key] }); } });
 const cancel = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.rpc('tellher_cancel_trust', { _id: id }); if (error) throw error; }, onSuccess: refresh });
 return <div className="circle-grid">
  <section className="circle-card"><h2>Incoming</h2><p className="form-note">Direct includes Direct-only sharing and messages. Extended does not grant Direct-only access.</p>{by('incoming').length ? <ul className="member-list">{by('incoming').map(m => <Member key={m.connection_id} m={m}><Button size="sm" variant="editorial" disabled={respond.isPending} onClick={() => respond.mutate({ id: m.connection_id, circle: 'direct' })}><Check />Accept Direct</Button><Button size="sm" variant="outline" disabled={respond.isPending} onClick={() => respond.mutate({ id: m.connection_id, circle: 'extended' })}>Accept Extended</Button><Button size="sm" variant="ghost" disabled={respond.isPending} onClick={() => respond.mutate({ id: m.connection_id, circle: 'decline' })}>Decline</Button></Member>)}</ul> : <p className="form-note">No requests waiting.</p>}{respond.isError && <p role="alert" className="form-note form-error">{message(respond.error)}</p>}</section>
  <section className="circle-card"><h2>Sent</h2>{by('outgoing').length ? <ul className="member-list">{by('outgoing').map(m => <Member key={m.connection_id} m={m}><span className="status-label">Pending</span><Button size="sm" variant="ghost" disabled={cancel.isPending} onClick={() => cancel.mutate(m.connection_id)}><X />Cancel</Button></Member>)}</ul> : <p className="form-note">Nothing pending.</p>}</section>
 </div>;
}

function Member({ m, children, known }: { m: CircleEntry; children?: React.ReactNode; known?: string[] | undefined }) {
 return <li className="member-row"><MemberAvatar id={m.member_id} name={m.first_name} hasPhoto size={36} /><div className="member-meta"><Link to="/profile/$memberId" params={{ memberId: m.member_id }} className="member-link"><strong>{memberName(m)}</strong></Link>{m.city && <span>{m.city}</span>}{known && known.length > 0 && <span className="member-known">{known.slice(0, 3).join(' · ')}</span>}</div>{children && <div className="member-actions">{children}</div>}</li>;
}

/** Animated trust ripple: you at the center, Direct Circle dots orbiting the inner ring, Extended Circle dots drifting on the outer ring, connections sweeping along. */
function CircleRipple({ direct, extended }: { direct: number; extended: number }) {
 const inner = Math.max(direct, 3); const outer = Math.max(Math.min(extended, 14), 5);
 const dot = (i: number, n: number, r: number, cls: string) => { const a = (i / n) * Math.PI * 2; return <circle key={i} cx={160 + Math.cos(a) * r} cy={160 + Math.sin(a) * r} className={cls} style={{ animationDelay: `${i * 0.4}s` }} />; };
 const link = (i: number, n: number, r: number) => { const a = (i / n) * Math.PI * 2; return <line key={i} x1="160" y1="160" x2={160 + Math.cos(a) * r} y2={160 + Math.sin(a) * r} className="cr-link" style={{ animationDelay: `${i * 0.7}s` }} />; };
 return <svg className="circle-ripple" viewBox="0 0 320 320" role="img" aria-label={`You at the center, ${direct} in your Direct Circle, ${extended} more in your Extended Circle`}>
  <circle cx="160" cy="160" r="148" className="cr-ring cr-ring-1" /><circle cx="160" cy="160" r="104" className="cr-ring cr-ring-2" /><circle cx="160" cy="160" r="62" className="cr-ring cr-ring-3" />
  <g className="cr-orbit cr-orbit-outer">{Array.from({ length: outer }, (_, i) => dot(i, outer, 148, 'cr-dot cr-dot-ext'))}</g>
  <g className="cr-orbit cr-orbit-inner">{Array.from({ length: inner }, (_, i) => link(i, inner, 104))}{Array.from({ length: inner }, (_, i) => dot(i, inner, 104, 'cr-dot cr-dot-direct'))}</g>
  <circle cx="160" cy="160" r="16" className="cr-you" /><text x="160" y="165" className="cr-you-label">You</text>
 </svg>;
}

type Field = 'all' | 'name' | 'location' | 'known' | 'ask';
function DirectCircle({ direct }: { direct: CircleEntry[] }) {
 const [text, setText] = useState(''); const [field] = useState<Field>('all');
 // Details come only from the viewer-checked member profile function, one call per Direct Circle member.
 const details = useQuery({ queryKey: ['direct-details', direct.map(d => d.member_id).join()], enabled: direct.length > 0, queryFn: async () => Object.fromEntries(await Promise.all(direct.map(async d => [d.member_id, (await supabase.rpc('tellher_member_profile', { _id: d.member_id })).data?.[0] ?? null] as const))) });
 const shown = useMemo(() => {
  const q = text.trim().toLowerCase(); if (!q) return direct;
  return direct.filter(d => { const p = details.data?.[d.member_id];
   const f: Record<Exclude<Field, 'all'>, string[]> = { name: [d.first_name, p?.last_name ?? d.last_initial], location: [d.city ?? '', p?.country ?? ''], known: p?.known_for ?? [], ask: p?.ask_me_about ?? [] };
   return (field === 'all' ? Object.values(f).flat() : f[field]).some(v => v.toLowerCase().includes(q)); });
 }, [direct, details.data, text, field]);
 return <section className="circle-card"><div className="circle-members-heading"><h2>Direct Circle</h2><Button asChild variant="outline" size="sm"><Link to="/search" search={{ q: '' }}><Search size={14} />Find members</Link></Button></div>
  {direct.length > 1 && <div className="field circle-search" role="search"><label htmlFor="dc-q" className="sr-only">Search My Circle</label><Input id="dc-q" value={text} onChange={e => setText(e.target.value)} placeholder="Search by name, city or topic" /></div>}
  {direct.length ? shown.length ? <ScrollPanel label="Direct Circle members" className="member-list">{shown.map(m => <Member key={m.connection_id} m={m} known={details.data?.[m.member_id]?.known_for} />)}</ScrollPanel> : <p className="form-note">No one in your Direct Circle matches.</p> : <p className="form-note">No one yet. Find a member or exchange a connection code.</p>}</section>;
}
