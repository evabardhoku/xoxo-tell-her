import { supabase } from '@/integrations/supabase/client';
export type AuthorVisibility = 'anonymous' | 'named';
export type RippleIdentity = { author_visibility: AuthorVisibility; first_name: string | null; profile_id: string | null; has_avatar: boolean; anonymous_avatar?: unknown };
/** Composition of checked sources, never a browser ownership lookup. */
export async function withRippleIdentities<T extends { id: string }>(rows: T[]): Promise<(T & RippleIdentity)[]> {
 if (!rows.length) return [];
 const { data, error } = await supabase.rpc('tellher_ripple_identities', { _ids: rows.map(r => r.id) });
 if (error) throw error;
 const identities = new Map((data ?? []).map(r => [r.question_id, r]));
 // Per-Ripple anonymous visuals (decorative masks, no member link) for anonymous rows only.
 const anonIds = rows.filter(r => identities.get(r.id)?.author_visibility !== 'named').map(r => r.id);
 const masks = new Map<string, unknown>();
 if (anonIds.length) { const m = await supabase.rpc('tellher_anonymous_avatars', { _ids: anonIds }); if (!m.error) for (const x of m.data ?? []) masks.set(x.question_id, x.avatar); }
 return rows.map(r => { const a = identities.get(r.id); return { ...r, anonymous_avatar: masks.get(r.id) ?? null, author_visibility: a?.author_visibility === 'named' ? 'named' : 'anonymous', first_name: a?.first_name ?? null, profile_id: a?.profile_id ?? null, has_avatar: a?.has_avatar ?? false }; });
}
