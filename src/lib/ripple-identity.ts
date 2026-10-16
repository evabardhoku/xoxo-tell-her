import { supabase } from '@/integrations/supabase/client';
export type AuthorVisibility = 'anonymous' | 'named';
export type RippleIdentity = { author_visibility: AuthorVisibility; first_name: string | null; profile_id: string | null; has_avatar: boolean };
/** Composition of checked sources, never a browser ownership lookup. */
export async function withRippleIdentities<T extends { id: string }>(rows: T[]): Promise<(T & RippleIdentity)[]> {
 if (!rows.length) return [];
 const { data, error } = await supabase.rpc('tellher_ripple_identities', { _ids: rows.map(r => r.id) });
 if (error) throw error;
 const identities = new Map((data ?? []).map(r => [r.question_id, r]));
 return rows.map(r => { const a = identities.get(r.id); return { ...r, author_visibility: a?.author_visibility === 'named' ? 'named' : 'anonymous', first_name: a?.first_name ?? null, profile_id: a?.profile_id ?? null, has_avatar: a?.has_avatar ?? false }; });
}
