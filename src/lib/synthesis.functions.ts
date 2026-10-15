import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export type Synthesis = { enough: boolean; common_thread: string; different_perspective: string; questions_open: string[] };
export const MIN_REPLIES = 3;

/** Enough meaningful, non-duplicate replies to summarize without filler. */
export function synthesisReady(replies: { body: string }[]) {
 const meaningful = new Set(replies.map(r => r.body.trim().toLowerCase().replace(/\s+/g, ' ')).filter(b => b.length >= 20));
 return meaningful.size >= MIN_REPLIES;
}

const SYSTEM = `You summarize perspectives women shared on one anonymous question in TellHer.
Use ONLY the replies provided. Never add facts, advice, or ideas absent from them.
Preserve disagreement and uncertainty; do not pick a winner or deliver a verdict.
This is a small sample: never use percentages, "most", "majority", or language implying statistical certainty. Prefer "some", "a few", "one reply".
Never refer to or guess at who wrote a reply. Calm, plain language.
Fields: common_thread (1-2 sentences on what replies share), different_perspective (1-2 sentences on where they diverge; if they don't, say so plainly), questions_open (1-3 questions the replies leave unresolved).
If replies are too sparse, off-topic, or repetitive to summarize meaningfully, set enough=false and leave other fields empty.`;

const schema = { type: 'object', additionalProperties: false, required: ['enough', 'common_thread', 'different_perspective', 'questions_open'], properties: { enough: { type: 'boolean' }, common_thread: { type: 'string' }, different_perspective: { type: 'string' }, questions_open: { type: 'array', items: { type: 'string' } } } };

export const synthesizePerspectives = createServerFn({ method: 'POST' })
 .middleware([requireSupabaseAuth])
 .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
 .handler(async ({ data, context }): Promise<Synthesis> => {
  const key = process.env['LOVABLE_API_KEY']; if (!key) throw new Error('Synthesis is not configured.');
  const [q, r] = await Promise.all([context.supabase.rpc('tellher_question', { _id: data.id }), context.supabase.rpc('tellher_replies', { _id: data.id })]);
  const question = q.data?.[0]; if (q.error || r.error || !question) throw new Error('This question isn’t available.');
  const replies = (r.data ?? []).map(x => ({ tag: x.perspective_tag, body: x.body }));
  const none: Synthesis = { enough: false, common_thread: '', different_perspective: '', questions_open: [] };
  if (!synthesisReady(replies)) return none;
  const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
   method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Lovable-AIG-SDK': 'fetch' },
   body: JSON.stringify({ model: 'openai/gpt-6-astra', stream: true, store: false, reasoning: { effort: 'low' }, instructions: SYSTEM,
    input: [{ role: 'user', content: `Question (${question.category}): ${question.body}\n\nReplies (${replies.length}):\n${replies.map((x, i) => `${i + 1}. [${x.tag}] ${x.body}`).join('\n')}` }],
    text: { format: { type: 'json_schema', name: 'synthesis', strict: true, schema } } }),
  });
  if (!res.ok || !res.body) {
   console.error('synthesis gateway', res.status, (await res.text().catch(() => '')).slice(0, 300));
   throw new Error(res.status === 429 ? 'Busy right now. Please try again shortly.' : res.status === 402 ? 'Unavailable: AI credits have run out for this workspace.' : 'Couldn’t summarize right now.');
  }
  const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = ''; let text = '';
  for (;;) {
   const { done, value } = await reader.read(); if (done) break;
   buf += dec.decode(value, { stream: true }); let i: number;
   while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
    if (!line.startsWith('data:')) continue;
    try { const ev = JSON.parse(line.slice(5)); if (ev.type === 'response.output_text.delta') text += ev.delta; } catch { /* partial */ }
   }
  }
  if (!text) return none;
  const s = JSON.parse(text) as Synthesis;
  return s.enough ? { ...s, questions_open: s.questions_open.slice(0, 3) } : none;
 });
