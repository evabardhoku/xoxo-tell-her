import { describe, expect, it } from 'vitest';
import { trendingThemes, type SkyRow } from '@/lib/constellations';
const now = Date.parse('2026-10-16T12:00:00Z');
const row = (id: string, category: string, days: number, vis = 'anonymous'): SkyRow => ({ id, category, excerpt: `ex ${id}`, created_at: new Date(now - days * 86400000).toISOString(), echo_level: 0, has_outcome: false, author_visibility: vis as 'anonymous' });
describe('Trending in the Sky', () => {
 it('hides counts below 3 and shows them at 3', () => {
  const t = trendingThemes([row('a', 'Work', 1), row('b', 'Work', 2), row('c', 'Travel', 1), row('d', 'Travel', 2), row('e', 'Travel', 3)], now);
  expect(t.find(x => x.category === 'Work')?.recent).toBeNull();
  expect(t.find(x => x.category === 'Travel')?.recent).toBe(3);
 });
 it('never counts open Ripples or old ones', () => {
  const t = trendingThemes([row('a', 'Work', 1, 'named'), row('b', 'Housing & Moving', 60)], now);
  expect(t).toEqual([]);
 });
 it('orders by newest activity, not size', () => {
  const t = trendingThemes([row('a', 'Work', 0), row('b', 'Travel', 1), row('c', 'Travel', 2), row('d', 'Travel', 3)], now);
  expect(t.map(x => x.category)).toEqual(['Work', 'Travel']);
 });
});
