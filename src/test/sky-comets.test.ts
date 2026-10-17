import { describe, expect, it } from 'vitest';
import { buildSky, cometPath, isComet, type SkyRow } from '@/lib/constellations';
import { relationLabel } from '@/lib/open-feed';

const row = (id: string, extra: Partial<SkyRow> = {}): SkyRow => ({ id, category: 'Work', excerpt: 'x', created_at: '2026-01-01', echo_level: 0, has_outcome: false, ...extra });

describe('Comets', () => {
 it('a star with zero perspectives is a comet; answered stars are not', () => {
  expect(isComet(row('a', { reply_count: 0 }))).toBe(true);
  expect(isComet(row('b', { reply_count: 2 }))).toBe(false);
  expect(isComet(row('c'))).toBe(false); // historical rows without the count stay in constellations
 });
 it('comets never appear inside constellations', () => {
  const sky = buildSky([row('new', { reply_count: 0 }), row('old', { reply_count: 1 })]);
  expect(sky[0]!.stars.map(s => s.id)).toEqual(['old']);
 });
 it('each comet keeps a stable path between visits', () => {
  expect(cometPath('same-id')).toEqual(cometPath('same-id'));
  const p = cometPath('same-id');
  expect(p.top).toBeGreaterThanOrEqual(8); expect(p.top).toBeLessThanOrEqual(78);
  expect(p.duration).toBeGreaterThanOrEqual(26); expect(p.delay).toBeLessThanOrEqual(0);
 });
});

describe('Ripple grades', () => {
 it('names named discussions by how far they travelled', () => {
  expect(relationLabel({ question_id: 'q', relation: 'circle', via_name: null })).toBe('First grade ripple');
  expect(relationLabel({ question_id: 'q', relation: 'extended', via_name: null })).toBe('Second grade ripple');
  expect(relationLabel({ question_id: 'q', relation: 'extended', via_name: 'Ada' })).toBe('Second grade ripple via Ada');
  expect(relationLabel({ question_id: 'q', relation: 'community', via_name: null })).toBe('Open ripple');
  expect(relationLabel({ question_id: 'q', relation: 'mine', via_name: null })).toBe('Your ripple');
  expect(relationLabel(undefined)).toBe('Open ripple');
 });
});
