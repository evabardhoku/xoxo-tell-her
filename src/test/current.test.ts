import { describe, expect, it } from 'vitest';
import { applyFilter, availableFilters, questionProvenance, rankCurrent, type CurrentItem } from '@/lib/current';
const it_ = (key: string, tier: 0 | 1 | 2, at: string, kind: CurrentItem['kind'] = 'note', topic: string | null = null) => ({ key, tier, at, kind, topic, provenance: '' }) as unknown as CurrentItem;
describe('The Current', () => {
 it('orders Direct before Extended before Community regardless of freshness', () => {
  const r = rankCurrent([it_('c', 2, '2026-10-16'), it_('e', 1, '2026-10-15'), it_('d', 0, '2026-01-01')], new Set());
  expect(r.map(i => i.key)).toEqual(['d', 'e', 'c']);
 });
 it('prefers topic match over freshness within a tier', () => {
  const r = rankCurrent([it_('new', 0, '2026-10-16', 'note', 'Work'), it_('topic', 0, '2026-01-01', 'note', 'Travel')], new Set(['Travel']));
  expect(r[0]!.key).toBe('topic');
 });
 it('never names an anonymous Ripple author', () => {
  expect(questionProvenance({ is_mine: false, audience_scope: 'extended' })).toBe('Anonymous Ripple · Extended reach');
 });
 it('only offers filters with content', () => {
  const items = [it_('q', 2, '2026-10-16', 'question')];
  expect(availableFilters(items).map(f => f.value)).toEqual(['all', 'question']);
  expect(applyFilter(items, 'note')).toEqual([]);
 });
});
