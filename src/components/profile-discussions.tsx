import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowUpRight, LockKeyhole, Star, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollPanel } from '@/components/scroll-panel';
import { relativeTime, reachContext } from '@/lib/askher';
import { memberRipplesQuery, myStarsQuery, type ProfileDiscussion } from '@/lib/profile-discussions';

export function MemberRipples({ memberId, firstName, own = false }: { memberId: string; firstName: string; own?: boolean }) {
 const result = useQuery(memberRipplesQuery(memberId));
 return <section className="discussion-panel profile-ripples" aria-label={own ? 'My ripples' : `${firstName}’s ripples`}>
  <header className="discussion-panel-heading"><Waves aria-hidden /><h2>{own ? 'My ripples' : `${firstName}’s ripples`}</h2></header>
  <DiscussionState pending={result.isPending} error={result.isError} retry={() => void result.refetch()} items={result.data ?? []} label="Ripples" empty={own ? 'No named ripples yet.' : 'No ripples shared with you yet.'} />
 </section>;
}

export function PrivateStars() {
 const result = useQuery(myStarsQuery);
 return <section className="discussion-panel private-stars" aria-label="My stars">
  <header className="discussion-panel-heading"><Star aria-hidden /><h2>My stars</h2><LockKeyhole className="discussion-lock" aria-hidden /></header>
  <p className="private-note">Only you see this collection. Your stars stay anonymous to other women.</p>
  <DiscussionState pending={result.isPending} error={result.isError} retry={() => void result.refetch()} items={result.data ?? []} label="My stars" empty="No anonymous stars yet." />
 </section>;
}

function DiscussionState({ pending, error, retry, items, label, empty }: { pending: boolean; error: boolean; retry: () => void; items: ProfileDiscussion[]; label: string; empty: string }) {
 if (pending) return <p className="form-note" role="status">Loading…</p>;
 if (error) return <p className="form-note form-error" role="alert">These conversations couldn’t be loaded. <Button variant="ghost" size="sm" onClick={retry}>Try again</Button></p>;
 if (!items.length) return <p className="form-note">{empty}</p>;
 return <ScrollPanel label={label} className="discussion-grid">{items.map(q => <li key={q.id}>
  <Link to="/askher/$id" params={{ id: q.id }} className="mine-link discussion-link">
   <span className="discussion-meta"><span className="question-category">{q.category}</span><ArrowUpRight size={14} aria-hidden /></span>
   <span className="mine-body">{q.body}</span>
   <span className="form-note">{reachContext(q.audience_scope)}</span>
   <span className="form-note">{q.reply_count} {q.reply_count === 1 ? 'perspective' : 'perspectives'} · {relativeTime(q.created_at)}</span>
  </Link>
 </li>)}</ScrollPanel>;
}