import { createFileRoute, Link } from '@tanstack/react-router';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, LockKeyhole, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PerspectiveMap } from '@/components/perspective-map';
import { pageHead } from '@/lib/metadata';
import { errorText, feedQuery, instincts, reachContext, relativeTime } from '@/lib/askher';
import { feedMapQuery, perspectiveLabel, perspectives, questionQuery, tally, type Perspective } from '@/lib/perspectives';

export const Route = createFileRoute('/_authenticated/askher_/$id')({
 loader: ({ context, params }) => context.queryClient.ensureQueryData(questionQuery(params.id)),
 head: () => pageHead('Question', 'A question and the range of perspectives it received.'),
 errorComponent: () => <Unavailable />,
 component: QuestionPage,
});

function Unavailable() {
 return <section className="empty-panel"><h2>This question isn’t available.</h2><p>It may have been removed, or it wasn’t shared with you.</p><Button asChild variant="soft"><Link to="/askher">Back to AskHer</Link></Button></section>;
}

function QuestionPage() {
 const { id } = Route.useParams();
 const { data } = useSuspenseQuery(questionQuery(id));
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
  <Link to="/askher" className="back-link"><ArrowLeft size={14} />AskHer</Link>
  <article className="question-card">
   <div className="question-meta"><span className="question-category">{q.category}</span><span>{reachContext(q.audience_scope)}</span><span>{relativeTime(q.created_at)}</span>{q.is_mine && <span className="mine-label">Your question</span>}</div>
   <p className="question-body">{q.body}</p>
  </article>
  <PerspectiveMap counts={tally(data.replies)} />
  {q.is_mine && q.my_instinct && <aside className="instinct-card"><p className="private-note"><LockKeyhole size={12} />Only you see this</p><p className="instinct-line">You started here: <strong>{instincts.find(i => i.value === q.my_instinct)?.label}</strong></p>{q.my_note && <p className="form-note">{q.my_note}</p>}</aside>}
  {!q.is_mine && !q.my_reply_id && <ReplyForm id={id} onDone={() => { setNote({ text: 'Thank you. Your perspective was added.' }); refresh(); }} />}
  {note && <p role={note.error ? 'alert' : 'status'} className={`form-note ${note.error ? 'form-error' : 'form-success'}`}>{note.text}</p>}
  <section aria-labelledby="replies-title" className="reply-section">
   <h2 id="replies-title" className="eyebrow">PERSPECTIVES</h2>
   {data.replies.length === 0 ? <p className="form-note">When women share how they see it, their responses will appear here.</p>
    : <ul className="question-list">{data.replies.map(r => <li key={r.id} className="reply-card">
     <div className="question-meta"><span className="question-category">{perspectiveLabel(r.perspective_tag)}</span><span>{r.is_mine ? 'You' : 'Community member'}</span><span>{relativeTime(r.created_at)}</span></div>
     <p className="reply-body">{r.body}</p>
     {r.is_mine && <div><Button size="sm" variant="ghost" onClick={() => removeReply(r.id)}><Trash2 />Delete</Button></div>}
    </li>)}</ul>}
  </section>
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
  <fieldset className="field"><legend>How would you see it?</legend>
   <div className="tag-grid">{perspectives.map(p => <label key={p.value} className={`tag-option ${tag === p.value ? 'is-selected' : ''}`}><input type="radio" name="perspective" value={p.value} checked={tag === p.value} onChange={() => setTag(p.value)} />{p.label}</label>)}</div>
  </fieldset>
  <div className="field"><label htmlFor="reply-body">Your response</label><textarea id="reply-body" className="reply-text" maxLength={1000} rows={4} value={body} onChange={e => setBody(e.target.value)} placeholder="Share what you’d consider, gently and briefly." /><span className="form-note">Shown as “Community member”. {body.length}/1000</span></div>
  {err && <p role="alert" className="form-note form-error">{err}</p>}
  <div><Button type="submit" variant="editorial" disabled={!tag || body.trim().length < 2 || busy}>Share perspective</Button></div>
 </form>;
}
