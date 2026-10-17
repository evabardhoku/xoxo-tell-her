import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { errorText } from '@/lib/askher';

/** Exact counts are shown only at or above this number, to protect anonymity. Mirrors tellher_echo_signal. */
export const ECHO_THRESHOLD = 3;
type Signal = { echo_count: number | null; below_threshold: boolean; mine: boolean };
export const echoQuery = (id: string) => ({ queryKey: ['echo', id], queryFn: async () => { const { data, error } = await supabase.rpc('tellher_echo_signal', { _id: id }); if (error) throw error; return ((data ?? [])[0] ?? { echo_count: null, below_threshold: false, mine: false }) as Signal; } });

export function echoLine(s: Signal, isAuthor: boolean, quiet = true): string | null {
 if (s.echo_count && s.echo_count >= ECHO_THRESHOLD) return (isAuthor ? `${s.echo_count} women have been through something similar. You’re not alone in this.` : `${s.echo_count} women have been through something similar.`) + (quiet ? '' : ' Apparently, you’re not the only one.');
 if (s.below_threshold) return 'Others may relate to this too.';
 return null;
}

export function Echo({ id, isAuthor, compact = false, signalOnly = false, quiet = true }: { id: string; isAuthor: boolean; compact?: boolean; signalOnly?: boolean; quiet?: boolean }) {
 const qc = useQueryClient(); const q = useQuery(echoQuery(id));
 const [pulse, setPulse] = useState(0);
 const [busy, setBusy] = useState(false); const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);
 if (!q.data) return null;
 const s = q.data; const line = echoLine(s, isAuthor);
 const toggle = async () => {
  setBusy(true); setNote(null);
  const { error } = await supabase.rpc(s.mine ? 'tellher_unecho' : 'tellher_echo', { _id: id });
  setBusy(false);
  if (error) return setNote({ text: errorText(error), error: true });
  if (!s.mine) setPulse(value => value + 1);
  setNote({ text: s.mine ? 'Your Echo was removed.' : 'Echoed quietly. No one will see it was you.' });
  qc.invalidateQueries({ queryKey: ['echo', id] });
 };
 if (compact && isAuthor) return null;
 if (signalOnly) return line ? <p className="echo-line">{line}</p> : null;
 if (isAuthor && !line) return null;
 return <section className={compact ? 'echo-compact' : 'echo'} data-active={s.mine} aria-label="Echo">
  {!compact && <><span key={pulse} className={`echo-halo ${pulse > 0 ? 'echo-halo--pulse' : ''}`} aria-hidden><span /><span /><span /></span><div className="echo-text"><p className="eyebrow">ECHO</p><p className="echo-line">{line ?? 'You’re not alone in this.'}</p></div></>}
  {!isAuthor && <Button type="button" variant="outline" className="echo-button" aria-pressed={s.mine} disabled={busy} onClick={toggle}>{s.mine ? 'You echoed this · Remove' : 'This happened to me too'}</Button>}
  {note && <p role={note.error ? 'alert' : 'status'} className={`form-note ${note.error ? 'form-error' : ''}`}>{note.text}</p>}
 </section>;
}
