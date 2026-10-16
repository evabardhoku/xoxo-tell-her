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
- Never encourage retaliation or escalating confrontation, never tell her to ignore danger, and never claim to replace professional, legal, medical or emergency help.
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

/** Streams one Responses call and returns the final text. Shared by the first reflection and follow-up turns. */
async function streamResponse(body: Record<string, unknown>, apiKey: string): Promise<string> {
 const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'X-Lovable-AIG-SDK': 'fetch' },
  body: JSON.stringify({ model: 'openai/gpt-6-astra', stream: true, store: false, reasoning: { effort: 'low' }, ...body }),
 });
 if (!res.ok || !res.body) {
  const t = await res.text().catch(() => '');
  console.error('wingwoman gateway', res.status, t.slice(0, 500));
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
 return text;
}

async function reflect(context: string, situation: string, apiKey: string): Promise<Reflection> {
 const text = await streamResponse({
  instructions: SYSTEM,
  input: [{ role: 'user', content: `Context: ${context}\n\nWhat happened (her words):\n${situation}` }],
  text: { format: { type: 'json_schema', name: 'reflection', strict: true, schema } },
 }, apiKey);
 const r = JSON.parse(text) as Reflection;
 return { what_stands_out: r.what_stands_out.slice(0, 4), questions: r.questions.slice(0, 3), next_step: r.next_step, safety_note: r.safety_note || null };
}

/** Plain-text rendering of a stored one-shot reflection, used as conversation context. */
export function reflectionText(r: Reflection) {
 return [r.safety_note, `What stands out:\n- ${r.what_stands_out.join('\n- ')}`, `Questions worth asking yourself:\n- ${r.questions.join('\n- ')}`, `A reasonable next step: ${r.next_step}`].filter(Boolean).join('\n\n');
}

const CHAT = `${SYSTEM.split('Output:')[0]}
This is a continuing private conversation. Voice: a thoughtful girls' girl — warm, observant, conversational, supportive, and direct when useful. Never blindly validating: gently separate what she knows from what she is assuming, and say so when something would make you pause too.
Respond naturally to what she just said, in a few short paragraphs at most. Do not use headings or the earlier three-section format unless she asks for structure. Ask at most one question back.
Avoid caricature: no "bestie", "queen", "girl!" or forced slang. Plain text only, no markdown headings.
If she describes an immediate, explicit threat or emergency, calmly encourage her to prioritize immediate safety and contact local emergency services or a local support line, and say plainly that TellHer cannot respond to emergencies.`;

export const HISTORY_TURNS = 20;
const msgInput = z.object({ sessionId: z.string().uuid(), content: z.string().trim().min(1).max(4000) });

export const sendWingwomanMessage = createServerFn({ method: 'POST' })
 .middleware([requireSupabaseAuth])
 .inputValidator((d: unknown) => msgInput.parse(d))
 .handler(async ({ data, context }) => {
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) throw new Error('Wingwoman is not configured.');
  // RLS scopes both reads to the caller; another member's session id returns nothing.
  const { data: s } = await context.supabase.from('wingwoman_sessions').select('id, context, situation, instinct, reflection').eq('id', data.sessionId).maybeSingle();
  if (!s) throw new Error('This conversation could not be found.');
  const { data: past, error: pe } = await context.supabase.from('wingwoman_messages').select('role, content').eq('session_id', s.id).order('created_at', { ascending: false }).limit(HISTORY_TURNS);
  if (pe) { console.error(pe); throw new Error('Your conversation could not be loaded.'); }
  const { error: ue } = await context.supabase.from('wingwoman_messages').insert({ session_id: s.id, owner_id: context.userId, role: 'user', content: data.content });
  if (ue) { console.error(ue); throw new Error('Your message could not be saved.'); }
  const input = [
   { role: 'user', content: `Context: ${s.context ?? 'Other'}\n\nWhat happened (her words):\n${s.situation ?? ''}` },
   ...(s.reflection ? [{ role: 'assistant', content: reflectionText(s.reflection as Reflection) }] : []),
   ...(past ?? []).reverse().map(m => ({ role: m.role, content: m.content })),
   { role: 'user', content: data.content },
  ];
  const reply = (await streamResponse({ instructions: CHAT, input }, key)).trim().slice(0, 6000);
  const { data: row, error } = await context.supabase.from('wingwoman_messages').insert({ session_id: s.id, owner_id: context.userId, role: 'assistant', content: reply }).select('id, role, content, created_at').single();
  if (error) { console.error(error); throw new Error('Wingwoman’s reply could not be saved.'); }
  await context.supabase.from('wingwoman_sessions').update({ updated_at: new Date().toISOString() }).eq('id', s.id);
  return row;
 });

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

