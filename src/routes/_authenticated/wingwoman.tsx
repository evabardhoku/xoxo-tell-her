import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowRight, LockKeyhole, Plus, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { pageHead } from '@/lib/metadata';
import { instincts, errorText, relativeTime } from '@/lib/askher';
import { SafetyPanel } from '@/components/safety';
import { mentionsImmediateRisk } from '@/lib/safety';
import { createReflection, sendWingwomanMessage, wingwomanContexts, wingwomanRelated, type Reflection } from '@/lib/wingwoman.functions';

export const Route = createFileRoute('/_authenticated/wingwoman')({
 validateSearch: zodValidator(z.object({ s: fallback(z.string().uuid().optional(), undefined) })),
 head: () => pageHead('Wingwoman', 'A private space to talk things through before reaching out on TellHer.'),
 component: Wingwoman,
});

type Msg = { id: string; role: string; content: string; created_at: string };
export const sessionsQuery = { queryKey: ['ww-sessions'], queryFn: async () => { const { data, error } = await supabase.from('wingwoman_sessions').select('id, title, context, updated_at').order('updated_at', { ascending: false }).limit(30); if (error) throw error; return data ?? []; } };
const threadQuery = (id: string) => ({ queryKey: ['ww-thread', id], queryFn: async () => {
 const [s, m] = await Promise.all([
  supabase.from('wingwoman_sessions').select('id, context, situation, instinct, reflection, created_at').eq('id', id).maybeSingle(),
  supabase.from('wingwoman_messages').select('id, role, content, created_at').eq('session_id', id).order('created_at'),
 ]);
 if (s.error) throw s.error; if (m.error) throw m.error;
 return { session: s.data, messages: (m.data ?? []) as Msg[] };
} });

function Wingwoman() {
 const { s } = Route.useSearch();
 const sessions = useQuery(sessionsQuery);
 return <>
  <div className="page-heading"><div><h1>Wingwoman</h1><p className="private-note"><LockKeyhole size={12} />A private conversation, at your own pace.</p><p className="form-note">A reflection tool, not a therapist, lawyer or emergency service.</p></div></div>
  <div className="ww-layout">
   <details className="ww-sessions"><summary>Conversation history</summary>
    <Button asChild variant="editorial" size="sm" className="w-full"><Link to="/wingwoman" search={{}}><Plus />New conversation</Link></Button>
    <p className="private-note"><LockKeyhole size={12} />Only you can see these.</p>
    {sessions.isError ? <p role="alert" className="form-note form-error">History could not be loaded. <Button variant="ghost" size="sm" onClick={() => void sessions.refetch()}>Try again</Button></p> : sessions.isPending ? <p role="status" className="form-note">Loading conversations…</p> : !sessions.data?.length ? <p className="form-note">No conversations yet.</p> : <ul>{sessions.data.map(x => <li key={x.id}><Link to="/wingwoman" search={{ s: x.id }} className="ww-session" aria-current={s === x.id ? 'page' : undefined}><span className="question-category">{x.context ?? 'Other'}</span><span className="ww-session-title">{x.title || 'Untitled'}</span><span className="form-note">{relativeTime(x.updated_at)}</span></Link></li>)}</ul>}
   </details>
   <div className="ww-main">{s ? <Thread key={s} id={s} /> : <Start />}</div>
  </div>
 </>;
}

function Start() {
 const [ctx, setCtx] = useState<(typeof wingwomanContexts)[number] | ''>('');
 const [situation, setSituation] = useState(''); const [instinct, setInstinct] = useState<string | null>(null);
 const [busy, setBusy] = useState(false); const [error, setError] = useState('');
 const run = useServerFn(createReflection); const navigate = useNavigate(); const qc = useQueryClient();
 const go = async () => {
  if (!ctx) return; setBusy(true); setError('');
  try { const r = await run({ data: { context: ctx, situation, instinct: instinct as never } }); await qc.invalidateQueries({ queryKey: sessionsQuery.queryKey }); navigate({ to: '/wingwoman', search: { s: r.id } }); }
  catch (e) { setError(errorText(e)); setBusy(false); }
 };
 return <section className="composer-card"><div className="composer-body">
  <fieldset className="field"><legend className="field-legend">What’s it about?</legend><div className="choice-row">{wingwomanContexts.map(c => <Button variant="ghost" type="button" key={c} className="choice-chip" aria-pressed={ctx === c} onClick={() => setCtx(c)} disabled={busy}>{c}</Button>)}</div></fieldset>
  <div className="field"><label htmlFor="ww-situation">What happened?</label><Textarea id="ww-situation" maxLength={4000} value={situation} disabled={busy} onChange={e => setSituation(e.target.value)} placeholder="In your own words…" /><span className="form-note">{situation.trim().length < 10 ? 'At least 10 characters.' : `${situation.length}/4000`}</span></div>
  <details><summary className="form-note">Add a private first instinct</summary><fieldset className="field"><legend className="field-legend">My first instinct (optional, private)</legend><div className="choice-row">{instincts.map(i => <Button variant="ghost" type="button" key={i.value} className="choice-chip" aria-pressed={instinct === i.value} disabled={busy} onClick={() => setInstinct(instinct === i.value ? null : i.value)}>{i.label}</Button>)}</div></fieldset></details>
  {error && <p role="alert" className="form-note form-error">{error}</p>}
  <div className="composer-actions"><span /><Button variant="editorial" disabled={!ctx || situation.trim().length < 10 || busy} onClick={go}>{busy ? 'Thinking it through…' : 'Start conversation'}<ArrowRight /></Button></div>
 </div></section>;
}

