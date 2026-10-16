import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/metadata';
import { relativeTime } from '@/lib/askher';
import { memberAvatar } from '@/lib/member.functions';
import { inboxQuery, type InboxRow } from '@/lib/between-us';

export const Route = createFileRoute('/_authenticated/between-us')({
 head: () => pageHead('Between Us', 'Private conversations with women you trust.'),
 component: Inbox,
});

function Inbox() {
 const inbox = useQuery({ ...inboxQuery, refetchInterval: 15000 });
 return <>
  <div className="page-heading"><div><div className="eyebrow">BETWEEN US</div><h1>Between Us</h1><p>Private conversations with women you trust.</p></div></div>
  <p className="private-note mb-6"><LockKeyhole size={13} />Only you and the woman you’re talking with can read these. Available with your Direct Circle only.</p>
  {inbox.isPending ? <p role="status" className="form-note">Opening your conversations…</p>
   : inbox.isError ? <p role="alert" className="form-note form-error">Your conversations couldn’t be loaded. Please try again.</p>
   : !inbox.data.length ? <section className="empty-panel"><h2>No conversations yet.</h2><p>Open the profile of a woman in your Direct Circle and choose “Message her”.</p><Button asChild variant="editorial" className="mt-6"><Link to="/circle">Go to Circle</Link></Button></section>
   : <ul className="bu-inbox">{inbox.data.map(r => <InboxItem key={r.conversation_id} r={r} />)}</ul>}
 </>;
}

function InboxItem({ r }: { r: InboxRow }) {
 const avatar = useQuery({ queryKey: ['member-avatar', r.member_id], enabled: r.has_avatar, queryFn: () => memberAvatar({ data: { id: r.member_id } }), staleTime: 240000 });
 return <li><Link to="/between-us/$conversationId" params={{ conversationId: r.conversation_id }} className="bu-row" data-unread={r.unread}>
  <span className="member-avatar ext-avatar" aria-hidden>{avatar.data?.url ? <img src={avatar.data.url} alt="" /> : r.first_name.slice(0, 1).toUpperCase()}</span>
  <span className="bu-row-main"><span className="bu-row-top"><strong>{r.first_name} {r.last_initial && `${r.last_initial}.`}</strong><span className="form-note">{relativeTime(r.last_at)}</span></span>
   <span className="bu-preview">{r.last_body ? `${r.last_mine ? 'You: ' : ''}${r.last_body}` : 'No messages yet'}</span>
   {!r.can_message && <span className="form-note">{r.blocked_by_me ? 'You blocked her' : 'Messaging unavailable'}</span>}</span>
  {r.unread && <span className="bu-unread"><span className="sr-only">Unread</span></span>}
 </Link></li>;
}
