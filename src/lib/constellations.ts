import { withRippleIdentities, type RippleIdentity } from '@/lib/ripple-identity';
import { categories } from '@/lib/askher';
import { supabase } from '@/integrations/supabase/client';

export type SkyRow = { id: string; category: string; excerpt: string; created_at: string; echo_level: number; has_outcome: boolean; reply_count?: number } & Partial<RippleIdentity>;

/** A comet is a brand-new anonymous star still waiting for its first perspective; it travels the sky until someone answers. */
export const isComet = (r: SkyRow) => r.reply_count === 0;
/** Deterministic comet path from its id, so each comet keeps its own orbit between visits. */
export function cometPath(id: string) {
 return { top: 8 + hash(id, 7) * 70, duration: 26 + hash(id, 8) * 22, delay: -hash(id, 9) * 40, drift: hash(id, 10) * 8 - 4 };
}
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
  const mine = rows.filter(r => r.category === category && !isComet(r)).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const stars = mine.map((r, k) => { const a = hash(r.id, 1) * Math.PI * 2 + k * 2.4; const d = 5 + (k % 4) * 3.2 + hash(r.id, 2) * 2; return { ...r, x: clamp(ax + Math.cos(a) * d * 1.3), y: clamp(ay + Math.sin(a) * d) }; });
  return { category, x: ax, y: ay, stars };
 }).filter(c => c.stars.length);
}
const clamp = (v: number) => Math.min(95, Math.max(5, v));
export const echoWords = ['', 'Others may relate', 'Echoed by others', 'Echoed by many women'];

export const skyQuery = { queryKey: ['constellation'], queryFn: async () => { const { data, error } = await supabase.rpc('tellher_constellation'); if (error) throw error; const rows = await withRippleIdentities((data ?? []) as SkyRow[]); return skyOnly(rows); } };
/** Sky holds anonymous Ripples only; open Ripples live in My Feed. */
export const skyOnly = <T,>(rows: T[]) => rows.filter(r => (r as { author_visibility?: string }).author_visibility !== 'named');

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

/** Counts below this stay hidden so small groups can't be singled out (mirrors ECHO_THRESHOLD). */
export const SKY_COUNT_THRESHOLD = 3;
export type TrendingTheme = { category: string; excerpt: string; recent: number | null; latest: string };
/** Themes with recent anonymous activity, newest activity first. Never ranked by size; small counts hidden. */
export function trendingThemes(rows: SkyRow[], now = Date.now(), days = 30, max = 5): TrendingTheme[] {
 const since = now - days * 86400000; const by = new Map<string, SkyRow[]>();
 for (const r of skyOnly(rows)) if (Date.parse(r.created_at) >= since) by.set(r.category, [...(by.get(r.category) ?? []), r]);
 return [...by.entries()].map(([category, rs]) => { const sorted = [...rs].sort((a, b) => b.created_at.localeCompare(a.created_at)); return { category, excerpt: sorted[0]!.excerpt, recent: rs.length >= SKY_COUNT_THRESHOLD ? rs.length : null, latest: sorted[0]!.created_at }; })
  .sort((a, b) => b.latest.localeCompare(a.latest)).slice(0, max);
}

export type StarMode = 'random' | 'trending' | 'new' | 'forgotten';
export const starModes: { value: StarMode; label: string; hint: string }[] = [
 { value: 'random', label: 'Wandering', hint: 'A random handful of stars' },
 { value: 'trending', label: 'Trending stars', hint: 'From the topics most active this month' },
 { value: 'new', label: 'New stars', hint: 'Written recently, with few or no perspectives yet' },
 { value: 'forgotten', label: 'Forgotten stars', hint: 'Written long ago, still waiting for perspectives' },
];
/** "Few perspectives" for New and Forgotten stars. */
export const FEW_PERSPECTIVES = 2;
const DAY = 86400000;
type Filterable = { id: string; category: string; created_at: string; replies: number };
/** Picks which stars to show under the sky. Random uses a per-visit seed so the order stays put while browsing. */
export function filterStars<T extends Filterable>(rows: T[], mode: StarMode, now = Date.now(), seed = 1): T[] {
 const age = (r: T) => now - Date.parse(r.created_at);
 if (mode === 'new') return rows.filter(r => age(r) <= 14 * DAY && r.replies <= FEW_PERSPECTIVES).sort((a, b) => b.created_at.localeCompare(a.created_at));
 if (mode === 'forgotten') return rows.filter(r => age(r) > 30 * DAY && r.replies <= FEW_PERSPECTIVES).sort((a, b) => a.created_at.localeCompare(b.created_at));
 if (mode === 'trending') {
  const recent = rows.filter(r => age(r) <= 30 * DAY); const by = new Map<string, number>();
  for (const r of recent) by.set(r.category, (by.get(r.category) ?? 0) + 1 + r.replies);
  const top = [...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);
  return recent.filter(r => top.includes(r.category)).sort((a, b) => top.indexOf(a.category) - top.indexOf(b.category) || b.replies - a.replies);
 }
 return [...rows].sort((a, b) => hash(a.id, seed) - hash(b.id, seed));
}
