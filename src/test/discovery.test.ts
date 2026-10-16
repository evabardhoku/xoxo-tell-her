import { describe, it, expect } from 'vitest';
import { discoveryItems, isNewAccount, isNewcomer } from '@/lib/discovery';
const zero = { wingwoman: 0, ripples: 0, ripplesWithReplies: 0, direct: 0, extended: 0, notes: 0, picks: 0, conversations: 0, profileFilled: false };
describe('progressive discovery', () => {
 it('accounts created before 16 Oct 2026 are never gated', () => expect(isNewAccount('2026-10-15T23:59:00Z')).toBe(false));
 it('accounts created today are new', () => expect(isNewAccount('2026-10-16T08:00:00Z')).toBe(true));
 it('a new account stops being a newcomer after its first Direct Circle member', () => expect(isNewcomer(true, { ripples: 0, direct: 1 })).toBe(false));
 it('a new account stops being a newcomer after its first Ripple', () => expect(isNewcomer(true, { ripples: 1, direct: 0 })).toBe(false));
 it('there are nine discoveries', () => expect(discoveryItems(zero)).toHaveLength(9));
 it('real activity marks discoveries done', () => expect(discoveryItems({ ...zero, wingwoman: 1, direct: 2 }).filter(i => i.done).length).toBe(2));
});
