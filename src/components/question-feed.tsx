import { RippleAuthor } from '@/components/ripple-author';
import { Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Flag, LockKeyhole, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PerspectiveStrip } from '@/components/perspective-map';
import { feedMapQuery, type Counts } from '@/lib/perspectives';
import { categories, errorText, feedQuery, filterFeed, instincts, reachContext, relativeTime, type FeedFilter, type FeedQuestion } from '@/lib/askher';

/** Shared feed filter state + controls for AskHer and My Ripples. Filtering is client-side over the visibility-checked feed. */
export function useFeedFilter(list: FeedQuestion[], initialCategory = '') {
 const [f, setF] = useState<FeedFilter>({ kw: '', cat: (categories as readonly string[]).includes(initialCategory) ? initialCategory : '', reach: '', sort: 'newest', status: '', days: 0 });
 const shown = useMemo(() => filterFeed(list, f), [list, f]);
 return { f, setF, shown };
}
export function FeedFilters({ f, setF, id = 'f' }: { f: FeedFilter; setF: (f: FeedFilter) => void; id?: string }) {
 const up = (p: Partial<FeedFilter>) => setF({ ...f, ...p });
 return <div className="feed-filters" role="search" aria-label="Filter questions">
  <div className="field"><label htmlFor={`${id}-kw`}>Keyword</label><Input id={`${id}-kw`} value={f.kw} onChange={e => up({ kw: e.target.value })} placeholder="Search questions" /></div>
  <div className="field"><label htmlFor={`${id}-cat`}>Category</label><select id={`${id}-cat`} className="ext-select" value={f.cat} onChange={e => up({ cat: e.target.value })}><option value="">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
  <div className="field"><label htmlFor={`${id}-reach`}>Reach</label><select id={`${id}-reach`} className="ext-select" value={f.reach} onChange={e => up({ reach: e.target.value })}><option value="">All reach</option><option value="circle">Direct Circle</option><option value="extended">Extended Circle</option><option value="community">All TellHer women</option></select></div>
  <div className="field"><label htmlFor={`${id}-days`}>Date</label><select id={`${id}-days`} className="ext-select" value={f.days} onChange={e => up({ days: Number(e.target.value) })}><option value={0}>Any time</option><option value={7}>Past 7 days</option><option value={30}>Past 30 days</option></select></div>
  <div className="field"><label htmlFor={`${id}-status`}>Status</label><select id={`${id}-status`} className="ext-select" value={f.status} onChange={e => up({ status: e.target.value as FeedFilter['status'] })}><option value="">Any</option><option value="awaiting">Awaiting perspectives</option><option value="answered">Has perspectives</option></select></div>
  <div className="field"><label htmlFor={`${id}-sort`}>Order</label><select id={`${id}-sort`} className="ext-select" value={f.sort} onChange={e => up({ sort: e.target.value as FeedFilter['sort'] })}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></div>
 </div>;
}

export const reachReason = (s: string) => s === 'circle' ? 'Reached you through Direct reach' : s === 'extended' ? 'Reached you through Extended reach' : 'Shared with all TellHer women';
export const statusLabel = (q: FeedQuestion) => q.reply_count ? 'Open · has perspectives' : 'Open · awaiting perspectives';

export function QuestionCard({ q, counts, detail = false, badge }: { q: FeedQuestion; counts?: Counts | undefined; detail?: boolean; badge?: string }) {
 const qc = useQueryClient();
 const [reporting, setReporting] = useState(false); const [reason, setReason] = useState('');
 const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null); const [busy, setBusy] = useState(false);
 const refresh = () => { qc.invalidateQueries({ queryKey: feedQuery.queryKey }); qc.invalidateQueries({ queryKey: feedMapQuery.queryKey }); };
 const remove = async () => { if (!window.confirm('Delete this question for everyone?')) return; setBusy(true); const { error } = await supabase.rpc('tellher_delete_question', { _id: q.id }); setBusy(false); if (error) return setNote({ text: errorText(error), error: true }); refresh(); };
 const report = async () => { setBusy(true); const { error } = await supabase.rpc('tellher_report_question', { _id: q.id, _reason: reason }); setBusy(false); if (error) return setNote({ text: errorText(error), error: true }); setReporting(false); setNote({ text: 'Thank you. This question was reported for review.' }); };
 return <li className={`question-card ${q.is_mine ? 'question-card--mine' : ''}`}>
  <div className="question-meta"><span className="question-category">{q.category}</span><span>{reachContext(q.audience_scope)}</span><span>{relativeTime(q.created_at)}</span>{q.is_mine && <span className="mine-label">Your question</span>}{badge && <span className="status-badge">{badge}</span>}{detail && !badge && <span>{q.is_mine ? statusLabel(q) : reachReason(q.audience_scope)}</span>}</div>
   <RippleAuthor identity={q} />
  <Link to="/askher/$id" params={{ id: q.id }} className="question-link"><p className="question-body">{q.body}</p></Link>
  {q.is_mine && q.my_instinct && <p className="private-note"><LockKeyhole size={12} />Only you see this · {instincts.find(i => i.value === q.my_instinct)?.label}{q.my_note && ` — ${q.my_note}`}</p>}
  <div className="question-foot"><Link to="/askher/$id" params={{ id: q.id }} className="form-note inline-flex items-center gap-2">{counts && <PerspectiveStrip counts={counts} />}{q.reply_count} {q.reply_count === 1 ? 'perspective' : 'perspectives'}</Link>
   {q.is_mine ? <Button size="sm" variant="ghost" disabled={busy} onClick={remove}><Trash2 />Delete</Button> : !reporting && <Button size="sm" variant="ghost" disabled={busy} onClick={() => setReporting(true)}><Flag />Report</Button>}</div>
  {reporting && <div className="report-box field"><label htmlFor={`r-${q.id}`}>What’s the concern?</label><select id={`r-${q.id}`} className="report-select" value={reason} onChange={e => setReason(e.target.value)}><option value="">Choose a reason</option><option>Harassment or harm</option><option>Shares someone’s private information</option><option>Spam or not genuine</option><option>Something else</option></select><div className="flex gap-2"><Button size="sm" variant="editorial" disabled={!reason || busy} onClick={report}>Send report</Button><Button size="sm" variant="ghost" onClick={() => setReporting(false)}>Cancel</Button></div></div>}
  {note && <p role={note.error ? 'alert' : 'status'} className={`form-note ${note.error ? 'form-error' : 'form-success'}`}>{note.text}</p>}
 </li>;
}

