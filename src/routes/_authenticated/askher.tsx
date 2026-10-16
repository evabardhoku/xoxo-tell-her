import { SentRipple } from '@/components/sent-ripple';
import { AskHerTabs } from '@/components/app-shell';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyRipple } from '@/components/brand';
import { pageHead } from '@/lib/metadata';
import { feedMapQuery } from '@/lib/perspectives';
import { feedQuery } from '@/lib/askher';
import { FeedFilters, QuestionCard, useFeedFilter } from '@/components/question-feed';

export const Route = createFileRoute('/_authenticated/askher')({
 validateSearch: zodValidator(z.object({ category: fallback(z.string(), '').default('') })),
 loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(feedQuery), context.queryClient.ensureQueryData(feedMapQuery)]),
 head: () => pageHead('AskHer', 'Questions from your trust network, without names.'),
 errorComponent: () => <p role="alert" className="form-note form-error">Questions could not be loaded. Please refresh.</p>,
 component: AskHer,
});

function AskHer() {
 const { data } = useSuspenseQuery(feedQuery); const { data: map } = useSuspenseQuery(feedMapQuery);
 const { category: initial } = Route.useSearch();
 const { f, setF, shown } = useFeedFilter(data, initial);
 return <>
  <div className="page-heading"><div><div className="eyebrow">ASKHER</div><h1>Room for another perspective.</h1><p>Questions that reached you through trust. No names, no rankings.</p></div><Button asChild variant="editorial"><Link to="/ripple"><Plus />Start a Trust Ripple</Link></Button></div>
  <SentRipple />
  <AskHerTabs />
  {data.length === 0 ? <section className="empty-panel"><EmptyRipple /><h2>A quieter kind of conversation.</h2><p>When a question reaches you through your circle or the community, it will appear here.</p></section>
   : <><FeedFilters f={f} setF={setF} />
   {shown.length ? <ul className="question-list">{shown.map(q => <QuestionCard key={q.id} q={q} counts={map[q.id]} />)}</ul> : <p className="form-note">No questions match these filters.</p>}</>}
 </>;
}

