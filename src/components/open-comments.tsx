import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { memberAvatar } from '@/lib/member.functions';
import { errorText, feedQuery, relativeTime } from '@/lib/askher';
import { openCommentsQuery, type OpenComment } from '@/lib/open-feed';

function Avatar({ c }: { c: OpenComment }) {
 const avatar = useQuery({ queryKey: ['member-avatar', c.profile_id], enabled: Boolean(c.profile_id && c.has_avatar), queryFn: () => memberAvatar({ data: { id: c.profile_id! } }), staleTime: 240000 });
 return <span className="member-initial open-comment-avatar" aria-hidden>{avatar.data?.url ? <img className="h-full w-full rounded-full object-cover" src={avatar.data.url} alt="" /> : (c.first_name ?? 'T').slice(0, 1)}</span>;
}

/** Named comments on an open Ripple. Older replies from before open comments stay anonymous. */
export function OpenComments({ id, preview = 0, isAuthor = false }: { id: string; preview?: number; isAuthor?: boolean }) {
 const qc = useQueryClient();
 const comments = useQuery(openCommentsQuery(id));
 const [all, setAll] = useState(preview === 0);
 const [body, setBody] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
 const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: openCommentsQuery(id).queryKey }), qc.invalidateQueries({ queryKey: feedQuery.queryKey })]);
 const like = async (c: OpenComment) => { const { error } = await supabase.rpc(c.liked ? 'tellher_unlike_reply' : 'tellher_like_reply', { _reply: c.id }); if (error) setError(errorText(error)); refresh(); };
 const send = async (e: React.FormEvent) => { e.preventDefault(); if (!body.trim() || busy) return; setBusy(true); setError(''); const { error } = await supabase.rpc('tellher_post_open_comment', { _id: id, _body: body }); setBusy(false); if (error) return setError(errorText(error)); setBody(''); setAll(true); refresh(); };
 const list = comments.data ?? [];
 const shown = all ? list : list.slice(-preview);
 return <div className="open-comments">
  {comments.isPending ? <p role="status" className="form-note">Loading comments…</p> : comments.isError ? <p role="alert" className="form-note form-error">Comments could not be loaded.</p> : <>
   {list.length > 0 && <p className="form-note">{list.length} {list.length === 1 ? 'comment' : 'comments'}</p>}
   <ul className="open-comment-list">{shown.map(c => <li key={c.id} className={`open-comment ${c.is_mine ? 'open-comment--mine' : ''}`}>
    <Avatar c={c} />
    <div className="open-comment-main">
     <p className="open-comment-head">{c.is_mine ? <strong>You</strong> : c.profile_id ? <Link to="/profile/$memberId" params={{ memberId: c.profile_id }} className="member-link"><strong>{c.first_name}</strong></Link> : <strong>{c.first_name ?? 'A TellHer woman'}</strong>}<span>{relativeTime(c.created_at)}</span></p>
     <p className="reply-body">{c.body}</p>
    </div>
    <Button variant="ghost" size="sm" className="open-comment-like" disabled={c.is_mine} aria-pressed={c.liked} aria-label={`${c.liked ? 'Unlike' : 'Like'} comment, ${c.likes} likes`} onClick={() => like(c)}><Heart size={15} fill={c.liked ? 'currentColor' : 'none'} />{c.likes > 0 && <span>{c.likes}</span>}</Button>
   </li>)}</ul>
   {!all && list.length > preview && <Button variant="ghost" size="sm" onClick={() => setAll(true)}>View all {list.length} comments</Button>}
  </>}
  <form onSubmit={send} className="open-comment-form">
   <label htmlFor={`comment-${id}`} className="sr-only">Add a comment</label>
   <input id={`comment-${id}`} className="field-input" maxLength={1000} placeholder={isAuthor ? 'Reply in the comments…' : 'Add a comment…'} value={body} onChange={e => setBody(e.target.value)} />
   <Button type="submit" variant="editorial" size="sm" disabled={busy || !body.trim()}>{busy ? 'Posting…' : 'Post'}</Button>
  </form>
  {error && <p role="alert" className="form-note form-error">{error}</p>}
 </div>;
}
