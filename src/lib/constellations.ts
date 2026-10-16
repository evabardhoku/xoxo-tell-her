import { withRippleIdentities, type RippleIdentity } from '@/lib/ripple-identity';
import { categories } from '@/lib/askher';
import { supabase } from '@/integrations/supabase/client';

export type SkyRow = { id: string; category: string; excerpt: string; created_at: string; echo_level: number; has_outcome: boolean; has_letters?: boolean } & Partial<RippleIdentity>;
export type Star = SkyRow & { x: number; y: number };
export type Cluster = { category: string; x: number; y: number; stars: Star[] };

/** Fixed anchor per topic (percent of the sky) so each constellation keeps its place between visits. */
const anchors: [number, number][] = [[20, 26], [52, 18], [82, 30], [24, 70], [56, 62], [82, 76]];

/** Deterministic 0..1 from a string, so a Ripple's star never jumps around. */
function hash(s: string, salt: number) { let h = 2166136261 ^ salt; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return ((h >>> 0) % 10000) / 10000; }

/** Group visible Ripples into one small constellation per topic, stars spiralling gently around the anchor. */
export function buildSky(rows: SkyRow[]): Cluster[] {
 const order = [...categories as readonly string[], ...new Set(rows.map(r => r.category).filter(c => !(categories as readonly string[]).includes(c)))];
 return order.map((category, i) => {
  const [ax, ay] = anchors[i % anchors.length]!;
  const mine = rows.filter(r => r.category === category).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const stars = mine.map((r, k) => { const a = hash(r.id, 1) * Math.PI * 2 + k * 2.4; const d = 5 + (k % 4) * 3.2 + hash(r.id, 2) * 2; return { ...r, x: clamp(ax + Math.cos(a) * d * 1.3), y: clamp(ay + Math.sin(a) * d) }; });
  return { category, x: ax, y: ay, stars };
 }).filter(c => c.stars.length);
}
const clamp = (v: number) => Math.min(95, Math.max(5, v));
export const echoWords = ['', 'Others may relate', 'Echoed by others', 'Echoed by many women'];

export const skyQuery = { queryKey: ['constellation'], queryFn: async () => { const { data, error } = await supabase.rpc('tellher_constellation'); if (error) throw error; const rows = await withRippleIdentities((data ?? []) as SkyRow[]); return rows.filter(r => (r as { author_visibility?: string }).author_visibility !== 'named'); } }; // Sky holds anonymous Ripples only

/** A short human title for each constellation, so a topic reads like a situation rather than a filter. */
const titles: Record<string, string> = {
 'Work': 'Holding your ground at work',
 'Dating & Boundaries': 'When something feels off with someone new',
 'Housing & Moving': 'Finding a place that feels like yours',
 'Travel': 'Travelling on your own terms',
 'Services': 'Knowing who to trust with the work',
 'Everyday Life': 'The small things that weigh on you',
};
export const placeTitle = (category: string) => titles[category] ?? category;
