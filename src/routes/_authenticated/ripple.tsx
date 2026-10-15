import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { pageHead } from '@/lib/metadata';
import { categories, errorText, feedQuery, instincts, reachPreview, reaches, type Reach } from '@/lib/askher';

export const Route = createFileRoute('/_authenticated/ripple')({ head: () => pageHead('Start a Trust Ripple', 'Ask a sensitive question anonymously and choose how far it travels.'), component: Composer });

const steps = ['Question', 'My Instinct', 'Reach', 'Review & Send'];

function Composer() {
 const [step, setStep] = useState(0);
 const [category, setCategory] = useState('');
 const [body, setBody] = useState('');
 const [instinct, setInstinct] = useState('');
 const [note, setNote] = useState('');
 const [scope, setScope] = useState<Reach | ''>('');
 const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
 const qc = useQueryClient(); const navigate = useNavigate();
 const preview = useQuery({ queryKey: ['reach-preview'], queryFn: async () => {
  const [c, e] = await Promise.all([supabase.rpc('tellher_reach_preview', { _scope: 'circle' }), supabase.rpc('tellher_reach_preview', { _scope: 'extended' })]);
  if (c.error) throw c.error; if (e.error) throw e.error; return { circle: c.data ?? 0, extended: e.data ?? 0, community: null };
 } });
 const count = (s: Reach) => (s === 'community' ? null : preview.data?.[s]);
 const valid = [category && body.trim().length >= 10, Boolean(instinct), Boolean(scope) && (scope === 'community' || (count(scope as Reach) ?? 0) > 0), true][step];
 const send = async () => {
  setBusy(true); setError('');
  const { error } = await supabase.rpc('tellher_publish_question', { _category: category, _body: body, _scope: scope, _instinct: instinct, _note: note.trim() || null as unknown as string });
  setBusy(false); if (error) return setError(errorText(error));
  await qc.invalidateQueries({ queryKey: feedQuery.queryKey }); navigate({ to: '/askher' });
 };
 return <>
  <div className="page-heading"><div><div className="eyebrow">TRUST RIPPLE</div><h1>Some things are worth asking.</h1><p>Your question travels without your name. Only you see your instinct.</p></div></div>
  <section className="composer-card">
   <ol className="composer-steps" aria-label="Steps">{steps.map((s, i) => <li key={s} data-state={i === step ? 'current' : i < step ? 'done' : 'todo'} aria-current={i === step ? 'step' : undefined}><span>{i + 1}</span>{s}</li>)}</ol>
   {step === 0 && <div className="composer-body">
    <fieldset className="field"><legend className="field-legend">Category</legend><div className="choice-row">{categories.map(c => <button type="button" key={c} className="choice-chip" aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}</div></fieldset>
    <div className="field"><label htmlFor="q-body">What would you like a perspective on?</label><Textarea id="q-body" maxLength={2000} value={body} onChange={e => setBody(e.target.value)} placeholder="Your words belong here…" /><span className="form-note">{body.trim().length < 10 ? 'At least 10 characters.' : `${body.length}/2000`}</span></div>
   </div>}
   {step === 1 && <div className="composer-body">
    <p className="private-note"><LockKeyhole size={13} />Private to you. Never shown to anyone who sees your question.</p>
    <fieldset className="field"><legend className="field-legend">Before anyone else weighs in, how does it feel?</legend><div className="choice-stack">{instincts.map(i => <button type="button" key={i.value} className="choice-card" aria-pressed={instinct === i.value} onClick={() => setInstinct(i.value)}>{i.label}</button>)}</div></fieldset>
    <div className="field"><label htmlFor="q-note">A one-line note to yourself (optional)</label><Input id="q-note" maxLength={140} value={note} onChange={e => setNote(e.target.value)} /></div>
   </div>}
   {step === 2 && <div className="composer-body"><fieldset className="field"><legend className="field-legend">How far should it travel?</legend><div className="choice-stack">{reaches.map(r => { const empty = r.value !== 'community' && preview.data && (count(r.value) ?? 0) === 0; return <button type="button" key={r.value} className="choice-card" aria-pressed={scope === r.value} disabled={Boolean(empty)} onClick={() => setScope(r.value)}><strong>{r.label}</strong><span>{r.hint}</span><em>{preview.isPending ? 'Checking reach…' : empty ? 'No one here yet' : reachPreview(r.value, count(r.value))}</em></button>; })}</div></fieldset></div>}
   {step === 3 && scope && <div className="composer-body review">
    <dl><div><dt>Category</dt><dd>{category}</dd></div><div><dt>Question</dt><dd className="review-body">{body.trim()}</dd></div><div><dt>My Instinct · private</dt><dd>{instincts.find(i => i.value === instinct)?.label}{note.trim() && ` — ${note.trim()}`}</dd></div><div><dt>Reach</dt><dd>{reachPreview(scope, count(scope))}</dd></div></dl>
    <p className="form-note">Your name, photo and instinct are never shown with the question. Women may or may not choose to respond.</p>
   </div>}
   {error && <p role="alert" className="form-note form-error">{error}</p>}
   <div className="composer-actions">{step > 0 ? <Button variant="ghost" onClick={() => setStep(step - 1)}><ArrowLeft />Back</Button> : <span />}{step < 3 ? <Button variant="editorial" disabled={!valid} onClick={() => setStep(step + 1)}>Continue<ArrowRight /></Button> : <Button variant="editorial" disabled={busy} onClick={send}>{busy ? 'Sending…' : 'Send Trust Ripple'}</Button>}</div>
  </section>
 </>;
}
