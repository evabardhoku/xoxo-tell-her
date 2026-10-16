import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { errorText } from '@/lib/askher';

/** Exact counts are shown only at or above this number, to protect anonymity. Mirrors tellher_echo_signal. */
export const ECHO_THRESHOLD = 3;
type Signal = { echo_count: number | null; below_threshold: boolean; mine: boolean };
export const echoQuery = (id: string) => ({ queryKey: ['echo', id], queryFn: async () => { const { data, error } = await supabase.rpc('tellher_echo_signal', { _id: id }); if (error) throw error; return ((data ?? [])[0] ?? { echo_count: null, below_threshold: false, mine: false }) as Signal; } });

export function echoLine(s: Signal, isAuthor: boolean): string | null {
 if (s.echo_count && s.echo_count >= ECHO_THRESHOLD) return isAuthor ? `${s.echo_count} women have been through something similar. You’re not alone in this.` : `${s.echo_count} women have been through something similar.`;
 if (s.below_threshold) return 'Others may relate to this too.';
 return null;
}

export const echoRoomQuery = (id: string) => ({ queryKey: ['echo', id, 'room'], queryFn: async () => { const { data, error } = await supabase.rpc('tellher_echo_room_status', { _q: id }); if (error) throw error; return (data ?? [])[0] as { unlocked: boolean; can_enter: boolean } | undefined; } });

/** Echo Room entry, shown only when the viewer is eligible to enter. */
export function EchoRoomEntry({ id }: { id: string }) {
 const room = useQuery(echoRoomQuery(id));
 if (!room.data?.can_enter) return null;
 return <section className="echo-room-entry" aria-labelledby="echo-room-entry-title">
  <Link to="/askher/$id/room" params={{ id }} className="member-link text-sm echo-room-link">Talk with women who’ve been here</Link>
 </section>;
}

export function Echo({ id, isAuthor, compact = false, signalOnly = false }: { id: string; isAuthor: boolean; compact?: boolean; signalOnly?: boolean }) {
 const qc = useQueryClient(); const q = useQuery(echoQuery(id));
 const [busy, setBusy] = useState(false); const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);
 if (!q.data) return null;
 const s = q.data; const line = echoLine(s, isAuthor);
 const toggle = async () => {
  setBusy(true); setNote(null);
  const { error } = await supabase.rpc(s.mine ? 'tellher_unecho' : 'tellher_echo', { _id: id });
  setBusy(false);
  if (error) return setNote({ text: errorText(error), error: true });
  setNote({ text: s.mine ? 'Your Echo was removed.' : 'Echoed quietly. No one will see it was you.' });
  qc.invalidateQueries({ queryKey: ['echo', id] });
 };
 if (compact && isAuthor) return null;
 if (signalOnly) return line ? <p className="echo-line">{line}</p> : null;
 if (isAuthor && !line) return null;
 return <section className={compact ? 'echo-compact' : 'echo'} data-active={s.mine} aria-label="Echo">
  {!compact && line && <p className="echo-line">{line}</p>}
  {!isAuthor && <Button type="button" variant="outline" aria-pressed={s.mine} disabled={busy} onClick={toggle}>{s.mine ? 'You echoed this · Remove' : 'This happened to me too'}</Button>}
  {note && <p role={note.error ? 'alert' : 'status'} className={`form-note ${note.error ? 'form-error' : ''}`}>{note.text}</p>}
 </section>;
}
