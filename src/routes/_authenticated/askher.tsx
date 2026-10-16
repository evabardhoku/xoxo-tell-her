import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { LockKeyhole, Plus, Sparkle } from 'lucide-react';
import { useDiscovery } from '@/hooks/discovery';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/metadata';
import { feedMapQuery, type Counts } from '@/lib/perspectives';
import { feedQuery, relativeTime, type FeedQuestion } from '@/lib/askher';
import { FeedFilters, QuestionCard, useFeedFilter } from '@/components/question-feed';
import { skyQuery } from '@/lib/constellations';

const search = z.object({
 view: fallback(z.string(), 'wingwoman').default('wingwoman'),
 category: fallback(z.string(), '').default(''),
});

export const Route = createFileRoute('/_authenticated/askher')({
 validateSearch: zodValidator(search),
 loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(feedQuery), context.queryClient.ensureQueryData(feedMapQuery)]),
 head: () => pageHead('Ask', 'Talk privately with Wingwoman, or send a Trust Ripple anonymously or with your name.'),
 errorComponent: () => <p role="alert" className="form-note form-error">Questions could not be loaded. Please refresh.</p>,
 component: AskHub,
});

function AskHub() {
 return <>
  <div className="page-heading"><div><div className="eyebrow">ASK</div><h1>Private thought or shared question?</h1></div></div>
  <div className="ask-paths">
   <Link to="/wingwoman" search={{}} className="ask-path"><LockKeyhole /><strong>Talk privately with Wingwoman</strong><span>Think it through at your own pace.</span></Link>
   <Link to="/ripple" className="ask-path"><Plus /><strong>Ask women with a Ripple</strong><span>Anonymous by default. Your reach, your choice.</span></Link>
  </div>
  <RipplesTab />
 </>;
}

/** Open → Has replies → Outcome shared, from the feed and constellation rows already visible to the viewer. */
function statusBadge(q: FeedQuestion, outcomes: Set<string>) {
 if (outcomes.has(q.id)) return 'Outcome shared';
 return q.reply_count > 0 ? 'Has replies' : 'Open';
}

function RipplesTab() {
 const { category: initial } = Route.useSearch();
 const { data } = useSuspenseQuery(feedQuery); const { data: map } = useSuspenseQuery(feedMapQuery);
 const sky = useQuery(skyQuery);
 const outcomes = new Set((sky.data ?? []).filter(r => r.has_outcome).map(r => r.id));
 const mine = data.filter(q => q.is_mine); const reached = data.filter(q => !q.is_mine);
 const { isNew } = useDiscovery();
 return <>
  {isNew && mine.length === 0 && <p className="form-note discovery-hint"><Sparkle size={12} className="inline mr-1" />Perspectives and your private first instinct appear after your first Ripple. <Link to="/ripple" className="member-link">Ask anonymously</Link> whenever you’re ready.</p>}
  <MineList list={mine} outcomes={outcomes} map={map} />
  <ReachedList list={reached} map={map} initial={initial} />
 </>;
}

function MineList({ list, outcomes, map }: { list: FeedQuestion[]; outcomes: Set<string>; map: Record<string, Counts | undefined> }) {
 const { f, setF, shown } = useFeedFilter(list);
 return <section aria-label="Questions you started" className="ask-section">
  <h2 className="eyebrow">MY RIPPLES</h2>
  {list.length === 0 ? <p className="form-note">Your first Ripple will appear here.</p>
   : <><FeedFilters f={f} setF={setF} id="ask-mine" />
   {shown.length ? <ul className="question-list">{shown.map(q => <QuestionCard key={q.id} q={q} counts={map[q.id]} detail badge={statusBadge(q, outcomes)} />)}</ul> : <p className="form-note">No Ripples match these filters.</p>}</>}
 </section>;
}

function ReachedList({ list, map, initial }: { list: FeedQuestion[]; map: Record<string, Counts | undefined>; initial: string }) {
 const { f, setF, shown } = useFeedFilter(list, initial);
 return <section aria-label="Ripples that reached you" className="ask-section">
  <h2 className="eyebrow">RIPPLES THAT REACHED ME</h2>
  {list.length === 0 ? <p className="form-note">No Ripples have reached you yet.</p>
   : <><FeedFilters f={f} setF={setF} id="ask-reached" />
   {shown.length ? <ul className="question-list">{shown.map(q => <QuestionCard key={q.id} q={q} counts={map[q.id]} detail />)}</ul> : <p className="form-note">No Ripples match these filters.</p>}</>}
 </section>;
}
