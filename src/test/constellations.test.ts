import { describe, expect, it } from 'vitest';
import { buildSky, type SkyRow } from '@/lib/constellations';

const row = (id: string, category: string, extra: Partial<SkyRow> = {}): SkyRow => ({ id, category, excerpt: 'x', created_at: `2026-01-0${id.length}`, echo_level: 0, has_outcome: false, ...extra });
describe('Constellations layout', () => {
 const rows = [row('a', 'Work'), row('bb', 'Work'), row('c', 'Travel'), row('ddd', 'Housing & Moving'), row('e', 'Work')];
 it('groups Ripples into one cluster per topic, skipping empty topics', () => {
  const sky = buildSky(rows);
  expect(sky.map(c => [c.category, c.stars.length])).toEqual([['Work', 3], ['Housing & Moving', 1], ['Travel', 1]]);
 });
 it('places each star near its own topic and keeps positions stable', () => {
  const a = buildSky(rows); const b = buildSky([...rows].reverse());
  for (const c of a) for (const s of c.stars) { expect(Math.abs(s.x - c.x)).toBeLessThan(25); expect(Math.abs(s.y - c.y)).toBeLessThan(20); }
  expect(b.find(c => c.category === 'Travel')!.stars[0]).toMatchObject({ x: a.find(c => c.category === 'Travel')!.stars[0]!.x });
 });
 it('lays out 300 Ripples quickly', () => {
  const many = Array.from({ length: 300 }, (_, i) => row(`id-${i}`, ['Work', 'Travel', 'Services'][i % 3]!));
  const t = performance.now(); buildSky(many); expect(performance.now() - t).toBeLessThan(50);
 });
});
