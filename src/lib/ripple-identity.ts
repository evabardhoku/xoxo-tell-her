import { supabase } from '@/integrations/supabase/client';
import { randomAnonymous } from '@/lib/avatar';
export type AuthorVisibility = 'anonymous' | 'named';
/** Match the public identity choice, including historical anonymous Ripples. */
export const rippleDestination = (visibility?: AuthorVisibility) => visibility === 'named' ? '/feed' as const : '/home' as const;
export type RippleIdentity = { author_visibility: AuthorVisibility; first_name: string | null; profile_id: string | null; has_avatar: boolean; anonymous_avatar?: unknown };
/** Composition of checked sources, never a browser ownership lookup. */
export async function withRippleIdentities<T extends { id: string }>(rows: T[]): Promise<(T & RippleIdentity)[]> {
 if (!rows.length) return [];
 const { data, error } = await supabase.rpc('tellher_ripple_identities', { _ids: rows.map(r => r.id) });
 if (error) throw error;
 const identities = new Map((data ?? []).map(r => [r.question_id, r]));
 // Fresh decorative masks, unrelated to member preferences.
 return rows.map(r => { const a = identities.get(r.id); return { ...r, anonymous_avatar: a?.author_visibility === 'named' ? null : randomAnonymous(), author_visibility: a?.author_visibility === 'named' ? 'named' : 'anonymous', first_name: a?.first_name ?? null, profile_id: a?.profile_id ?? null, has_avatar: a?.has_avatar ?? false }; });
}
