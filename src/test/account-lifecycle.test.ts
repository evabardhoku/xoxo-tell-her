import { describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { accountLifecycle } from '@/lib/account-lifecycle';

const user = (id: string) => ({ id } as User);
describe('Safe account transitions', () => {
 it('clears previous private data before displaying a different account', () => {
  const cache = new QueryClient(); const snapshots: unknown[] = [];
  const account = accountLifecycle({ setUser: () => snapshots.push(cache.getQueryData(['private-profile'])), setReady: vi.fn(), clearCache: () => cache.clear(), refresh: vi.fn() });
  account.initial(user('first'));
  cache.setQueryData(['private-profile'], { id: 'first', first_name: 'First' });
  account.change('SIGNED_IN', user('second'));
  expect(snapshots.at(-1)).toBeUndefined();
 });
 it('does not let a late initial lookup overwrite a new sign-in', () => {
  const setUser = vi.fn();
  const account = accountLifecycle({ setUser, setReady: vi.fn(), clearCache: vi.fn(), refresh: vi.fn() });
  account.change('SIGNED_IN', user('second')); account.initial(user('first'));
  expect(setUser).toHaveBeenCalledTimes(1);
  expect(setUser).toHaveBeenLastCalledWith(user('second'));
 });
 it('clears cached data on sign-out without refetching protected queries', () => {
  const clearCache = vi.fn(); const refresh = vi.fn(); const setUser = vi.fn();
  const account = accountLifecycle({ setUser, setReady: vi.fn(), clearCache, refresh });
  account.initial(user('first')); clearCache.mockClear(); account.change('SIGNED_OUT', null);
  expect(clearCache).toHaveBeenCalledTimes(1);
  expect(setUser).toHaveBeenLastCalledWith(null);
  expect(refresh).toHaveBeenLastCalledWith(false);
 });
 it('ignores token refresh and disposed callbacks', () => {
  const setUser = vi.fn();
  const account = accountLifecycle({ setUser, setReady: vi.fn(), clearCache: vi.fn(), refresh: vi.fn() });
  account.change('TOKEN_REFRESHED', user('first')); account.dispose();
  account.change('SIGNED_IN', user('second')); account.initial(user('first'));
  expect(setUser).not.toHaveBeenCalled();
 });
});