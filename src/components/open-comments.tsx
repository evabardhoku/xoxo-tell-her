import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, ChevronUp, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { MemberAvatar } from '@/components/avatars';
import { PerspectiveSynthesis } from '@/components/perspective-synthesis';
import { errorText, feedQuery, relativeTime } from '@/lib/askher';
import { openCommentsQuery, type OpenComment } from '@/lib/open-feed';

function Avatar({ c }: { c: OpenComment }) { return <MemberAvatar id={c.profile_id} name={c.first_name} hasPhoto={c.has_avatar} size={32} />; }

/** Heart + counter on the side of a comment; uses the same checked reply-like functions as anonymous perspectives, never revealing who liked. */
function CommentLike({ c, id }: { c: OpenComment; id: string }) {
 const qc = useQueryClient();
 const [busy, setBusy] = useState(false);
 const toggle = async () => {
  if (busy || c.is_mine) return; setBusy(true);
  const { error } = await supabase.rpc(c.liked ? 'tellher_unlike_reply' : 'tellher_like_reply', { _reply: c.id });
  setBusy(false); if (!error) await qc.invalidateQueries({ queryKey: openCommentsQuery(id).queryKey });
 };
 return c.is_mine
  ? <span className="comment-like" aria-label={`${c.likes} ${c.likes === 1 ? 'like' : 'likes'}`}><Heart size={15} /><span>{c.likes}</span></span>
  : <Button variant="ghost" type="button" className="comment-like" aria-pressed={c.liked} aria-label={c.liked ? 'Unlike comment' : 'Like comment'} disabled={busy} onClick={() => void toggle()}><Heart size={15} /><span>{c.likes}</span></Button>;
}

/** Named comments on an open Ripple. Older replies from before open comments stay anonymous. */
export function OpenComments({ id, preview = 0, isAuthor = false }: { id: string; preview?: number; isAuthor?: boolean }) {
 const qc = useQueryClient();
 const comments = useQuery(openCommentsQuery(id));
 const [all, setAll] = useState(preview === 0);
 const [body, setBody] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
 const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: openCommentsQuery(id).queryKey }), qc.invalidateQueries({ queryKey: feedQuery.queryKey })]);
 const send = async (e: React.FormEvent) => { e.preventDefault(); if (!body.trim() || busy) return; setBusy(true); setError(''); const { error } = await supabase.rpc('tellher_post_open_comment', { _id: id, _body: body }); setBusy(false); if (error) return setError(errorText(error)); setBody(''); setAll(true); refresh(); };
 const list = comments.data ?? [];
 const shown = all ? list : [];
 return <div className="open-comments">
  {comments.isPending ? <p role="status" className="form-note">Loading comments…</p> : comments.isError ? <p role="alert" className="form-note form-error">Comments could not be loaded.</p> : <>
   {preview > 0 && <Button variant="ghost" size="sm" className="open-comments-toggle" aria-expanded={all} aria-controls={`comments-${id}`} onClick={() => setAll(value => !value)}><MessageCircle size={16} />{list.length} {list.length === 1 ? 'comment' : 'comments'}{all && <ChevronUp size={16} />}</Button>}
   {(all || preview === 0) && <ul id={`comments-${id}`} className={`open-comment-list ${preview > 0 ? 'open-comment-list--feed' : ''}`}>{shown.map(c => <li key={c.id} className={`open-comment ${c.is_mine ? 'open-comment--mine' : ''}`}>
    <Avatar c={c} />
    <div className="open-comment-main">
     <p className="open-comment-head">{c.is_mine ? <strong>You</strong> : c.profile_id ? <Link to="/profile/$memberId" params={{ memberId: c.profile_id }} className="member-link"><strong>{c.first_name}</strong></Link> : <strong>{c.first_name ?? 'A TellHer woman'}</strong>}<span>{relativeTime(c.created_at)}</span></p>
     <p className="reply-body">{c.body}</p>
    </div>
    <CommentLike c={c} id={id} />
   </li>)}</ul>}
  </>}
  {(all || preview === 0) && comments.isSuccess && <PerspectiveSynthesis key={JSON.stringify(list.map(c => [c.id, c.body]))} id={id} replies={list} comments />}
  {(all || preview === 0) && <form onSubmit={send} className="open-comment-form">
   <label htmlFor={`comment-${id}`} className="sr-only">Add a comment</label>
   <input id={`comment-${id}`} className="field-input" maxLength={1000} placeholder={isAuthor ? 'Reply in the comments…' : 'Add a comment…'} value={body} onChange={e => setBody(e.target.value)} />
   <Button type="submit" variant="editorial" size="sm" disabled={busy || !body.trim()}>{busy ? 'Posting…' : 'Post'}</Button>
  </form>}
  {error && <p role="alert" className="form-note form-error">{error}</p>}
 </div>;
}
