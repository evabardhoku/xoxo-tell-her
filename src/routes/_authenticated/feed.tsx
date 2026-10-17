import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RippleAuthor } from '@/components/ripple-author';
import { OpenComments } from '@/components/open-comments';
import { pageHead } from '@/lib/metadata';
import { feedQuery, relativeTime } from '@/lib/askher';
import { openContextQuery, openOnly, rankFeed, relationLabel, type FeedFilterMode } from '@/lib/open-feed';
import { profileQuery } from '@/lib/profile';

export const Route = createFileRoute('/_authenticated/feed')({
 head: () => pageHead('My Feed', 'Open Ripples from women you know and the wider TellHer network.'),
 component: MyFeed,
});

const filters: { value: FeedFilterMode; label: string }[] = [{ value: 'for-you', label: 'For You' }, { value: 'circle', label: 'My Circle' }, { value: 'community', label: 'Community' }];

/** Open side of TellHer: only Ripples posted with the author's name, checked by the same feed function as Sky. */
function MyFeed() {
 const profile = useQuery(profileQuery);
 const feed = useQuery(feedQuery);
 const [mode, setMode] = useState<FeedFilterMode>('for-you');
 const [limit, setLimit] = useState(6);
 const open = openOnly(feed.data ?? []);
 const ctx = useQuery(openContextQuery(open.map(q => q.id)));
 const myTopics = new Set(open.filter(q => q.is_mine).map(q => q.category));
 const list = rankFeed(open, ctx.data ?? {}, mode, myTopics);
 const circleCount = open.filter(q => ['circle', 'mine'].includes(ctx.data?.[q.id]?.relation ?? '')).length;
 const first = profile.data?.first_name;
 return <div className="open-feed">
  <Link to="/ripple" className="mind-entry open-feed-mind"><span className="member-initial" aria-hidden>{first?.slice(0, 1) ?? 'T'}</span><span>What do you want to share today?</span></Link>
  <div className="segmented open-feed-filter" role="group" aria-label="Filter My Feed">{filters.map(f => <Button variant="ghost" key={f.value} type="button" className="segmented-option" aria-pressed={mode === f.value} onClick={() => { setMode(f.value); setLimit(6); }}>{f.label}</Button>)}</div>
  {feed.isPending ? <p role="status" className="form-note">Gathering your feed…</p>
   : feed.isError ? <p role="alert" className="form-note form-error">Your feed could not be loaded. <Button variant="ghost" size="sm" onClick={() => void feed.refetch()}>Try again</Button></p>
   : <>
    {mode !== 'community' && ctx.isSuccess && circleCount < 3 && open.length > circleCount && <p className="form-note open-feed-quiet">Your Circle is still quiet. Here are a few open conversations from TellHer.</p>}
    {!list.length ? <section className="empty-panel"><p>{mode === 'circle' ? 'No open Ripples from your Circle yet.' : 'No open Ripples yet. When women post with their name, they’ll appear here.'}</p></section>
     : <ol className="open-feed-list">{list.slice(0, limit).map(q => { const c = ctx.data?.[q.id]; const rel = c?.relation ?? 'community'; return <li key={q.id}>
      <article className={`open-ripple open-ripple--${rel === 'mine' ? 'circle' : rel}${q.is_mine ? ' open-ripple--mine' : ''}`} aria-label={`Open Ripple by ${q.first_name ?? 'a member'}`}>
       <header className="open-ripple-head"><RippleAuthor identity={q} /><p className="open-ripple-context"><span className="trust-tag">{relationLabel(c)}</span><span>{relativeTime(q.created_at)}</span></p></header>
       <span className="question-category">{q.category}</span>
       <Link to="/askher/$id" params={{ id: q.id }} className="open-ripple-body">{q.body}</Link>
       <OpenComments id={q.id} preview={2} isAuthor={q.is_mine} />
      </article>
     </li>; })}</ol>}
    {list.length > limit && <Button variant="ghost" onClick={() => setLimit(n => n + 6)}>Show more</Button>}
   </>}
 </div>;
}
