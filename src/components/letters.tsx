import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Flag, Heart, LockKeyhole, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { errorText, relativeTime } from '@/lib/askher';

type Letter = { id: string; body: string; where_now: string | null; created_at: string; mine: boolean; helped: boolean; help_count: number | null };
export const LETTER_MAX = 600;

/** Letters from the Other Side: anonymous testimony from women who have been there. Hidden when empty, unless the viewer may write one. */
export function Letters({ id }: { id: string }) {
 const qc = useQueryClient();
 const key = ['letters', id];
 const q = useQuery({ queryKey: key, queryFn: async () => {
  const [l, w] = await Promise.all([supabase.rpc('tellher_letters', { _q: id }), supabase.rpc('tellher_can_write_letter', { _q: id })]);
  if (l.error) throw l.error; if (w.error) throw w.error;
  return { letters: (l.data ?? []) as Letter[], canWrite: Boolean(w.data) };
 } });
 const [writing, setWriting] = useState(false);
 const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);
 if (q.isPending || !q.data) return null;
 const { letters, canWrite } = q.data;
 if (!letters.length && !canWrite) return null;
 const mine = letters.find(l => l.mine);
 const refresh = () => qc.invalidateQueries({ queryKey: key });
 const help = async (l: Letter) => { const { error } = await supabase.rpc(l.helped ? 'tellher_unhelp_letter' : 'tellher_help_letter', { _id: l.id }); if (error) return setNote({ text: errorText(error), error: true }); refresh(); };
 const report = async (l: Letter) => { const reason = window.prompt('What feels wrong about this letter?'); if (!reason?.trim()) return; const { error } = await supabase.rpc('tellher_report_letter', { _id: l.id, _reason: reason }); setNote(error ? { text: errorText(error), error: true } : { text: 'Thank you. The letter was reported.' }); };
 const remove = async (l: Letter) => { if (!window.confirm('Remove your letter?')) return; const { error } = await supabase.rpc('tellher_delete_letter', { _id: l.id }); if (error) return setNote({ text: errorText(error), error: true }); refresh(); };
 return <section className="letters" aria-labelledby="letters-title">
  <div className="eyebrow" id="letters-title">LETTERS FROM THE OTHER SIDE</div>
  <p className="form-note">Written by women who have lived something similar. Testimony, not advice.</p>
  {letters.length > 0 && <ul className="letter-list">{letters.map(l => <li key={l.id} className={`letter-card ${l.mine ? 'letter-card--mine' : ''}`}>
   <p className="letter-body">{l.body}</p>
   <p className="letter-sign">— {l.mine ? 'You' : 'A woman who has been there'}{l.where_now ? `, ${l.where_now}` : ''}</p>
   <div className="letter-foot"><span className="form-note">{relativeTime(l.created_at)}</span>
    {l.mine ? <>{l.help_count ? <span className="like-count"><Heart size={12} />{l.help_count} found this helpful <LockKeyhole size={11} aria-label="only you see this" /></span> : null}<Button size="sm" variant="ghost" onClick={() => setWriting(true)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => remove(l)}><Trash2 />Remove</Button></>
     : <><button type="button" className={`like-btn ${l.helped ? 'is-liked' : ''}`} aria-pressed={l.helped} onClick={() => help(l)}><Heart size={13} />This helped</button><button type="button" className="room-report" onClick={() => report(l)}><Flag size={12} />Report</button></>}
   </div>
  </li>)}</ul>}
  {note && <p role={note.error ? 'alert' : 'status'} className={`form-note ${note.error ? 'form-error' : 'form-success'}`}>{note.text}</p>}
  {canWrite && (writing ? <LetterForm id={id} initial={mine} onDone={() => { setWriting(false); refresh(); }} onCancel={() => setWriting(false)} />
   : !mine && <Button variant="soft" onClick={() => setWriting(true)}>Write a letter</Button>)}
 </section>;
}

function LetterForm({ id, initial, onDone, onCancel }: { id: string; initial?: Letter; onDone: () => void; onCancel: () => void }) {
 const [body, setBody] = useState(initial?.body ?? ''); const [where, setWhere] = useState(initial?.where_now ?? '');
 const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
 const save = async () => { setBusy(true); setErr(''); const { error } = await supabase.rpc('tellher_write_letter', { _q: id, _body: body, _where_now: where }); setBusy(false); if (error) return setErr(errorText(error)); onDone(); };
 return <div className="account-form">
  <div className="field"><label htmlFor="letter-body">What do you wish someone had told you?</label><Textarea id="letter-body" rows={5} maxLength={LETTER_MAX} value={body} onChange={e => setBody(e.target.value)} /><span className="form-note">Shared without your name. {body.length}/{LETTER_MAX}</span></div>
  <div className="field"><label htmlFor="letter-where">Where I am now <span className="form-note">(optional)</span></label><Input id="letter-where" maxLength={80} placeholder="e.g. a year later" value={where} onChange={e => setWhere(e.target.value)} /></div>
  {err && <p role="alert" className="form-note form-error">{err}</p>}
  <div className="flex flex-wrap gap-2"><Button variant="editorial" disabled={busy || !body.trim()} onClick={save}>{initial ? 'Save letter' : 'Send letter'}</Button><Button variant="ghost" onClick={onCancel}>Cancel</Button></div>
 </div>;
}
