import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Button } from './ui/button';
import { synthesizePerspectives, synthesisReady, type Synthesis } from '@/lib/synthesis.functions';
import { errorText } from '@/lib/askher';
import { Sparkles, ChevronUp } from 'lucide-react';

export function PerspectiveSynthesis({ id, replies, comments = false }: { id: string; replies: { body: string }[]; comments?: boolean }) {
 const run = useServerFn(synthesizePerspectives);
 const [s, setS] = useState<Synthesis | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
 if (!synthesisReady(replies)) return null;
 const go = async () => { setBusy(true); setErr(''); try { setS(await run({ data: { id } })); } catch (e) { setErr(errorText(e)); } finally { setBusy(false); } };
 return <section aria-label="Optional perspective summary" className="perspective-synthesis">
   <Button size="lg" variant="soft" className="synthesis-trigger" aria-expanded={Boolean(s)} disabled={busy} onClick={() => s ? setS(null) : void go()}><Sparkles size={18} />{busy ? 'Summarizing…' : s ? 'Hide summary' : comments ? 'Summarize comments' : 'Summarize perspectives'}{s && <ChevronUp size={16} />}</Button>
  {s && !s.enough && <p className="form-note">These replies are too few or too similar to summarize meaningfully yet.</p>}
  {s?.enough && <dl className="review"><div><dt>Common thread</dt><dd>{s.common_thread}</dd></div><div><dt>Different perspective</dt><dd>{s.different_perspective}</dd></div><div><dt>Questions still open</dt><dd><ul>{s.questions_open.map((q, i) => <li key={i}>{q}</li>)}</ul></dd></div></dl>}
  {s && <p className="form-note">AI-generated from {replies.length} {comments ? 'comments' : 'perspectives'}. Not a verdict.</p>}
  {err && <p role="alert" className="form-note form-error">{err}</p>}
 </section>;
}
