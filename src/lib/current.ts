/**
 * The Current: a composed, read-only view over existing visibility-checked sources.
 * Nothing here grants access — every item comes from the same function its source page uses.
 * Ordering is by trust distance, then topic, then freshness. Never by popularity or reply counts.
 */
import type { FeedQuestion } from '@/lib/askher';

export type Tier = 0 | 1 | 2; // 0 Direct Circle / yours, 1 Extended, 2 Community
export type CurrentKind = 'request' | 'question' | 'note' | 'pick' | 'person';
type Base = { key: string; tier: Tier; topic: string | null; at: string; provenance: string };
export type CurrentItem =
 | (Base & { kind: 'request'; connection_id: string; member_id: string; name: string })
 | (Base & { kind: 'question'; q: FeedQuestion })
 | (Base & { kind: 'note'; id: string; title: string; body: string; location: string | null; member_id: string })
 | (Base & { kind: 'pick'; p: { id: string; title: string; category: string; note: string; location: string | null } })
 | (Base & { kind: 'person'; member_id: string; name: string; location: string | null; known_for: string[]; has_avatar: boolean; bridge_pending: boolean });

export function questionProvenance(q: Pick<FeedQuestion, 'is_mine' | 'audience_scope'>) {
 if (q.is_mine) return 'Your Ripple';
 return q.audience_scope === 'circle' ? 'Anonymous Ripple · Direct reach' : q.audience_scope === 'extended' ? 'Anonymous Ripple · Extended reach' : 'Anonymous Ripple · TellHer community';
}
export const questionTier = (s: string): Tier => (s === 'circle' ? 0 : s === 'extended' ? 1 : 2);

/** Requests first (they need her), then trust distance, then topic match, then newest. */
export function rankCurrent(items: CurrentItem[], topics: Set<string>) {
 const score = (i: CurrentItem) => (i.kind === 'request' ? -1 : i.tier);
 return [...items].sort((a, b) => score(a) - score(b)
  || Number(Boolean(b.topic && topics.has(b.topic))) - Number(Boolean(a.topic && topics.has(a.topic)))
  || Date.parse(b.at) - Date.parse(a.at));
}

export const currentFilters = [
 { value: 'all', label: 'For You' },
 { value: 'direct', label: 'Direct Circle' },
 { value: 'extended', label: 'Extended Circle' },
 { value: 'question', label: 'Questions' },
 { value: 'note', label: 'Trust Notes' },
 { value: 'pick', label: 'Trusted Picks' },
] as const;
export type CurrentFilter = (typeof currentFilters)[number]['value'];
export function applyFilter(items: CurrentItem[], f: CurrentFilter) {
 if (f === 'all') return items;
 if (f === 'direct') return items.filter(i => i.tier === 0 && i.kind !== 'question');
 if (f === 'extended') return items.filter(i => i.tier === 1 && i.kind !== 'question');
 return items.filter(i => i.kind === f);
}
/** Only offer filters that would show something. */
export const availableFilters = (items: CurrentItem[]) => currentFilters.filter(f => f.value === 'all' || applyFilter(items, f.value).length > 0);
