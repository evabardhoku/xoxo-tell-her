import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { pageHead } from '@/lib/metadata';
import { instincts, errorText } from '@/lib/askher';
import { createReflection, wingwomanContexts, type Reflection } from '@/lib/wingwoman.functions';

export const Route = createFileRoute('/_authenticated/wingwoman')({ head: () => pageHead('Wingwoman', 'A private space to reflect before reaching out on TellHer.'), component: Wingwoman });

function Wingwoman() {
 const [ctx, setCtx] = useState<(typeof wingwomanContexts)[number] | ''>('');
 const [situation, setSituation] = useState('');
 const [instinct, setInstinct] = useState<string | null>(null);
 const [busy, setBusy] = useState(false); const [error, setError] = useState('');
 const [result, setResult] = useState<{ id: string; reflection: Reflection } | null>(null);
 const run = useServerFn(createReflection); const navigate = useNavigate();
 const ready = ctx && situation.trim().length >= 10;
 const go = async () => {
  if (!ctx) return; setBusy(true); setError('');
  try { setResult(await run({ data: { context: ctx, situation, instinct: instinct as never } })); }
  catch (e) { setError(errorText(e)); } finally { setBusy(false); }
 };
 return <>
  <div className="page-heading"><div><div className="eyebrow">WINGWOMAN</div><h1>Hear yourself a little clearer.</h1><p>A private space for reflection. Not a therapist, judge, or emergency service.</p></div></div>
  <section className="composer-card"><div className="composer-body">
   <p className="private-note"><LockKeyhole size={13} />Only you can see what you write here.</p>
   <fieldset className="field"><legend className="field-legend">Context</legend><div className="choice-row">{wingwomanContexts.map(c => <button type="button" key={c} className="choice-chip" aria-pressed={ctx === c} onClick={() => setCtx(c)} disabled={busy || !!result}>{c}</button>)}</div></fieldset>
   <div className="field"><label htmlFor="ww-situation">What happened?</label><Textarea id="ww-situation" maxLength={4000} value={situation} disabled={busy || !!result} onChange={e => setSituation(e.target.value)} placeholder="In your own words…" /><span className="form-note">{situation.trim().length < 10 ? 'At least 10 characters.' : `${situation.length}/4000`}</span></div>
   <fieldset className="field"><legend className="field-legend">My Instinct (optional, private) — before any reflection, how does it feel?</legend><div className="choice-row">{instincts.map(i => <button type="button" key={i.value} className="choice-chip" aria-pressed={instinct === i.value} disabled={busy || !!result} onClick={() => setInstinct(instinct === i.value ? null : i.value)}>{i.label}</button>)}</div></fieldset>
   {error && <p role="alert" className="form-note form-error">{error}</p>}
   {!result && <div className="composer-actions"><span /><Button variant="editorial" disabled={!ready || busy} onClick={go}>{busy ? 'Reflecting…' : 'Reflect with Wingwoman'}</Button></div>}
  </div></section>
  {result && <section className="composer-card" aria-label="Reflection"><div className="composer-body review">
   {result.reflection.safety_note && <p role="alert" className="private-note">{result.reflection.safety_note}</p>}
   <div className="field"><h2 className="field-legend">What stands out</h2><ul>{result.reflection.what_stands_out.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
   <div className="field"><h2 className="field-legend">Questions worth asking yourself</h2><ul>{result.reflection.questions.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
   <div className="field"><h2 className="field-legend">A reasonable next step</h2><p>{result.reflection.next_step}</p></div>
   <p className="form-note">Wingwoman offers reflection, not certainty. It can’t tell you whether something is safe.</p>
   <div className="composer-actions"><Button variant="ghost" onClick={() => { setResult(null); setSituation(''); setInstinct(null); setCtx(''); }}>Start over</Button><Button variant="editorial" onClick={() => navigate({ to: '/ripple', search: { from: result.id } })}>Send as a Trust Ripple<ArrowRight /></Button></div>
  </div></section>}
 </>;
}
