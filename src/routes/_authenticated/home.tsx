import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { ConstellationSky } from '@/components/constellation-sky';
import { placeTitle, skyQuery } from '@/lib/constellations';
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
 const { view } = Route.useSearch();
 const sky = useQuery(skyQuery);
 const { newcomer } = useDiscovery();
 const mind = <Link to="/wingwoman" className="mind-card"><span className="mind-card-rings" aria-hidden /><span className="eyebrow">WHAT’S ON YOUR MIND?</span><span className="mind-card-input">Something you can’t quite put down…</span><span className="form-note"><LockKeyhole size={12} className="inline mr-1" />Private until you choose to share.</span></Link>;
 // New accounts with no Ripples or circle yet get a calmer Sky; navigating to a view directly still shows it.

 return <div className="sky-hub">
  {mind}
  <div className="segmented" role="tablist" aria-label="Sky">
   <Link to="/home" search={{}} role="tab" aria-selected={view !== 'ripples'} className="segmented-option">Constellations</Link>
   <Link to="/home" search={{ view: 'ripples' }} role="tab" aria-selected={view === 'ripples'} className="segmented-option">Anonymous Ripples</Link>
  </div>
  {view === 'ripples' ? <AnonymousRipples /> : newcomer && !sky.data?.length ? <StarterConstellations /> : sky.data ? <ConstellationSky rows={sky.data} /> : <p role="status" className="form-note">Drawing the sky…</p>}
  <p className="form-note"><Link to="/askher" className="member-link">Your Ripples</Link> · <Link to="/wingwoman" search={{}} className="member-link">Think this through privately with Wingwoman</Link></p>
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

/** Sky holds only anonymous Ripples; named ones live in My Feed. Same checked feed and cards. */
function AnonymousRipples() {
 const feed = useQuery(feedQuery); const maps = useQuery(feedMapQuery);
 const [limit, setLimit] = useState(6);
 const list = (feed.data ?? []).filter(q => q.author_visibility !== 'named');
 if (feed.isPending) return <p role="status" className="form-note">Gathering anonymous Ripples…</p>;
 if (!list.length) return <section className="empty-panel"><p>No anonymous Ripples have reached you yet.</p><Button asChild variant="editorial" className="mt-6"><Link to="/ripple">Ask anonymously<ArrowRight /></Link></Button></section>;
 return <><ul className="question-list">{list.slice(0, limit).map(q => <QuestionCard key={q.id} q={q} counts={maps.data?.[q.id]} />)}</ul>{list.length > limit && <Button variant="ghost" onClick={() => setLimit(n => n + 6)}>Show more</Button>}</>;
}
