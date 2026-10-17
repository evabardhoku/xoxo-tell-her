import { describe, expect, it } from 'vitest';
import { guideStorageKey, rememberGuideVisit, shouldAutoOpenGuide } from '@/lib/user-guide';

describe('first-visit guide', () => {
 it('automatically opens on the first visit, but not again after a visit is remembered', () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  expect(shouldAutoOpenGuide(storage, 'eva')).toBe(true);
  rememberGuideVisit(storage, 'eva');
  expect(shouldAutoOpenGuide(storage, 'eva')).toBe(false);
 });
 it('keeps the first visit separate for each account', () => {
  const storage = { getItem: (key: string) => key === guideStorageKey('eva') ? 'seen' : null };
  expect(shouldAutoOpenGuide(storage, 'eva')).toBe(false);
  expect(shouldAutoOpenGuide(storage, 'another-member')).toBe(true);
 });
 it('does not interrupt entry or throw when browser storage is blocked', () => {
  const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  expect(shouldAutoOpenGuide(blocked, 'eva')).toBe(false);
  expect(() => rememberGuideVisit(blocked, 'eva')).not.toThrow();
 });
});