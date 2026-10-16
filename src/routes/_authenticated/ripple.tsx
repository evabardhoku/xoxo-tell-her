import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ReachRings } from '@/components/brand';
import { pageHead } from '@/lib/metadata';
import { categories, errorText, feedQuery, instincts, reachPreview, reaches, type Reach } from '@/lib/askher';
import { ripplePublication } from '@/lib/ripple-draft';

export const Route = createFileRoute('/_authenticated/ripple')({ validateSearch: (s: Record<string, unknown>): { from?: string } => (typeof s['from'] === 'string' ? { from: s['from'] } : {}), head: () => pageHead('Start a Trust Ripple', 'Ask a sensitive question anonymously and choose how far it travels.'), component: Composer });

const steps = ['Question', 'My Instinct', 'Reach', 'Review & Send'];
const contextCategory: Record<string, string> = { Dating: 'Dating & Boundaries', Work: 'Work' };

function Composer() {
 const { from } = Route.useSearch();
 const [step, setStep] = useState(0);
 const [category, setCategory] = useState('');
 const [body, setBody] = useState('');
 const [instinct, setInstinct] = useState('');
 const [note, setNote] = useState('');
 const [scope, setScope] = useState<Reach | ''>('');
 const [source, setSource] = useState<string | null>(null);
 const [sourceLoading, setSourceLoading] = useState(Boolean(from));
 const [sourceError, setSourceError] = useState('');
 const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
 const qc = useQueryClient(); const navigate = useNavigate();
 useEffect(() => {
  let active = true;
  setSource(null); setSourceError(''); setSourceLoading(Boolean(from));
  if (!from) return;
  const load = async () => {
   try {
    const { data, error } = await supabase.from('wingwoman_sessions').select('context, situation, instinct').eq('id', from).maybeSingle();
    if (!active) return;
    if (error || !data) { setSourceError('Your private Wingwoman conversation could not be loaded. Return to Wingwoman and try again.'); return; }
    setSource(data.situation ?? '');
    setBody((data.situation ?? '').slice(0, 2000)); setInstinct(data.instinct ?? ''); setCategory(contextCategory[data.context ?? ''] ?? '');
   } catch { if (active) setSourceError('Your private Wingwoman conversation could not be loaded. Return to Wingwoman and try again.'); }
   finally { if (active) setSourceLoading(false); }
  };
  void load();
  return () => { active = false; };
 }, [from]);
 const preview = useQuery({ queryKey: ['reach-preview'], queryFn: async () => {
  const [c, e] = await Promise.all([supabase.rpc('tellher_reach_preview', { _scope: 'circle' }), supabase.rpc('tellher_reach_preview', { _scope: 'extended' })]);
  if (c.error) throw c.error; if (e.error) throw e.error; return { circle: c.data ?? 0, extended: e.data ?? 0, community: null };
 } });
 const count = (s: Reach) => (s === 'community' ? null : preview.data?.[s]);
 const valid = [category && body.trim().length >= 10, Boolean(instinct), Boolean(scope) && (scope === 'community' || (count(scope as Reach) ?? 0) > 0), true][step];
 const send = async () => {
  if (step !== 3 || busy || sourceLoading || sourceError || !category || body.trim().length < 10 || !instinct || !scope) return;
  setBusy(true); setError('');
  const { error } = await supabase.rpc('tellher_publish_question', ripplePublication({ category, body, scope, instinct, note }));
  setBusy(false); if (error) return setError(errorText(error));
  await qc.invalidateQueries({ queryKey: feedQuery.queryKey }); navigate({ to: '/askher' });
 };
 return <>
  <div className="page-heading"><div><div className="eyebrow">TRUST RIPPLE</div><h1>Some things are worth asking.</h1><p>Your question travels without your name. Only you see your instinct.</p></div></div>
  <section className="composer-card">
   {from && <aside className="wingwoman-source" aria-label="Private Wingwoman source">
    <h2 className="field-legend">From your private Wingwoman conversation</h2>
    <p className="private-note"><LockKeyhole size={13} />Only you can see this.</p>
    {sourceLoading ? <p role="status" className="form-note">Loading your private conversation…</p> : sourceError ? <p role="alert" className="form-note form-error">{sourceError}</p> : <p className="wingwoman-source-text">{source}</p>}
   </aside>}
   <ol className="composer-steps" aria-label="Steps">{steps.map((s, i) => <li key={s} data-state={i === step ? 'current' : i < step ? 'done' : 'todo'} aria-current={i === step ? 'step' : undefined}><span>{i + 1}</span>{s}</li>)}</ol>
   {step === 0 && <div key="s0" className="composer-body">
    <fieldset className="field" disabled={sourceLoading || Boolean(sourceError)}><legend className="field-legend">Category</legend><div className="choice-row">{categories.map(c => <Button variant="ghost" type="button" key={c} className="choice-chip" aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</Button>)}</div></fieldset>
    <div className="field"><label htmlFor="q-body">{from ? 'Your editable Ripple draft' : 'What would you like a perspective on?'}</label><Textarea id="q-body" maxLength={2000} disabled={sourceLoading || Boolean(sourceError)} value={body} onChange={e => setBody(e.target.value)} placeholder="Your words belong here…" /><span className="form-note">{body.trim().length < 10 ? 'At least 10 characters.' : `${body.length}/2000`}</span></div>
   </div>}
   {step === 1 && <div key="s1" className="composer-body">
    <p className="private-note"><LockKeyhole size={13} />Private to you. Never shown to anyone who sees your question.</p>
    <fieldset className="field"><legend className="field-legend">Before anyone else weighs in, how does it feel?</legend><div className="choice-stack">{instincts.map(i => <Button variant="ghost" type="button" key={i.value} className="choice-card" aria-pressed={instinct === i.value} onClick={() => setInstinct(i.value)}>{i.label}</Button>)}</div></fieldset>
    <div className="field"><label htmlFor="q-note">A one-line note to yourself (optional)</label><Input id="q-note" maxLength={140} value={note} onChange={e => setNote(e.target.value)} /></div>
   </div>}
   {step === 2 && <div key="s2" className="composer-body"><fieldset className="field"><legend className="field-legend">How far should it travel?</legend><ReachRings level={scope === 'circle' ? 1 : scope === 'extended' ? 2 : scope === 'community' ? 3 : 0} /><div className="choice-stack">{reaches.map(r => { const empty = r.value !== 'community' && preview.data && (count(r.value) ?? 0) === 0; return <Button variant="ghost" type="button" key={r.value} className="choice-card" aria-pressed={scope === r.value} disabled={Boolean(empty)} onClick={() => setScope(r.value)}><strong>{r.label}</strong><span>{r.hint}</span><em>{preview.isPending ? 'Checking reach…' : empty ? 'No one here yet' : reachPreview(r.value, count(r.value))}</em></Button>; })}</div></fieldset>{preview.isError && <p role="alert" className="form-note form-error">Your circle reach could not be loaded. Please try again.</p>}</div>}
   {step === 3 && scope && <div key="s3" className="composer-body review">
    <section className="ripple-shared-preview" aria-label="What other members will see"><h2 className="field-legend">What other members will see</h2><div className="question-meta"><span className="question-category">{category}</span><span>{reaches.find(r => r.value === scope)?.label}</span></div><p className="question-body">{body.trim()}</p></section>
    <dl><div><dt>My Instinct · private</dt><dd>{instincts.find(i => i.value === instinct)?.label}{note.trim() && ` — ${note.trim()}`}</dd></div><div><dt>Reach</dt><dd>{reachPreview(scope, count(scope))}</dd></div></dl>
    <p className="form-note">Your name, photo and instinct are never shown with the question. Women may or may not choose to respond.</p>
   </div>}
   {error && <p role="alert" className="form-note form-error">{error}</p>}
   {step === 3 && source !== null && <p className="private-note ripple-sharing-note"><LockKeyhole size={13} />Only this Ripple will be shared. Your Wingwoman conversation stays private.</p>}
   <div className="composer-actions ripple-actions"><div className="ripple-back-actions">{step > 0 && <Button variant="ghost" disabled={busy} onClick={() => setStep(step - 1)}><ArrowLeft />Back</Button>}{from && <Button variant="ghost" disabled={busy} onClick={() => navigate({ to: '/wingwoman' })}>Cancel</Button>}</div>{step < 3 ? <Button variant="editorial" disabled={!valid || sourceLoading || Boolean(sourceError)} onClick={() => setStep(step + 1)}>Continue<ArrowRight /></Button> : <Button variant="editorial" disabled={busy} onClick={send}>{busy ? 'Sending…' : 'Send Trust Ripple'}</Button>}</div>
  </section>
 </>;
}
