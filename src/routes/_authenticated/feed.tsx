import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuestionCard } from '@/components/question-feed';
import { pageHead } from '@/lib/metadata';
import { feedQuery } from '@/lib/askher';
import { questionProvenance } from '@/lib/current';
import { feedMapQuery } from '@/lib/perspectives';
import { profileQuery } from '@/lib/profile';

export const Route = createFileRoute('/_authenticated/feed')({
 head: () => pageHead('My Feed', 'Ripples women in your network chose to post with their name.'),
 component: MyFeed,
});

/** Open side of TellHer: only Ripples posted with the author's name, from the same checked feed as Sky. */
function MyFeed() {
 const profile = useQuery(profileQuery);
 const feed = useQuery(feedQuery); const maps = useQuery(feedMapQuery);
 const [limit, setLimit] = useState(6);
 const list = (feed.data ?? []).filter(q => q.author_visibility === 'named');
 const first = profile.data?.first_name;
 return <>
  <div className="page-heading"><div><div className="eyebrow">MY FEED</div><h1>{first ? `Welcome back, ${first}.` : 'Welcome back.'}</h1><p>Ripples women chose to share with their name.</p></div></div>
  <div className="flex gap-2 flex-wrap mb-6">
   <Button asChild variant="editorial"><Link to="/ripple"><Plus />Ask a Ripple</Link></Button>
   <Button asChild variant="ghost"><Link to="/wingwoman" search={{}}>Think this through privately with Wingwoman</Link></Button>
  </div>
  {feed.isPending ? <p role="status" className="form-note">Gathering your feed…</p>
   : feed.isError ? <p role="alert" className="form-note form-error">Your feed could not be loaded. Please refresh.</p>
   : !list.length ? <section className="empty-panel"><p>No open Ripples yet. When women in your network post with their name, they’ll appear here.</p><Button asChild variant="editorial" className="mt-6"><Link to="/circle">Go to My Circle<ArrowRight /></Link></Button></section>
   : <><ol className="current-stream">{list.slice(0, limit).map(q => <li key={q.id} className="current-item current-item--question"><p className="current-provenance">{questionProvenance(q)}</p><ul className="list-none p-0"><QuestionCard q={q} counts={maps.data?.[q.id]} /></ul></li>)}</ol>
    {list.length > limit && <Button variant="ghost" onClick={() => setLimit(n => n + 6)}>Show more</Button>}</>}
 </>;
}
