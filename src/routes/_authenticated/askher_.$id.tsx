import { OpenComments } from '@/components/open-comments';
import { RippleAuthor } from '@/components/ripple-author';
import { AnonymousAvatar } from '@/components/avatars';
import { ReplyLike } from '@/components/reply-like';
import { rippleDestination } from '@/lib/ripple-identity';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, LockKeyhole, MoreHorizontal, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Echo, EchoRoomEntry } from '@/components/echo';
import { OtherSide } from '@/components/other-side';
import { RippleFieldNotes } from '@/components/ripple-field-notes';
import { Letters } from '@/components/letters';
import { PerspectiveMap } from '@/components/perspective-map';
import { PerspectiveSynthesis } from '@/components/perspective-synthesis';
import { pageHead } from '@/lib/metadata';
import { skyQuery } from '@/lib/constellations';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { errorText, feedQuery, instincts, reachContext, relativeTime } from '@/lib/askher';
import { feedMapQuery, perspectiveLabel, perspectives, questionQuery, tally, type Perspective } from '@/lib/perspectives';

export const Route = createFileRoute('/_authenticated/askher_/$id')({
 loader: ({ context, params }) => context.queryClient.ensureQueryData(questionQuery(params.id)),
 head: () => pageHead('Trust Ripple', 'A shared question, lived perspectives, and what happened next on TellHer.'),
 errorComponent: () => <Unavailable />,
 component: QuestionPage,
});

function Unavailable() {
 return <section className="empty-panel"><h2>This Ripple isn’t available.</h2><p>It may have been removed, or it wasn’t shared with you.</p><Button asChild variant="soft"><Link to="/home">Back to Sky</Link></Button></section>;
}

function QuestionPage() {
 const { id } = Route.useParams();
 const { data } = useSuspenseQuery(questionQuery(id));
 const sky = useQuery(skyQuery);
 const qc = useQueryClient();
 const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);
 if (!data.question) return <Unavailable />;
 const q = data.question;
 const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: questionQuery(id).queryKey }), qc.invalidateQueries({ queryKey: feedQuery.queryKey }), qc.invalidateQueries({ queryKey: feedMapQuery.queryKey })]);
 const removeReply = async (rid: string) => {
  if (!window.confirm('Delete your perspective?')) return;
  const { error } = await supabase.rpc('tellher_delete_reply', { _id: rid });
  if (error) return setNote({ text: errorText(error), error: true });
  setNote({ text: 'Your perspective was deleted.' }); refresh();
 };
 return <div className="question-detail">
  <Link to={rippleDestination(q.author_visibility)} className="back-link"><ArrowLeft size={14} />{q.author_visibility === 'named' ? 'My Feed' : 'Sky'}</Link>
   <article className={`ripple-question ripple-question--${q.audience_scope} ${q.is_mine ? 'ripple-question--mine' : ''}`}>
    <div className="eyebrow">TRUST RIPPLE</div>
   <p className="question-body">{q.body}</p>
   <RippleAuthor identity={q} showAnonymous />
   <div className="question-meta"><span className="question-category">{q.category}</span><span>{reachContext(q.audience_scope)}</span><span>{relativeTime(q.created_at)}</span>{q.is_mine && <span className="mine-label">Your Ripple</span>}</div>
  </article>
  {q.author_visibility === 'named' ? <section aria-labelledby="comments-title" className="reply-section"><h2 id="comments-title">Comments</h2><OpenComments id={id} isAuthor={q.is_mine} /></section> : <>
   <Echo id={id} isAuthor={q.is_mine} />
   <section aria-label="Range of perspectives" className="perspective-overview"><PerspectiveMap counts={tally(data.replies)} /></section>
   {!q.is_mine && !q.my_reply_id && <ReplyForm id={id} onDone={() => { setNote({ text: 'Thank you. Your perspective was added.' }); refresh(); }} />}
   <section aria-labelledby="replies-title" className="reply-section">
   <h2 id="replies-title">Perspectives</h2>
   {note && <p role={note.error ? 'alert' : 'status'} className={`form-note ${note.error ? 'form-error' : 'form-success'}`}>{note.text}</p>}
   {data.replies.length === 0 ? <p className="form-note">No perspectives yet.</p> : <>
    <ul className="question-list">{data.replies.map(r => <li key={r.id} className={`reply-card ${r.is_mine ? 'reply-card--mine' : ''}`}>
      <div className="perspective-avatar"><AnonymousAvatar avatar={r.anonymous_avatar} size={44} /></div>
      <div className="perspective-main"><div className="question-meta"><span className="perspective-name">{r.is_mine ? 'You' : 'A TellHer woman'}</span><span>{relativeTime(r.created_at)}</span>{r.is_mine && <DropdownMenu><DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label="Perspective options"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={() => void removeReply(r.id)}><Trash2 />Delete perspective</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</div>
      <span className="perspective-tag">{perspectiveLabel(r.perspective_tag)}</span><p className="reply-body">{r.body}</p>
      <ReplyLike reply={r} questionId={id} />
      </div>
    </li>)}</ul>
   </>}
   <PerspectiveSynthesis key={data.replies.length} id={id} replies={data.replies} />
   </section>
  {q.is_mine && q.my_instinct && <aside className="first-instinct" aria-label="My first instinct"><p className="private-note"><LockKeyhole size={12} />My first instinct · only you</p><p className="instinct-line">{instincts.find(i => i.value === q.my_instinct)?.label}</p>{q.my_note && <p className="form-note">{q.my_note}</p>}</aside>}
   <section className="trust-letter-section" aria-label="Trust Letter"><OtherSide id={id} isAuthor={q.is_mine} createdAt={q.created_at} /><Letters id={id} /><RippleFieldNotes id={id} /></section>
   <section className="women-here"><EchoRoomEntry id={id} /></section>
  </>}
  {(sky.data ?? []).some(r => r.category === q.category) && <Link to="/constellations/$topic" params={{ topic: q.category }} className="member-link related-constellation">Explore similar stories in Constellations</Link>}
 </div>;
}

function ReplyForm({ id, onDone }: { id: string; onDone: () => void }) {
 const [tag, setTag] = useState<Perspective | ''>(''); const [body, setBody] = useState('');
 const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
 const submit = async (e: React.FormEvent) => {
  e.preventDefault(); if (!tag) return; setBusy(true); setErr('');
  const { error } = await supabase.rpc('tellher_post_reply', { _id: id, _tag: tag, _body: body });
  setBusy(false); if (error) return setErr(errorText(error)); onDone();
 };
 return <form className="reply-form" onSubmit={submit}>
   <h2>Share your perspective</h2>
  <fieldset className="field"><legend>How would you see it?</legend>
   <div className="tag-grid">{perspectives.map(p => <label key={p.value} className={`tag-option ${tag === p.value ? 'is-selected' : ''}`}><input type="radio" name="perspective" value={p.value} checked={tag === p.value} onChange={() => setTag(p.value)} />{p.label}</label>)}</div>
  </fieldset>
  <div className="field"><label htmlFor="reply-body">Your response</label><textarea id="reply-body" className="reply-text" maxLength={1000} rows={4} value={body} onChange={e => setBody(e.target.value)} placeholder="Share what you’d consider, gently and briefly." /><span className="form-note">Shown as “A TellHer woman”. {body.length}/1000</span></div>
  {err && <p role="alert" className="form-note form-error">{err}</p>}
  <div><Button type="submit" variant="editorial" disabled={!tag || body.trim().length < 2 || busy}>Share perspective</Button></div>
 </form>;
}
