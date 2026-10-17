import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hasRecovery, rememberRecovery } from '@/lib/password-recovery';
import { Route } from '@/routes/reset-password';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), update: vi.fn(), listener: null as null | ((event: string, session: { user: { id: string } } | null) => void) }));
vi.mock('@tanstack/react-router', () => ({ createFileRoute: () => (options: unknown) => ({ options }), Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getUser: mocks.getUser, updateUser: mocks.update, onAuthStateChange: (listener: typeof mocks.listener) => { mocks.listener = listener; return { data: { subscription: { unsubscribe: vi.fn() } } }; } } } }));
const Reset = Route.options.component as React.ComponentType;

describe('Verified password recovery', () => {
 beforeEach(() => { sessionStorage.clear(); window.location.hash = ''; mocks.getUser.mockResolvedValue({ data: { user: null }, error: null }); mocks.update.mockReset(); mocks.update.mockResolvedValue({ error: null }); });
 afterEach(() => { cleanup(); vi.restoreAllMocks(); });
 it('does not authorize a fabricated URL flag', async () => {
  window.location.hash = '#type=recovery'; render(<Reset />);
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
  expect(mocks.update).not.toHaveBeenCalled();
 });
 it('binds remembered recovery to the verified user, not any signed-in account', () => {
  rememberRecovery('first'); expect(hasRecovery('first')).toBe(true); expect(hasRecovery('second')).toBe(false);
  rememberRecovery(null); expect(hasRecovery('first')).toBe(false);
 });
 it('accepts a live recovery event with blocked storage and saves matching passwords', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  render(<Reset />); await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  act(() => mocks.listener?.('PASSWORD_RECOVERY', { user: { id: 'recovery-user' } }));
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'valid-new-password' } });
  fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'valid-new-password' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Set new password' }).closest('form') as HTMLFormElement);
  await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({ password: 'valid-new-password' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Your password has been updated'));
 });
 it('does not update when confirmation differs', async () => {
  rememberRecovery('first'); mocks.getUser.mockResolvedValue({ data: { user: { id: 'first' } }, error: null }); render(<Reset />);
  await screen.findByLabelText('New password');
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'valid-new-password' } });
  fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'different-password' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Set new password' }).closest('form') as HTMLFormElement);
  await screen.findByRole('alert'); expect(mocks.update).not.toHaveBeenCalled();
 });
});