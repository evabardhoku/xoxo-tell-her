import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, Flag, LockKeyhole, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { pageHead } from '@/lib/metadata';
import { errorText, relativeTime } from '@/lib/askher';
import { useAccount } from '@/hooks/account';
import { inboxQuery, messagesQuery } from '@/lib/between-us';

export const Route = createFileRoute('/_authenticated/between-us_/$conversationId')({
 head: () => pageHead('Between Us', 'A private conversation with a woman you trust.'),
 component: Conversation,
});

function Conversation() {
 const { conversationId: id } = Route.useParams();
 const { user } = useAccount(); const qc = useQueryClient();
 const inbox = useQuery({ ...inboxQuery, refetchInterval: 15000 });
 const msgs = useQuery({ ...messagesQuery(id), refetchInterval: 5000 });
 const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
 const [reporting, setReporting] = useState<string | null>(null); const [reason, setReason] = useState(''); const [note, setNote] = useState('');
 const end = useRef<HTMLDivElement>(null);
 const row = inbox.data?.find(r => r.conversation_id === id);
 const count = msgs.data?.length ?? 0;
 useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [count]);
 useEffect(() => { if (row) void supabase.rpc('tellher_mark_read', { _c: id }).then(() => qc.invalidateQueries({ queryKey: inboxQuery.queryKey })); }, [id, count, Boolean(row)]); // eslint-disable-line react-hooks/exhaustive-deps
 if (inbox.isPending || msgs.isPending) return <p role="status" className="form-note">Opening your conversation…</p>;
 if (!row) return <><Back /><section className="empty-panel"><LockKeyhole /><h2>This conversation isn’t available.</h2><p>Between Us conversations can only be opened by the two women in them.</p></section></>;
 const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['between-us-messages', id] }), qc.invalidateQueries({ queryKey: inboxQuery.queryKey })]);
 const send = async () => {
  const body = text.trim(); if (!body || busy) return; setBusy(true); setError('');
  const { error: e } = await supabase.rpc('tellher_send_message', { _c: id, _body: body });
  setBusy(false); if (e) return setError(errorText(e)); setText(''); await refresh();
 };
 const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } };
 const toggleBlock = async () => {
  if (!row.blocked_by_me && !window.confirm(`Block ${row.first_name}? Neither of you will be able to send messages here.`)) return;
  const { error: e } = await supabase.rpc(row.blocked_by_me ? 'tellher_unblock' : 'tellher_block', { _member: row.member_id }); if (e) return setError(errorText(e)); await refresh();
 };
 const report = async () => {
  const { error: e } = await supabase.rpc('tellher_report_message', { _id: reporting!, _reason: reason }); if (e) return setNote(errorText(e));
  setReporting(null); setReason(''); setNote('Thank you. This message was reported for review.');
 };
 return <>
  <Back />
  <section className="ww-thread" aria-label={`Conversation with ${row.first_name}`}>
   <div className="ww-thread-head"><div><h1 className="bu-title"><Link to="/profile/$memberId" params={{ memberId: row.member_id }} className="member-link">{row.first_name} {row.last_initial && `${row.last_initial}.`}</Link></h1><p className="private-note"><LockKeyhole size={12} />Private — only the two of you can read this.</p></div>
    <Button variant="ghost" size="sm" onClick={toggleBlock}>{row.blocked_by_me ? 'Unblock' : 'Block'}</Button></div>
   {note && <p role="status" className="form-note">{note}</p>}
   <ol className="ww-messages">{(msgs.data ?? []).map(m => { const mine = m.sender_id === user?.id; return <li key={m.id} className={`ww-msg ${mine ? 'ww-user' : 'bu-theirs'}`}>
    <p>{m.body}</p><span className="bu-time">{relativeTime(m.created_at)}{!mine && <button type="button" className="bu-report" onClick={() => setReporting(m.id)} aria-label="Report this message"><Flag size={11} /></button>}</span>
    {reporting === m.id && <span className="bu-report-form"><label htmlFor={`r-${m.id}`} className="sr-only">Reason</label><Textarea id={`r-${m.id}`} rows={2} maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} placeholder="What’s wrong with this message?" /><span className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => setReporting(null)}>Cancel</Button><Button size="sm" variant="editorial" disabled={!reason.trim()} onClick={report}>Report</Button></span></span>}
   </li>; })}</ol>
   {!(msgs.data ?? []).length && <p className="form-note">No messages yet. Say hello.</p>}
   <div ref={end} />
   {error && <p role="alert" className="form-note form-error">{error}</p>}
   {row.can_message ? <div className="ww-composer"><label htmlFor="bu-text" className="sr-only">Message {row.first_name}</label><Textarea id="bu-text" rows={2} maxLength={2000} value={text} onChange={e => setText(e.target.value)} onKeyDown={onKey} disabled={busy} placeholder="Write a message…" /><Button variant="editorial" size="icon" aria-label="Send" disabled={!text.trim() || busy} onClick={() => void send()}><Send /></Button></div>
    : <p className="private-note">{row.blocked_by_me ? 'You blocked her. Unblock to message again.' : 'Messaging isn’t available in this conversation. Between Us is only open between Direct Circle members.'}</p>}
  </section>
 </>;
}
function Back() { return <Link to="/between-us" className="member-link mb-6 inline-flex items-center gap-2 text-sm"><ArrowLeft size={14} />Between Us</Link>; }
