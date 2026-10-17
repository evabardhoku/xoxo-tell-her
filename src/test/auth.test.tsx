import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route } from '@/routes/auth';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), signIn: vi.fn(), signUp: vi.fn(), account: { user: null, ready: true } }));
vi.mock('@tanstack/react-router', () => ({ createFileRoute: () => (options: unknown) => ({ options, useSearch: () => ({ mode: 'signin' }) }), useNavigate: () => mocks.navigate, Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));
vi.mock('@/hooks/account', () => ({ useAccount: () => mocks.account }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { signInWithPassword: mocks.signIn, signUp: mocks.signUp } } }));
vi.mock('@/integrations/lovable', () => ({ lovable: { auth: {} } }));
const Auth = Route.options.component as React.ComponentType;
describe('Email account forms', () => {
 it('selects signup only from the explicit signup mode', () => {
  const validate = Route.options.validateSearch;
  if (typeof validate !== 'function') throw new Error('Expected a search validator function');
  expect(validate({ mode: 'signup' })).toEqual({ mode: 'signup' });
  expect(validate({ mode: 'anything-else' })).toEqual({ mode: 'signin' });
 });
 beforeEach(() => { mocks.navigate.mockClear(); mocks.signIn.mockResolvedValue({ error: null }); mocks.signUp.mockResolvedValue({ error: null }); });
 it('does not navigate ahead of the shared account state after password sign-in', async () => {
  render(<Auth />);
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'member@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'temporary-test-password' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Enter TellHer' }).closest('form') as HTMLFormElement);
  await waitFor(() => expect(mocks.signIn).toHaveBeenCalled());
  expect(mocks.navigate).not.toHaveBeenCalled();
 });
 it('accepts the required signup fields without requiring optional profile fields', async () => {
  render(<Auth />);
  fireEvent.click(screen.getByRole('button', { name: 'New here? Create an account' }));
  const fields: [string, string][] = [['First name','Ana'],['Last name','Test'],['Email address','new@example.com'],['Password','temporary-test-password']];
  for (const [label, value] of fields) fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.submit(screen.getByRole('button', { name: 'Create your account' }).closest('form') as HTMLFormElement);
  await waitFor(() => expect(mocks.signUp).toHaveBeenCalledWith(expect.objectContaining({ email: 'new@example.com', options: expect.objectContaining({ data: { first_name: 'Ana', last_name: 'Test', woman_attested: true } }) })));
 });
});