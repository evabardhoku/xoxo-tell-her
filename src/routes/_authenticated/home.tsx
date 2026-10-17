import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ConstellationSky } from '@/components/constellation-sky';
import { placeTitle, skyQuery, trendingThemes, type SkyRow } from '@/lib/constellations';
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
  {sky.data && <Trending rows={sky.data} />}
  <section id="anonymous-ripples" aria-labelledby="anon-title" ref={el => { if (el && view === 'ripples') el.scrollIntoView(); }}><h2 id="anon-title" className="sky-section-title">Recent anonymous Ripples</h2><AnonymousRipples /></section>
 </div>;
}

/** Themes, not people: newest activity first, counts only at or above the privacy threshold. */
function Trending({ rows }: { rows: SkyRow[] }) {
 const themes = trendingThemes(rows);
 if (!themes.length) return null;
 return <details className="sky-topics-disclosure"><summary>Explore recent themes</summary><section aria-labelledby="trending-title"><h2 id="trending-title" className="sr-only">Recent themes</h2>
  <ul className="sky-trending">{themes.map(t => <li key={t.category}><Link to="/constellations/$topic" params={{ topic: t.category }} className="sky-theme"><strong>{placeTitle(t.category)}</strong><span className="sky-theme-excerpt">“{t.excerpt}”</span><span className="form-note">{t.recent ? `${t.recent} recent anonymous Ripples` : 'A few recent stories'}</span></Link></li>)}</ul>
 </section></details>;
}

const STARTERS = ['Everyday Life', 'Work', 'Dating & Boundaries'];
function StarterConstellations() {
 return <section aria-labelledby="starter-title">
  <div className="eyebrow" id="starter-title">A FEW PLACES TO BEGIN</div>
  <p className="form-note">Situations women here have lived. Wander in whenever you like — nothing you read is shared.</p>
  <ul className="member-list mt-3">{STARTERS.map(t => <li key={t}><Link to="/constellations/$topic" params={{ topic: t }} className="member-link inline-flex items-center gap-1">{placeTitle(t)}<ArrowRight size={14} /></Link></li>)}</ul>

 </section>;
}

/** Sky holds only anonymous Ripples; named ones live in My Feed. Same checked feed and cards. */
function AnonymousRipples() {
 const feed = useQuery(feedQuery); const maps = useQuery(feedMapQuery);
 const [limit, setLimit] = useState(6);
 const list = (feed.data ?? []).filter(q => q.author_visibility !== 'named');
 if (feed.isPending) return <p role="status" className="form-note">Gathering anonymous Ripples…</p>;
 if (feed.isError) return <p role="alert" className="form-note form-error">Anonymous Ripples could not be loaded. <Button variant="ghost" size="sm" onClick={() => void feed.refetch()}>Try again</Button></p>;
 if (!list.length) return <section className="empty-panel"><p>No anonymous Ripples have reached you yet.</p></section>;
 return <><ul className="question-list">{list.slice(0, limit).map(q => <QuestionCard key={q.id} q={q} counts={maps.data?.[q.id]} />)}</ul>{list.length > limit && <Button variant="ghost" onClick={() => setLimit(n => n + 6)}>Show more</Button>}</>;
}
