import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { errorText, relativeTime } from '@/lib/askher';
import { outcomeLabel, outcomeStatuses, type Outcome } from '@/lib/outcome';

/** Days after which the author is gently asked how things turned out. */
export const OUTCOME_PROMPT_DAYS = 7;

/** "The Other Side": the author's own update on what happened next. Others see it only when she shares it. */
export function OtherSide({ id, isAuthor, createdAt }: { id: string; isAuthor: boolean; createdAt?: string }) {
 const qc = useQueryClient();
 const q = useQuery({ queryKey: ['outcome', id], queryFn: async () => { const { data, error } = await supabase.rpc('tellher_outcome', { _q: id }); if (error) throw error; return ((data ?? [])[0] ?? null) as Outcome | null; } });
 const [editing, setEditing] = useState(false);
 if (q.isPending) return null;
 const o = q.data ?? null;
 if (!o && !isAuthor) return null;
 // The gentle prompt appears only once the Ripple has had some time to breathe.
 const due = !createdAt || Date.now() - Date.parse(createdAt) >= OUTCOME_PROMPT_DAYS * 86400000;
 if (!o && !due && !editing) return null;
 const done = () => { setEditing(false); qc.invalidateQueries({ queryKey: ['outcome', id] }); };
 return <section className="other-side" aria-labelledby="other-side-title">
  <div className="eyebrow" id="other-side-title">THE OTHER SIDE</div>
  {editing ? <OutcomeForm id={id} initial={o} onDone={done} onCancel={() => setEditing(false)} />
   : o ? <>
    {outcomeLabel(o.status) && <p className="other-side-status">{outcomeLabel(o.status)}</p>}
    <p className="other-side-summary">{o.summary}</p>
    {o.note && <p className="other-side-note">{o.note}</p>}
    <p className="form-note">{isAuthor ? (o.shared ? 'Shared anonymously with the women who could see this Ripple' : <span className="private-note"><LockKeyhole size={12} />Private — only you can see this</span>) : 'An update from the woman who asked'} · {relativeTime(o.updated_at)}</p>
    {isAuthor && <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit update</Button>}
   </>
   : <>
    <p className="other-side-summary">What happened in the end?</p>
    <p className="form-note">When you’re ready, you can add a few words about how things turned out. It may help the next woman in a similar place. You can keep it private, and come back to it any time.</p>
    <Button variant="soft" onClick={() => setEditing(true)}>Add an update</Button>
   </>}
 </section>;
}

function OutcomeForm({ id, initial, onDone, onCancel }: { id: string; initial: Outcome | null; onDone: () => void; onCancel: () => void }) {
 const [status, setStatus] = useState(initial?.status ?? '');
 const [summary, setSummary] = useState(initial?.summary ?? '');
 const [note, setNote] = useState(initial?.note ?? '');
 const [shared, setShared] = useState(initial?.shared ?? false);
 const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
 const save = async () => {
  setBusy(true); setErr(null);
  const { error } = await supabase.rpc('tellher_set_outcome', { _q: id, _status: status, _summary: summary, _note: note, _shared: shared });
  setBusy(false); if (error) return setErr(errorText(error)); onDone();
 };
 const remove = async () => { if (!window.confirm('Remove your update?')) return; const { error } = await supabase.rpc('tellher_delete_outcome', { _q: id }); if (error) return setErr(errorText(error)); onDone(); };
 return <div className="account-form">
  <fieldset className="field"><legend className="field-legend">Where did you land? <span className="form-note">(optional)</span></legend>
   <div className="other-side-chips">{outcomeStatuses.map(s => <Button key={s.value} type="button" size="sm" variant="ghost" className="choice-chip" aria-pressed={status === s.value} onClick={() => setStatus(status === s.value ? '' : s.value)}>{s.label}</Button>)}</div>
  </fieldset>
  <div className="field"><label htmlFor="os-summary">In a sentence, what happened next?</label><Input id="os-summary" value={summary} maxLength={280} onChange={e => setSummary(e.target.value)} /></div>
  <div className="field"><label htmlFor="os-note">Anything else you’d want another woman to know? <span className="form-note">(optional)</span></label><Textarea id="os-note" value={note} maxLength={2000} onChange={e => setNote(e.target.value)} /></div>
  <fieldset className="field"><legend className="field-legend">Who can see this update?</legend>
   <div className="choice-stack">
    <Button type="button" variant="ghost" className="choice-card" aria-pressed={!shared} onClick={() => setShared(false)}><strong>Keep it private</strong><span>Only you can see it. You can share it later.</span></Button>
    <Button type="button" variant="ghost" className="choice-card" aria-pressed={shared} onClick={() => setShared(true)}><strong>Share with the same women</strong><span>Visible, without your name, to everyone who could see this Ripple.</span></Button>
   </div>
  </fieldset>
  {err && <p role="alert" className="form-note form-error">{err}</p>}
  <div className="flex flex-wrap gap-2"><Button variant="editorial" disabled={busy || !summary.trim()} onClick={save}>Save update</Button><Button variant="ghost" onClick={onCancel}>Cancel</Button>{initial && <Button variant="ghost" onClick={remove}>Remove</Button>}</div>
 </div>;
}