function ReflectionBody({ r }: { r: Reflection }) {
 return <>{r.safety_note && <p role="alert" className="private-note">{r.safety_note}</p>}
  <h3 className="field-legend">What stands out</h3><ul>{r.what_stands_out.map((x, i) => <li key={i}>{x}</li>)}</ul>
  <h3 className="field-legend">Questions worth asking yourself</h3><ul>{r.questions.map((x, i) => <li key={i}>{x}</li>)}</ul>
  <h3 className="field-legend">A reasonable next step</h3><p>{r.next_step}</p></>;
}

function Thread({ id }: { id: string }) {
 const qc = useQueryClient(); const navigate = useNavigate();
 const t = useQuery(threadQuery(id));
 const send = useServerFn(sendWingwomanMessage);
 const related = useServerFn(wingwomanRelated);
 const [text, setText] = useState(''); const [pending, setPending] = useState<string | null>(null); const [error, setError] = useState('');
 const [chipsGone, setChipsGone] = useState(false);
 const box = useRef<HTMLTextAreaElement>(null); const end = useRef<HTMLDivElement>(null);
 const rel = useQuery({ queryKey: ['ww-related', id], queryFn: () => related({ data: { sessionId: id } }), staleTime: 60_000 });
 useEffect(() => { box.current?.focus(); }, [pending, t.data]);
 useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [t.data?.messages.length, pending]);
 if (t.isPending) return <p role="status" className="form-note">Opening your conversation…</p>;
 if (t.isError || !t.data.session) return <section className="empty-panel"><h2>This conversation isn’t available.</h2><p>It may have been removed, or it belongs to someone else.</p><Button asChild variant="editorial" className="mt-6"><Link to="/wingwoman" search={{}}>Start a new conversation</Link></Button></section>;
 const { session, messages } = t.data;
 const submit = async () => {
  const content = text.trim(); if (!content || pending) return;
  setPending(content); setText(''); setError('');
  try { await send({ data: { sessionId: id, content } }); await qc.invalidateQueries({ queryKey: ['ww-thread', id] }); qc.invalidateQueries({ queryKey: sessionsQuery.queryKey }); }
  catch (e) { setError(errorText(e)); setText(content); }
  finally { setPending(null); }
 };
 const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submit(); } };
 const instinct = instincts.find(i => i.value === session.instinct)?.label;
 const atRisk = Boolean((session.reflection as Reflection | null)?.safety_note) || [session.situation ?? '', ...messages.filter(m => m.role === 'user').map(m => m.content)].some(mentionsImmediateRisk);
 const remove = async () => {
  if (!window.confirm('Delete this conversation? This cannot be undone.')) return;
  const { error } = await supabase.from('wingwoman_sessions').delete().eq('id', id);
  if (error) return setError(errorText(error));
  qc.removeQueries({ queryKey: ['ww-thread', id] }); await qc.invalidateQueries({ queryKey: sessionsQuery.queryKey }); navigate({ to: '/wingwoman', search: {} });
 };
 // Gentle next-step chips appear once Wingwoman has replied; each hides when it has nothing to show.
 const replied = Boolean(session.reflection) || messages.some(m => m.role !== 'user');
 const r = rel.data;
 const showChips = replied && !chipsGone && !pending;
 return <section className="ww-thread" aria-label="Conversation">
  <div className="ww-thread-head"><div className="question-meta"><span className="question-category">{session.context ?? 'Other'}</span><span>{relativeTime(session.created_at)}</span>{instinct && <span className="private-note"><LockKeyhole size={12} />Your instinct · {instinct}</span>}</div>
  <Button variant="ghost" size="sm" onClick={() => void remove()}>Delete conversation</Button>
</div>
  <ol className="ww-messages">
   <li className="ww-msg ww-user"><p>{session.situation}</p></li>
   {session.reflection && <li className="ww-msg ww-assistant"><span className="ww-voice">Wingwoman</span><ReflectionBody r={session.reflection as Reflection} /></li>}
   {messages.map(m => <li key={m.id} className={`ww-msg ${m.role === 'user' ? 'ww-user' : 'ww-assistant'}`}>{m.role !== 'user' && <span className="ww-voice">Wingwoman</span>}<p>{m.content}</p></li>)}
   {pending && <><li className="ww-msg ww-user"><p>{pending}</p></li><li className="ww-msg ww-assistant" role="status"><span className="ww-voice">Wingwoman</span><p className="ww-typing">Thinking it over…</p></li></>}
  </ol>
  {showChips && <div className="ww-chips" aria-label="Where to go from here">
   <Button variant="link" type="button" className="member-link ww-context-link" onClick={() => navigate({ to: '/ripple', search: { from: id } })}>Ask women anonymously</Button>
   {r && r.constellations > 0 && <Button variant="link" type="button" className="member-link ww-context-link" onClick={() => navigate({ to: '/constellations/$topic', params: { topic: r.topic } })}>Explore similar stories</Button>}
   {r?.lettersRippleId && <Button variant="link" type="button" className="member-link ww-context-link" onClick={() => navigate({ to: '/askher/$id', params: { id: r.lettersRippleId ?? '' } })}>Read relevant Letters</Button>}
  </div>}
  {atRisk && <SafetyPanel />}
  <div ref={end} />
  {error && <p role="alert" className="form-note form-error">{error}</p>}
  <div className="ww-composer"><label htmlFor="ww-reply" className="sr-only">Reply to Wingwoman</label><Textarea id="ww-reply" ref={box} rows={2} maxLength={4000} value={text} onChange={e => setText(e.target.value)} onKeyDown={onKey} disabled={!!pending} placeholder="Say what’s on your mind…" /><Button variant="editorial" size="icon" aria-label="Send" disabled={!text.trim() || !!pending} onClick={() => void submit()}><Send /></Button></div>
  <p className="form-note">Wingwoman offers perspective, not certainty. It can’t tell you whether something is safe.</p>
 </section>;
}
