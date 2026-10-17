import { supabase } from '@/integrations/supabase/client';
import type { FeedQuestion } from '@/lib/askher';

export type Relation = 'mine' | 'circle' | 'extended' | 'community';
export type OpenContext = { question_id: string; relation: Relation; via_name: string | null };
export type OpenComment = { id: string; body: string; created_at: string; is_mine: boolean; first_name: string | null; profile_id: string | null; has_avatar: boolean; likes: number; liked: boolean };
export type FeedFilterMode = 'for-you' | 'circle' | 'community';

/** Only open (named) Ripples belong in My Feed; anonymous ones live in Sky. */
export const openOnly = <T extends Partial<{ author_visibility: string }>>(rows: T[]) => rows.filter(r => r.author_visibility === 'named');

export const openContextQuery = (ids: string[]) => ({
 queryKey: ['open-feed-context', ids],
 enabled: ids.length > 0,
 queryFn: async () => { const { data, error } = await supabase.rpc('tellher_open_feed_context', { _ids: ids }); if (error) throw error; return Object.fromEntries((data ?? []).map(r => [r.question_id, r as OpenContext])) as Record<string, OpenContext>; },
});
export const openCommentsQuery = (id: string) => ({
 queryKey: ['open-comments', id],
 queryFn: async () => { const { data, error } = await supabase.rpc('tellher_open_comments', { _id: id }); if (error) throw error; return (data ?? []) as OpenComment[]; },
});

/** Named discussions are Ripples; the grade says how far they travelled — first grade (Direct Circle), second grade (Extended), open (whole community). */
export const relationLabel = (c?: OpenContext) => !c ? 'Open ripple' : c.relation === 'mine' ? 'Your ripple' : c.relation === 'circle' ? 'First grade ripple' : c.relation === 'extended' ? (c.via_name ? `Second grade ripple via ${c.via_name}` : 'Second grade ripple') : 'Open ripple';
const proximity: Record<Relation, number> = { mine: 0, circle: 0, extended: 1, community: 2 };

/** For You: trust proximity first, then topics she has asked about, then recency. Likes never rank. */
export function rankFeed(list: FeedQuestion[], ctx: Record<string, OpenContext>, mode: FeedFilterMode, myTopics: Set<string>) {
 const rel = (q: FeedQuestion) => ctx[q.id]?.relation ?? 'community';
 const filtered = mode === 'circle' ? list.filter(q => ['circle', 'mine'].includes(rel(q))) : mode === 'community' ? list.filter(q => rel(q) === 'community') : list;
 return [...filtered].sort((a, b) => mode === 'for-you' ? (proximity[rel(a)] - proximity[rel(b)]) || (Number(myTopics.has(b.category)) - Number(myTopics.has(a.category))) || b.created_at.localeCompare(a.created_at) : b.created_at.localeCompare(a.created_at));
}
