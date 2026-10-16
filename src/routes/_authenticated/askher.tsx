import { createFileRoute, Link } from '@tanstack/react-router';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Flag, LockKeyhole, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { EmptyRipple } from '@/components/brand';
import { pageHead } from '@/lib/metadata';
import { PerspectiveStrip } from '@/components/perspective-map';
import { feedMapQuery, type Counts } from '@/lib/perspectives';
import { categories, errorText, feedQuery, instincts, reachContext, relativeTime, type FeedQuestion } from '@/lib/askher';

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
 const [kw, setKw] = useState(''); const [cat, setCat] = useState((categories as readonly string[]).includes(initial) ? initial : '');
 const [reach, setReach] = useState(''); const [sort, setSort] = useState<'newest' | 'oldest'>('newest'); const [unanswered, setUnanswered] = useState(false);
 const shown = useMemo(() => filterFeed(data, { kw, cat, reach, sort, unanswered }), [data, kw, cat, reach, sort, unanswered]);
 return <>
  <div className="page-heading"><div><div className="eyebrow">ASKHER</div><h1>Room for another perspective.</h1><p>Questions that reached you through trust. No names, no rankings.</p></div><Button asChild variant="editorial"><Link to="/ripple"><Plus />Start a Ripple</Link></Button></div>
  {data.length === 0 ? <section className="empty-panel"><EmptyRipple /><h2>A quieter kind of conversation.</h2><p>When a question reaches you through your circle or the community, it will appear here.</p></section>
   : <><div className="feed-filters" role="search" aria-label="Filter questions">
    <div className="field"><label htmlFor="f-kw">Keyword</label><Input id="f-kw" value={kw} onChange={e => setKw(e.target.value)} placeholder="Search questions" /></div>
    <div className="field"><label htmlFor="f-cat">Category</label><select id="f-cat" className="ext-select" value={cat} onChange={e => setCat(e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
    <div className="field"><label htmlFor="f-reach">Reach</label><select id="f-reach" className="ext-select" value={reach} onChange={e => setReach(e.target.value)}><option value="">All reach</option><option value="circle">Direct Circle</option><option value="extended">Extended Circle</option><option value="community">TellHer community</option></select></div>
    <div className="field"><label htmlFor="f-sort">Order</label><select id="f-sort" className="ext-select" value={sort} onChange={e => setSort(e.target.value as 'newest' | 'oldest')}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></div>
    <label className="feed-check"><input type="checkbox" checked={unanswered} onChange={e => setUnanswered(e.target.checked)} />Unanswered only</label>
   </div>
   {shown.length ? <ul className="question-list">{shown.map(q => <QuestionCard key={q.id} q={q} counts={map[q.id]} />)}</ul> : <p className="form-note">No questions match these filters.</p>}</>}
 </>;
}

function QuestionCard({ q, counts }: { q: FeedQuestion; counts?: Counts | undefined }) {
 const qc = useQueryClient();
 const [reporting, setReporting] = useState(false); const [reason, setReason] = useState('');
 const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null); const [busy, setBusy] = useState(false);
 const refresh = () => { qc.invalidateQueries({ queryKey: feedQuery.queryKey }); qc.invalidateQueries({ queryKey: feedMapQuery.queryKey }); };
 const remove = async () => { if (!window.confirm('Delete this question for everyone?')) return; setBusy(true); const { error } = await supabase.rpc('tellher_delete_question', { _id: q.id }); setBusy(false); if (error) return setNote({ text: errorText(error), error: true }); refresh(); };
 const report = async () => { setBusy(true); const { error } = await supabase.rpc('tellher_report_question', { _id: q.id, _reason: reason }); setBusy(false); if (error) return setNote({ text: errorText(error), error: true }); setReporting(false); setNote({ text: 'Thank you. This question was reported for review.' }); };
 return <li className="question-card">
  <div className="question-meta"><span className="question-category">{q.category}</span><span>{reachContext(q.audience_scope)}</span><span>{relativeTime(q.created_at)}</span>{q.is_mine && <span className="mine-label">Your question</span>}</div>
  <Link to="/askher/$id" params={{ id: q.id }} className="question-link"><p className="question-body">{q.body}</p></Link>
  {q.is_mine && q.my_instinct && <p className="private-note"><LockKeyhole size={12} />Only you see this · {instincts.find(i => i.value === q.my_instinct)?.label}{q.my_note && ` — ${q.my_note}`}</p>}
  <div className="question-foot"><Link to="/askher/$id" params={{ id: q.id }} className="form-note inline-flex items-center gap-2">{counts && <PerspectiveStrip counts={counts} />}{q.reply_count} {q.reply_count === 1 ? 'perspective' : 'perspectives'}</Link>
   {q.is_mine ? <Button size="sm" variant="ghost" disabled={busy} onClick={remove}><Trash2 />Delete</Button> : !reporting && <Button size="sm" variant="ghost" disabled={busy} onClick={() => setReporting(true)}><Flag />Report</Button>}</div>
  {reporting && <div className="report-box field"><label htmlFor={`r-${q.id}`}>What’s the concern?</label><select id={`r-${q.id}`} className="report-select" value={reason} onChange={e => setReason(e.target.value)}><option value="">Choose a reason</option><option>Harassment or harm</option><option>Shares someone’s private information</option><option>Spam or not genuine</option><option>Something else</option></select><div className="flex gap-2"><Button size="sm" variant="editorial" disabled={!reason || busy} onClick={report}>Send report</Button><Button size="sm" variant="ghost" onClick={() => setReporting(false)}>Cancel</Button></div></div>}
  {note && <p role={note.error ? 'alert' : 'status'} className={`form-note ${note.error ? 'form-error' : 'form-success'}`}>{note.text}</p>}
 </li>;
}

export function filterFeed(list: FeedQuestion[], f: { kw: string; cat: string; reach: string; sort: 'newest' | 'oldest'; unanswered: boolean }) {
 const k = f.kw.trim().toLowerCase();
 return list.filter(q => (!k || q.body.toLowerCase().includes(k) || q.category.toLowerCase().includes(k)) && (!f.cat || q.category === f.cat) && (!f.reach || q.audience_scope === f.reach) && (!f.unanswered || q.reply_count === 0))
  .sort((a, b) => (f.sort === 'newest' ? -1 : 1) * (Date.parse(a.created_at) - Date.parse(b.created_at)));
}
