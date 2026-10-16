import { SectionTabs } from '@/components/app-shell';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyRipple } from '@/components/brand';
import { pageHead } from '@/lib/metadata';
import { feedMapQuery } from '@/lib/perspectives';
import { feedQuery } from '@/lib/askher';
import { FeedFilters, QuestionCard, useFeedFilter } from '@/components/question-feed';

export const Route = createFileRoute('/_authenticated/my-ripples')({
 validateSearch: zodValidator(z.object({ view: fallback(z.string(), 'started').default('started') })),
 loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(feedQuery), context.queryClient.ensureQueryData(feedMapQuery)]),
 head: () => pageHead('My Ripples', 'The Ripples you started and the questions that reached you.'),
 errorComponent: () => <p role="alert" className="form-note form-error">Your Ripples could not be loaded. Please refresh.</p>,
 component: MyRipples,
});

function MyRipples() {
 const { view: raw } = Route.useSearch(); const view = raw === 'reached' ? 'reached' : 'started';
 const { data } = useSuspenseQuery(feedQuery); const { data: map } = useSuspenseQuery(feedMapQuery);
 const list = data.filter(q => (view === 'started') === q.is_mine);
 const { f, setF, shown } = useFeedFilter(list);
 const tab = (v: 'started' | 'reached', label: string, n: number) => <Link to="/my-ripples" search={{ view: v }} className="ripple-tab" role="tab" aria-selected={view === v} data-active={view === v}>{label} <span className="form-note">{n}</span></Link>;
 return <>
  <div className="page-heading"><div><div className="eyebrow">MY RIPPLES</div><h1>Your Ripple activity.</h1><p>{view === 'started' ? 'Questions you started. Your private instinct stays visible only to you.' : 'Questions that reached you, and why. Authors are never shown.'}</p></div></div>
  <SectionTabs label="AskHer sections"><Link to="/askher" activeOptions={{ exact: true, includeSearch: false }}>Community</Link><Link to="/my-ripples" activeOptions={{ includeSearch: false }}>My Ripples</Link><Link to="/ripple">Start a Trust Ripple</Link></SectionTabs>
  <div className="ripple-tabs" role="tablist" aria-label="My Ripples views">{tab('started', 'Started by me', data.filter(q => q.is_mine).length)}{tab('reached', 'Reached me', data.filter(q => !q.is_mine).length)}</div>
  {list.length === 0 ? <section className="empty-panel"><EmptyRipple /><h2>{view === 'started' ? 'You haven’t started a Ripple yet.' : 'Nothing has reached you yet.'}</h2><p>{view === 'started' ? 'When you send a question, it will appear here with its perspectives.' : 'Questions from your circle and the community will appear here.'}</p></section>
   : <><FeedFilters key={view} f={f} setF={setF} id={`mr-${view}`} />
    {shown.length ? <ul className="question-list">{shown.map(q => <QuestionCard key={q.id} q={q} counts={map[q.id]} detail />)}</ul> : <p className="form-note">No Ripples match these filters.</p>}</>}
 </>;
}
