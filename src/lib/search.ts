import { withRippleIdentities, type RippleIdentity } from '@/lib/ripple-identity';
import { supabase } from '@/integrations/supabase/client';
import { categories } from '@/lib/askher';
import { noteTopics } from '@/components/trust-shelf';

export type SearchRow = { kind: 'person' | 'note' | 'pick' | 'question'; id: string; title: string | null; body: string | null; category: string | null; location: string | null; created_at: string | null; member_id: string | null; member_name: string | null; relation: string | null; known_for: string[] | null; has_avatar: boolean | null; reply_count: number | null; audience_scope: string | null; rank: number } & Partial<RippleIdentity>;

export const searchQuery = (q: string) => ({
 queryKey: ['search', q],
 enabled: q.trim().length >= 2,
 queryFn: async () => { const { data, error } = await supabase.rpc('tellher_search', { _q: q }); if (error) throw error; const rows = (data ?? []) as SearchRow[]; const qs = await withRippleIdentities(rows.filter(r => r.kind === 'question')); const byId = new Map(qs.map(r => [r.id, r])); return rows.map(r => r.kind === 'question' ? byId.get(r.id) ?? r : r); },
});

/** Topics are the fixed product vocabulary (AskHer categories + Trust Note topics), never user content. */
export const allTopics = Array.from(new Set<string>([...categories, ...noteTopics]));
export const matchTopics = (q: string) => { const s = q.trim().toLowerCase(); return s.length < 2 ? [] : allTopics.filter(t => t.toLowerCase().includes(s)); };
export const relationLabel = (r: string | null) => r === 'direct' ? 'Direct Circle' : r === 'extended' ? 'Extended Circle' : r === 'self' ? 'You' : 'All TellHer women';
