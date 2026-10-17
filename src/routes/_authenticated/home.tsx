import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ConstellationSky } from '@/components/constellation-sky';
import { filterStars, placeTitle, skyQuery, starModes, type StarMode } from '@/lib/constellations';
import { useDiscovery } from '@/hooks/discovery';
import { Button } from '@/components/ui/button';
import { QuestionCard } from '@/components/question-feed';
import { pageHead } from '@/lib/metadata';
import { feedQuery } from '@/lib/askher';
import { feedMapQuery } from '@/lib/perspectives';

export const Route = createFileRoute('/_authenticated/home')({
 validateSearch: (s: Record<string, unknown>): { view?: 'ripples' | 'constellations' } => (s['view'] === 'ripples' ? { view: 'ripples' } : s['view'] === 'constellations' ? { view: 'constellations' } : {}),
 head: () => pageHead('Sky', 'Anonymous Ripples, Constellations and women who’ve been here.'),
 component: SkyHub,
});


function SkyHub() {
 const sky = useQuery(skyQuery);
 const { newcomer } = useDiscovery();
 const { view } = Route.useSearch();
 return <div className="sky-hub">
  <header className="sky-head"><div><h1>Sky</h1><p className="form-note">Stories connect even when identities don’t.</p></div><Button asChild variant="soft" size="sm"><Link to="/ripple">Ask anonymously</Link></Button></header>
  {sky.isError ? <p role="alert" className="form-note form-error">The sky could not be loaded. Please refresh.</p> : newcomer && !sky.data?.length ? <StarterConstellations /> : sky.data ? <ConstellationSky rows={sky.data} /> : <p role="status" className="form-note">Drawing the sky…</p>}
  <section id="anonymous-ripples" aria-labelledby="anon-title" ref={el => { if (el && view === 'ripples') el.scrollIntoView(); }}><AnonymousRipples /></section>
 </div>;
}

const STARTERS = ['Everyday Life', 'Work', 'Dating & Boundaries'];
function StarterConstellations() {
 return <section aria-labelledby="starter-title">
  <div className="eyebrow" id="starter-title">A FEW PLACES TO BEGIN</div>
  <p className="form-note">Situations women here have lived. Wander in whenever you like — nothing you read is shared.</p>
  <ul className="member-list mt-3">{STARTERS.map(t => <li key={t}><Link to="/constellations/$topic" params={{ topic: t }} className="member-link inline-flex items-center gap-1">{placeTitle(t)}<ArrowRight size={14} /></Link></li>)}</ul>

 </section>;
}

/** Sky holds only anonymous Ripples; named ones live in My Feed. Same checked feed and cards, filtered client-side (never broadens access). */
function AnonymousRipples() {
 const feed = useQuery(feedQuery); const maps = useQuery(feedMapQuery);
 const [limit, setLimit] = useState(6); const [mode, setMode] = useState<StarMode>('random'); const [seed] = useState(() => Math.floor(Math.random() * 100000));
 const all = (feed.data ?? []).filter(q => q.author_visibility !== 'named').map(q => { const c = maps.data?.[q.id]; return { ...q, replies: c ? Object.values(c).reduce((a, b) => a + b, 0) : 0 }; });
 const list = filterStars(all, mode, Date.now(), seed);
 const current = starModes.find(m => m.value === mode)!;
 return <>
  <div className="star-filter" role="radiogroup" aria-labelledby="anon-title">
   <h2 id="anon-title" className="sky-section-title">Stars to visit</h2>
   <div className="star-filter-options">{starModes.map(m => <button key={m.value} type="button" role="radio" aria-checked={mode === m.value} className="star-filter-chip" onClick={() => { setMode(m.value); setLimit(6); }}>{m.label}</button>)}</div>
   <p className="form-note">{current.hint}</p>
  </div>
  {feed.isPending ? <p role="status" className="form-note">Gathering stars…</p>
  : feed.isError ? <p role="alert" className="form-note form-error">Stars could not be loaded. <Button variant="ghost" size="sm" onClick={() => void feed.refetch()}>Try again</Button></p>
  : !list.length ? <section className="empty-panel"><p>{all.length ? 'No stars match this view right now.' : 'No stars have reached you yet.'}</p></section>
  : <><ul className="question-list" key={mode}>{list.slice(0, limit).map(q => <QuestionCard key={q.id} q={q} counts={maps.data?.[q.id]} />)}</ul>{list.length > limit && <Button variant="ghost" onClick={() => setLimit(n => n + 6)}>Show more</Button>}</>}
 </>;
}
