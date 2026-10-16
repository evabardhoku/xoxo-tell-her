import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ArrowRight, LockKeyhole, MapPin } from 'lucide-react';
import { ConstellationSky } from '@/components/constellation-sky';
import { placeTitle, skyQuery } from '@/lib/constellations';
import { useDiscovery } from '@/hooks/discovery';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { QuestionCard } from '@/components/question-feed';
import { PickItem, picksQuery } from '@/components/trusted-picks';
import { shelfQuery } from '@/components/trust-shelf';
import { FieldNoteContext } from '@/components/field-note-context';
import type { ExtendedMember } from '@/components/extended-circle';
import { pageHead } from '@/lib/metadata';
import { profileQuery } from '@/lib/profile';
import { circleQuery, memberName } from '@/lib/circle';
import { feedQuery, relativeTime } from '@/lib/askher';
import { feedMapQuery } from '@/lib/perspectives';
import { availableFilters, applyFilter, questionProvenance, questionTier, rankCurrent, type CurrentFilter, type CurrentItem } from '@/lib/current';

export const Route = createFileRoute('/_authenticated/home')({
 validateSearch: (s: Record<string, unknown>): { view?: 'constellations' } => (s['view'] === 'constellations' ? { view: 'constellations' } : {}),
 head: () => pageHead('Sky', 'The Current and Constellations: what is moving through your TellHer trust network.'),
 component: SkyHub,
});

const SHELF_LIMIT = 12;

function SkyHub() {
 const { view } = Route.useSearch();
 const sky = useQuery(skyQuery);
 const { newcomer } = useDiscovery();
 const mind = <Link to="/wingwoman" className="mind-card"><span className="mind-card-rings" aria-hidden /><span className="eyebrow">WHAT’S ON YOUR MIND?</span><span className="mind-card-input">Something you can’t quite put down…</span><span className="form-note"><LockKeyhole size={12} className="inline mr-1" />Private until you choose to share.</span></Link>;
 // New accounts with no Ripples or circle yet get a calmer Sky; navigating to a view directly still shows it.
 if (newcomer && !view) return <div className="sky-hub">{mind}<StarterConstellations /></div>;
 return <div className="sky-hub">
  {mind}
  <div className="segmented" role="tablist" aria-label="Sky">
   <Link to="/home" search={{}} role="tab" aria-selected={!view} className="segmented-option">The Current</Link>
   <Link to="/home" search={{ view: 'constellations' }} role="tab" aria-selected={view === 'constellations'} className="segmented-option">Constellations</Link>
  </div>
  {view === 'constellations' ? (sky.data ? <ConstellationSky rows={sky.data} /> : <p role="status" className="form-note">Drawing the sky…</p>) : <CurrentPage />}
 </div>;
}

const STARTERS = ['Everyday Life', 'Work', 'Dating & Boundaries'];
function StarterConstellations() {
 return <section className="circle-card" aria-labelledby="starter-title">
  <div className="eyebrow" id="starter-title">A FEW PLACES TO BEGIN</div>
  <p className="form-note">Situations women here have lived. Wander in whenever you like — nothing you read is shared.</p>
  <ul className="member-list mt-3">{STARTERS.map(t => <li key={t}><Link to="/constellations/$topic" params={{ topic: t }} className="member-link inline-flex items-center gap-1">{placeTitle(t)}<ArrowRight size={14} /></Link></li>)}</ul>
  <p className="form-note mt-4">The Current fills in as you add trusted women. <Link to="/home" search={{ view: 'constellations' }} className="member-link">See the whole sky</Link></p>
 </section>;
}

