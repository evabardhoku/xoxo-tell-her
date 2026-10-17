import { afterEach, describe, expect, it, vi } from 'vitest';
import { ANON_KEYS, randomAnonymous } from '@/lib/avatar';
import { withRippleIdentities } from '@/lib/ripple-identity';

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.rpc } }));
afterEach(() => vi.restoreAllMocks());
describe('Automatic anonymous appearances', () => {
 it('randomizes every trait independently without profile preferences', () => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
  const first = randomAnonymous();
  vi.spyOn(Math, 'random').mockReturnValue(0.999);
  const next = randomAnonymous();
  for (const k of ANON_KEYS) {
   expect(first[k.key]).toBe(0);
   expect(next[k.key]).toBe(k.options.length - 1);
  }
  expect(first.variant).toBe(0);
  expect(next.variant).toBe(359);
 });
 it('gives anonymous reads fresh masks but never replaces named identity', async () => {
  mocks.rpc.mockResolvedValue({ data: [{ question_id: 'a', author_visibility: 'anonymous' }, { question_id: 'n', author_visibility: 'named', first_name: 'Eva' }], error: null });
  vi.spyOn(Math, 'random').mockReturnValue(0);
  const first = await withRippleIdentities([{ id: 'a' }, { id: 'n' }]);
  vi.spyOn(Math, 'random').mockReturnValue(0.9);
  const next = await withRippleIdentities([{ id: 'a' }, { id: 'n' }]);
  expect(next[0]?.anonymous_avatar).not.toEqual(first[0]?.anonymous_avatar);
  expect(next[1]).toMatchObject({ first_name: 'Eva', author_visibility: 'named', anonymous_avatar: null });
  expect(mocks.rpc.mock.calls.every(([fn]) => fn === 'tellher_ripple_identities')).toBe(true);
 });
});