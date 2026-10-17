import { withRippleIdentities, type RippleIdentity } from '@/lib/ripple-identity';
import { supabase } from '@/integrations/supabase/client';

export const perspectives = [
 { value: 'address', label: 'I’d address it' },
 { value: 'watch_wait', label: 'I’d watch and wait' },
 { value: 'more_context', label: 'I’d want more context' },
 { value: 'been_there', label: 'I’ve been in something similar' },
] as const;
export type Perspective = (typeof perspectives)[number]['value'];
export const perspectiveLabel = (v: string | null) => perspectives.find(p => p.value === v)?.label ?? 'Perspective';

export type Counts = Record<Perspective, number>;
export const emptyCounts = (): Counts => ({ address: 0, watch_wait: 0, more_context: 0, been_there: 0 });

/** Tallies persisted replies per tag. Order is fixed — never sorted by size, so no answer reads as "winning". */
export function tally(rows: { perspective_tag: string | null; n?: number }[]): Counts {
 const c = emptyCounts();
 for (const r of rows) if (r.perspective_tag && r.perspective_tag in c) c[r.perspective_tag as Perspective] += r.n ?? 1;
 return c;
}

export type QuestionDetail = { id: string; category: string; body: string; audience_scope: string; created_at: string; is_mine: boolean; my_instinct: string | null; my_note: string | null; my_reply_id: string | null } & Partial<RippleIdentity>;
export type Reply = { id: string; perspective_tag: string; body: string; created_at: string; is_mine: boolean };

export const questionQuery = (id: string) => ({
 queryKey: ['askher-question', id],
 queryFn: async () => {
  const q = await supabase.rpc('tellher_question', { _id: id });
  if (q.error) throw q.error;
  const question = (q.data?.[0] ?? null) as QuestionDetail | null;
  if (!question) return { question: null, replies: [] as Reply[] };
  const identified = await withRippleIdentities([question]);
  const resolved = identified[0] ?? question;
  if (resolved.author_visibility === 'named') return { question: resolved, replies: [] as Reply[] };
  const r = await supabase.rpc('tellher_replies', { _id: id });
  if (r.error) throw r.error;
  return { question: resolved, replies: (r.data ?? []) as Reply[] };
 },
});

export const feedMapQuery = {
 queryKey: ['askher-feed-map'],
 queryFn: async () => {
  const { data, error } = await supabase.rpc('tellher_feed_map'); if (error) throw error;
  const m: Record<string, Counts> = {};
  for (const row of data ?? []) { (m[row.question_id] ??= emptyCounts())[row.perspective_tag as Perspective] += row.n; }
  return m;
 },
};