function CurrentPage() {
 const profile = useQuery(profileQuery);
 const circle = useQuery(circleQuery);
 const feed = useQuery(feedQuery);
 const maps = useQuery(feedMapQuery);
 const picks = useQuery(picksQuery);
 const ext = useQuery({ queryKey: ['extended-circle', ''], queryFn: async () => { const { data, error } = await supabase.rpc('tellher_extended_circle', {}); if (error) throw error; return (data ?? []) as ExtendedMember[]; } });
 const direct = (circle.data?.entries ?? []).filter(e => e.kind === 'direct');
 // Field Notes come from the same checked shelf function as each member's profile.
 const shelfOwners = [
  ...direct.map(d => ({ id: d.member_id, name: d.first_name, tier: 0 as const, prov: `${d.first_name} · Direct Circle` })),
  ...(ext.data ?? []).map(m => ({ id: m.member_id, name: m.first_name, tier: 1 as const, prov: `${m.first_name} · Extended Circle via ${m.via}` })),
 ].slice(0, SHELF_LIMIT);
 const shelves = useQueries({ queries: shelfOwners.map(o => shelfQuery(o.id)) });
 const [filter, setFilter] = useState<CurrentFilter>('all');
 const [limit, setLimit] = useState(6);

 const loading = circle.isPending || feed.isPending || picks.isPending || ext.isPending;
 const items = useMemo(() => {
  const out: CurrentItem[] = [];
  for (const e of circle.data?.entries ?? []) if (e.kind === 'incoming') out.push({ kind: 'request', key: `r-${e.connection_id}`, tier: 0, topic: null, at: e.created_at, provenance: `${e.first_name} · wants to add you to her Direct Circle`, connection_id: e.connection_id, member_id: e.member_id, name: memberName(e) });
  for (const q of feed.data ?? []) out.push({ kind: 'question', key: `q-${q.id}`, tier: q.is_mine ? 0 : questionTier(q.audience_scope), topic: q.category, at: q.created_at, provenance: questionProvenance(q), q });
  for (const p of picks.data?.circle ?? []) out.push({ kind: 'pick', key: `p-${p.id}`, tier: 0, topic: p.category, at: (p as { created_at?: string }).created_at ?? new Date(0).toISOString(), provenance: `${p.recommender} · Direct Circle`, p });
  shelves.forEach((s, i) => { const o = shelfOwners[i]!; for (const n of s.data?.notes ?? []) out.push({ kind: 'note', key: `n-${n.id}`, tier: o.tier, topic: n.category, at: n.created_at, provenance: o.prov, id: n.id, title: n.title, body: n.body, location: n.location, member_id: o.id }); });
  for (const m of ext.data ?? []) out.push({ kind: 'person', key: `m-${m.member_id}`, tier: 1, topic: null, at: new Date(0).toISOString(), provenance: `${m.first_name} · Extended Circle via ${m.via}`, member_id: m.member_id, name: memberName(m), location: [m.city, m.country].filter(Boolean).join(', ') || null, known_for: m.known_for ?? [], has_avatar: m.has_avatar, bridge_pending: m.bridge_pending });
  const topics = new Set<string>([...(feed.data ?? []).filter(q => q.is_mine).map(q => q.category), ...(profile.data?.ask_me_about ?? []), ...(profile.data?.known_for ?? [])]);
  return rankCurrent(out, topics);
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [circle.data, feed.data, picks.data, ext.data, profile.data, shelves.map(s => s.dataUpdatedAt).join()]);
 const filters = availableFilters(items);
 const shown = applyFilter(items, filters.some(f => f.value === filter) ? filter : 'all');
 const first = profile.data?.first_name;

 return <>
  <div className="current-heading"><h2 className="current-welcome">{first ? `Welcome back, ${first}.` : 'Welcome back.'}</h2><p className="form-note">What useful things are moving through your trust network right now.</p></div>
  {loading ? <p role="status" className="form-note">Gathering what’s moving…</p>
   : !items.length ? <section className="empty-panel"><h2>The Current is quiet for now.</h2><p>As your Direct Circle grows, their questions, notes and picks will gather here.</p><Button asChild variant="editorial" className="mt-6"><Link to="/circle">Go to Circle<ArrowRight /></Link></Button></section>
   : <>
    {filters.length > 1 && <div className="current-filters" role="group" aria-label="Filter The Current">{filters.map(f => <button key={f.value} type="button" className="current-filter" aria-pressed={filter === f.value} onClick={() => { setFilter(f.value); setLimit(6); }}>{f.label}</button>)}</div>}
    <ol className="current-stream">{shown.slice(0, limit).map(i => <li key={i.key} className={`current-item current-item--${i.kind}`}><p className="current-provenance">{i.provenance}</p><CurrentCard i={i} counts={i.kind === 'question' ? maps.data?.[i.q.id] : undefined} /></li>)}</ol>
   </>}
 </>;
}

function CurrentCard({ i, counts }: { i: CurrentItem; counts?: Parameters<typeof QuestionCard>[0]['counts'] }) {
 if (i.kind === 'question') return <ul className="list-none p-0"><QuestionCard q={i.q} counts={counts} /></ul>;
 if (i.kind === 'pick') return <ul className="list-none p-0"><PickItem p={i.p} provenance={`Recommended by ${i.provenance.split(' · ')[0]}`} /></ul>;
 if (i.kind === 'note') return <div className="search-item"><div className="question-meta"><span className="question-category">{i.topic}</span>{i.location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{i.location}</span>}<span>{relativeTime(i.at)}</span></div><strong>{i.title}</strong><p className="search-snippet">{i.body}</p><Link to="/profile/$memberId" params={{ memberId: i.member_id }} className="member-link">Field Note · view her profile</Link><FieldNoteContext id={i.id} /></div>;
 if (i.kind === 'request') return <div className="search-item"><strong><Link to="/profile/$memberId" params={{ memberId: i.member_id }} className="member-link">{i.name}</Link> sent you a trust request</strong><p className="search-snippet">Accepting adds her to your Direct Circle. You can decide in Circle.</p><Link to="/circle" className="member-link inline-flex items-center gap-1">Review in Circle<ArrowRight size={14} /></Link></div>;
 return <div className="search-item"><strong><Link to="/profile/$memberId" params={{ memberId: i.member_id }} className="member-link">{i.name}</Link></strong>{i.location && <span className="form-note"><MapPin size={12} className="inline mr-1" />{i.location}</span>}{i.known_for.length > 0 && <span className="form-note">Known for {i.known_for.join(', ')}</span>}<Link to="/circle" className="member-link">{i.bridge_pending ? 'Trust Bridge requested' : 'Request a Trust Bridge in Circle'}</Link></div>;
}
