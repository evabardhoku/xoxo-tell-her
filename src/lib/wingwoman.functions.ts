import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const wingwomanContexts = ['Dating', 'Work', 'Friendship', 'Family', 'Other'] as const;
export type Reflection = { what_stands_out: string[]; questions: string[]; next_step: string; safety_note: string | null };

const input = z.object({
 context: z.enum(wingwomanContexts),
 situation: z.string().trim().min(10).max(4000),
 instinct: z.enum(['feels_okay', 'unsure', 'feels_off']).nullable(),
});

const SYSTEM = `You are Wingwoman, a private reflection companion inside TellHer, a women-centered community.
You are NOT a therapist, danger detector, relationship judge, legal advisor, medical advisor, or emergency service.
Tone: calm, respectful, supportive, non-alarmist. Write in the second person, plain language, short sentences.
Rules:
- Ground every observation only in what the user wrote. Never invent facts, names, motives, or details.
- Never diagnose or label another person (no "narcissist", "manipulative", "abusive", etc.).
- Never say or imply a situation is safe or unsafe, or guarantee any outcome.
- No legal or medical claims. Do not present speculation as certainty; use tentative language.
- Do not repeat the user's private instinct back as a verdict.
Output:
- what_stands_out: 2-4 neutral observations drawn from the description.
- questions: 2-3 reflective questions she might ask herself.
- next_step: one practical, non-prescriptive suggestion ("You might consider...").
- safety_note: null, UNLESS she describes an immediate, explicit threat or emergency. Then write 1-2 calm sentences encouraging her to prioritize her immediate safety and contact local emergency services or a local support line, and say plainly that TellHer cannot respond to emergencies.`;

const schema = {
 type: 'object', additionalProperties: false,
 required: ['what_stands_out', 'questions', 'next_step', 'safety_note'],
 properties: {
  what_stands_out: { type: 'array', items: { type: 'string' } },
  questions: { type: 'array', items: { type: 'string' } },
  next_step: { type: 'string' },
  safety_note: { type: ['string', 'null'] },
 },
};

async function reflect(context: string, situation: string, apiKey: string): Promise<Reflection> {
 const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'X-Lovable-AIG-SDK': 'fetch' },
  body: JSON.stringify({
   model: 'openai/gpt-6-astra', stream: true, store: false,
   reasoning: { effort: 'low' },
   instructions: SYSTEM,
   input: [{ role: 'user', content: `Context: ${context}\n\nWhat happened (her words):\n${situation}` }],
   text: { format: { type: 'json_schema', name: 'reflection', strict: true, schema } },
  }),
 });
 if (!res.ok || !res.body) {
  const body = await res.text().catch(() => '');
  console.error('wingwoman gateway', res.status, body.slice(0, 500));
  if (res.status === 429) throw new Error('Wingwoman is busy right now. Please try again in a moment.');
  if (res.status === 402) throw new Error('Wingwoman is unavailable: AI credits have run out for this workspace.');
  throw new Error('Wingwoman could not reflect right now. Please try again later.');
 }
 const reader = res.body.getReader(); const dec = new TextDecoder();
 let buf = ''; let text = ''; let refused = false;
 for (;;) {
  const { done, value } = await reader.read(); if (done) break;
  buf += dec.decode(value, { stream: true });
  let i: number;
  while ((i = buf.indexOf('\n')) >= 0) {
   const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
   if (!line.startsWith('data:')) continue;
   const d = line.slice(5).trim(); if (!d || d === '[DONE]') continue;
   try {
    const ev = JSON.parse(d);
    if (ev.type === 'response.output_text.delta') text += ev.delta;
    else if (ev.type === 'response.refusal.delta') refused = true;
    else if (ev.type === 'error' || ev.type === 'response.failed') throw new Error('stream');
   } catch (e) { if ((e as Error).message === 'stream') throw new Error('Wingwoman could not reflect right now.'); }
  }
 }
 if (refused || !text) throw new Error('Wingwoman can’t reflect on this one. If you’re in danger, please contact local emergency services.');
 const r = JSON.parse(text) as Reflection;
 return { what_stands_out: r.what_stands_out.slice(0, 4), questions: r.questions.slice(0, 3), next_step: r.next_step, safety_note: r.safety_note || null };
}

export const createReflection = createServerFn({ method: 'POST' })
 .middleware([requireSupabaseAuth])
 .inputValidator((d: unknown) => input.parse(d))
 .handler(async ({ data, context }) => {
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) throw new Error('Wingwoman is not configured.');
  const reflection = await reflect(data.context, data.situation, key);
  const { data: row, error } = await context.supabase.from('wingwoman_sessions').insert({
   owner_id: context.userId, title: data.situation.slice(0, 80), context: data.context,
   situation: data.situation, instinct: data.instinct, reflection,
  }).select('id').single();
  if (error) { console.error(error); throw new Error('Your reflection could not be saved.'); }
  return { id: row.id, reflection };
 });