const DRAFT = `You help a TellHer member turn her private Wingwoman conversation into a short anonymous Trust Ripple question for women she trusts.
Write ONE question draft in her first-person voice, 1-4 sentences, under 600 characters, plain text.
- Include only the situation details needed for others to offer a perspective, using the most current understanding from the whole conversation.
- Remove names, workplaces, addresses, contact details and anything identifying. Never quote Wingwoman.
- Never invent facts. Do not include her private instinct or feelings unless she stated them as part of what she wants to ask.
- End with a clear question she could ask other women.`;

export const proposeRippleDraft = createServerFn({ method: 'POST' })
 .middleware([requireSupabaseAuth])
 .inputValidator((d: unknown) => z.object({ sessionId: z.string().uuid() }).parse(d))
 .handler(async ({ data, context }) => {
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) throw new Error('Wingwoman is not configured.');
  const { data: s } = await context.supabase.from('wingwoman_sessions').select('id, context, situation').eq('id', data.sessionId).maybeSingle();
  if (!s) throw new Error('This conversation could not be found.');
  const { data: msgs, error } = await context.supabase.from('wingwoman_messages').select('role, content').eq('session_id', s.id).order('created_at', { ascending: false }).limit(HISTORY_TURNS);
  if (error) throw new Error('Your conversation could not be loaded.');
  const transcript = [`Her opening (${s.context ?? 'Other'}): ${s.situation ?? ''}`, ...(msgs ?? []).reverse().map(m => `${m.role === 'user' ? 'Her' : 'Wingwoman'}: ${m.content}`)].join('\n\n');
  const draft = (await streamResponse({ instructions: DRAFT, input: [{ role: 'user', content: transcript }] }, key)).trim().slice(0, 2000);
  // Returned only to the owner as an editable suggestion; never stored.
  return { draft };
 });

/** Wingwoman context -> Ripple topic, so suggestion chips can point at related constellations and letters. */
const contextTopic: Record<string, string> = {
 Dating: 'Dating & Boundaries', Work: 'Work', Friendship: 'Everyday Life', Family: 'Everyday Life', Other: 'Everyday Life',
};

/** Related Constellations and Letters for a session's topic, so empty suggestions are never shown. Owner-scoped by RLS. */
export const wingwomanRelated = createServerFn({ method: 'GET' })
 .middleware([requireSupabaseAuth])
 .inputValidator((d: unknown) => z.object({ sessionId: z.string().uuid() }).parse(d))
 .handler(async ({ data, context }) => {
  const { data: s } = await context.supabase.from('wingwoman_sessions').select('id, context').eq('id', data.sessionId).maybeSingle();
  if (!s) throw new Error('This conversation could not be found.');
  const topic = contextTopic[s.context ?? 'Other'] ?? 'Everyday Life';
  const { data: sky, error } = await context.supabase.rpc('tellher_constellation');
  if (error) { console.error(error); throw new Error('Related stories could not be loaded.'); }
  const stars = (sky ?? []).filter((r: { category: string }) => r.category === topic);
  const withLetters = stars.find((r: { has_letters?: boolean }) => r.has_letters);
  return { topic, constellations: stars.length, lettersRippleId: (withLetters as { id?: string } | undefined)?.id ?? null };
 });
