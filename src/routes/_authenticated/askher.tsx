import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { LockKeyhole, Plus, Sparkle } from 'lucide-react';
import { useDiscovery } from '@/hooks/discovery';
import { Button } from '@/components/ui/button';
import { EmptyRipple } from '@/components/brand';
import { pageHead } from '@/lib/metadata';
import { feedMapQuery, type Counts } from '@/lib/perspectives';
import { feedQuery, relativeTime, type FeedQuestion } from '@/lib/askher';
import { FeedFilters, QuestionCard, useFeedFilter } from '@/components/question-feed';
import { skyQuery } from '@/lib/constellations';
import { sessionsQuery } from '@/routes/_authenticated/wingwoman';

const search = z.object({
 view: fallback(z.string(), 'wingwoman').default('wingwoman'),
 category: fallback(z.string(), '').default(''),
});

export const Route = createFileRoute('/_authenticated/askher')({
 validateSearch: zodValidator(search),
 loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(feedQuery), context.queryClient.ensureQueryData(feedMapQuery)]),
 head: () => pageHead('Ask', 'Talk it through privately, or ask women you trust — without names.'),
 errorComponent: () => <p role="alert" className="form-note form-error">Questions could not be loaded. Please refresh.</p>,
 component: AskHub,
});

function AskHub() {
 const { view: raw } = Route.useSearch();
 const view = raw === 'ripples' ? 'ripples' : 'wingwoman';
 const tab = (v: string, label: string) => <Link to="/askher" search={{ view: v }} className="ripple-tab" role="tab" aria-selected={view === v} data-active={view === v}>{label}</Link>;
 return <>
  <div className="page-heading"><div><div className="eyebrow">ASK</div><h1>Room for another perspective.</h1><p>Start privately with Wingwoman, or ask women you trust — always without names.</p></div><Button asChild variant="editorial"><Link to="/ripple"><Plus />Ask anonymously</Link></Button></div>
  <div className="ripple-tabs" role="tablist" aria-label="Ask views">{tab('wingwoman', 'Wingwoman')}{tab('ripples', 'My Ripples')}</div>
  {view === 'wingwoman' ? <WingwomanTab /> : <RipplesTab />}
 </>;
}

function WingwomanTab() {
 const sessions = useQuery(sessionsQuery);
 return <section aria-label="Your private Wingwoman conversations">
  <p className="private-note"><LockKeyhole size={12} />Only you can see these. They never appear in search or on your profile.</p>
  <div className="mt-4 mb-4"><Button asChild variant="soft"><Link to="/wingwoman" search={{}}><Plus />New conversation</Link></Button></div>
  {sessions.isPending ? <p role="status" className="form-note">Opening your conversations…</p>
   : !(sessions.data ?? []).length ? <section className="empty-panel"><h2>No conversations yet.</h2><p>When something is on your mind, Wingwoman is a private first place to think it through.</p></section>
   : <ul className="question-list">{(sessions.data ?? []).map(x => <li key={x.id} className="question-card">
     <div className="question-meta"><span className="question-category">{x.context ?? 'Other'}</span><span>{relativeTime(x.updated_at)}</span></div>
     <Link to="/wingwoman" search={{ s: x.id }} className="question-link"><p className="question-body">{x.title || 'Untitled'}</p></Link>
    </li>)}</ul>}
 </section>;
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
  {isNew && mine.length === 0 && <p className="form-note discovery-hint"><Sparkle size={12} className="inline mr-1" />Your Perspective Map and private My Instinct appear after your first Ripple. <Link to="/ripple" className="member-link">Ask anonymously</Link> whenever you’re ready.</p>}
  <MineList list={mine} outcomes={outcomes} map={map} />
  <ReachedList list={reached} map={map} initial={initial} />
 </>;
}

function MineList({ list, outcomes, map }: { list: FeedQuestion[]; outcomes: Set<string>; map: Record<string, Counts | undefined> }) {
 const { f, setF, shown } = useFeedFilter(list);
 return <section aria-label="Questions you started" className="ask-section">
  <h2 className="eyebrow">STARTED BY ME</h2>
  {list.length === 0 ? <section className="empty-panel"><EmptyRipple /><h2>You haven’t started a Ripple yet.</h2><p>When you send a question, it will appear here with its perspectives.</p></section>
   : <><FeedFilters f={f} setF={setF} id="ask-mine" />
   {shown.length ? <ul className="question-list">{shown.map(q => <QuestionCard key={q.id} q={q} counts={map[q.id]} detail badge={statusBadge(q, outcomes)} />)}</ul> : <p className="form-note">No Ripples match these filters.</p>}</>}
 </section>;
}

function ReachedList({ list, map, initial }: { list: FeedQuestion[]; map: Record<string, Counts | undefined>; initial: string }) {
 const { f, setF, shown } = useFeedFilter(list, initial);
 return <section aria-label="Ripples that reached you" className="ask-section">
  <h2 className="eyebrow">REACHED ME</h2>
  {list.length === 0 ? <section className="empty-panel"><EmptyRipple /><h2>Nothing has reached you yet.</h2><p>Questions from your circle and beyond will appear here.</p></section>
   : <><FeedFilters f={f} setF={setF} id="ask-reached" />
   {shown.length ? <ul className="question-list">{shown.map(q => <QuestionCard key={q.id} q={q} counts={map[q.id]} detail />)}</ul> : <p className="form-note">No Ripples match these filters.</p>}</>}
 </section>;
}
