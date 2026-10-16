import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, Flag, LockKeyhole } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { pageHead } from '@/lib/metadata';
import { errorText, relativeTime } from '@/lib/askher';
import { voiceLabel } from '@/lib/echo-room';

export const Route = createFileRoute('/_authenticated/askher_/$id_/room')({
 head: () => pageHead('Echo Room', 'A small anonymous room for women who share this experience.'),
 component: EchoRoom,
});

type Msg = { id: string; voice: number; body: string; created_at: string; mine: boolean };

function EchoRoom() {
 const { id } = Route.useParams(); const qc = useQueryClient();
 const room = useQuery({ queryKey: ['echo-room', id], queryFn: async () => { const { data, error } = await supabase.rpc('tellher_echo_room', { _q: id }); if (error) throw error; return (data ?? []) as Msg[]; }, refetchInterval: 8000, retry: false });
 const [body, setBody] = useState(''); const [busy, setBusy] = useState(false); const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);
 const back = <Link to="/askher/$id" params={{ id }} className="back-link"><ArrowLeft size={14} />Back to the Ripple</Link>;
 if (room.isError) return <div className="question-detail">{back}<section className="empty-panel"><h2>This Echo Room isn’t open to you.</h2><p>Echo Rooms open only for the woman who asked and the women who echoed her Ripple, once at least three have.</p></section></div>;
 const send = async () => {
  setBusy(true); setNote(null);
  const { error } = await supabase.rpc('tellher_echo_room_post', { _q: id, _body: body });
  setBusy(false); if (error) return setNote({ text: errorText(error), error: true });
  setBody(''); qc.invalidateQueries({ queryKey: ['echo-room', id] });
 };
 const report = async (m: Msg) => {
  const reason = window.prompt('What should we know about this message?'); if (!reason) return;
  const { error } = await supabase.rpc('tellher_report_room_message', { _id: m.id, _reason: reason });
  setNote(error ? { text: errorText(error), error: true } : { text: 'Thank you. The message was reported.' });
 };
 return <div className="question-detail">
  {back}
  <div className="page-heading"><div><div className="eyebrow">ECHO ROOM</div><h1>You’re not the only one.</h1><p>A small room for the woman who asked and the women who echoed her. Everyone here appears only as a voice.</p></div></div>
  <p className="private-note mb-6"><LockKeyhole size={12} />No names, pictures or profiles. Nothing here appears in search or anywhere else.</p>
  {room.isPending ? <p role="status" className="form-note">Opening the room…</p>
   : <ol className="room-thread">{room.data!.length === 0 && <li className="form-note">No one has written yet. You can start gently.</li>}
    {room.data!.map(m => <li key={m.id} className="room-msg" data-mine={m.mine} data-op={m.voice === 0}>
     <div className="question-meta"><span className="room-voice">{voiceLabel(m.voice)}{m.mine ? ' · you' : ''}</span><span>{relativeTime(m.created_at)}</span>{!m.mine && <button type="button" className="room-report" onClick={() => report(m)} aria-label={`Report message from ${voiceLabel(m.voice)}`}><Flag size={12} />Report</button>}</div>
     <p className="reply-body">{m.body}</p>
    </li>)}</ol>}
  <div className="room-composer">
   <label htmlFor="room-body" className="sr-only">Your message</label>
   <Textarea id="room-body" value={body} maxLength={1000} onChange={e => setBody(e.target.value)} placeholder="Share what helped, or what you’re still figuring out…" />
   <Button variant="editorial" disabled={busy || !body.trim()} onClick={send}>Share in the room</Button>
  </div>
  {note && <p role={note.error ? 'alert' : 'status'} className={`form-note ${note.error ? 'form-error' : 'form-success'}`}>{note.text}</p>}
 </div>;
}
