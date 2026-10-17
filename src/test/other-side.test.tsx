import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OtherSide } from '@/components/other-side';

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.rpc } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

function show(isAuthor: boolean) {
 const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
 render(<QueryClientProvider client={client}><OtherSide id="new-star" isAuthor={isAuthor} /></QueryClientProvider>);
}

it('lets the author write a decision immediately and saves it privately by default', async () => {
 let saved: Record<string, unknown> | null = null;
 mocks.rpc.mockImplementation(async (name: string, args: Record<string, unknown>) => {
  if (name === 'tellher_set_outcome') saved = args;
  return { error: null, data: name === 'tellher_outcome' && saved ? [{ status: null, summary: saved._summary, note: '', shared: false, updated_at: new Date().toISOString(), is_mine: true }] : [] };
 });
 show(true);
 fireEvent.click(await screen.findByRole('button', { name: 'Write your Star Letter' }));
 fireEvent.change(screen.getByLabelText('In a sentence, what happened next?'), { target: { value: 'I decided to speak to my manager.' } });
 fireEvent.click(screen.getByRole('button', { name: 'Save update' }));
 await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith('tellher_set_outcome', {
  _q: 'new-star', _status: '', _summary: 'I decided to speak to my manager.', _note: '', _shared: false,
 }));
 await waitFor(() => expect(screen.getByRole('button', { name: 'Edit letter' })).toBeEnabled());
});

it('does not give a non-author a write action when no shared letter exists', async () => {
 mocks.rpc.mockResolvedValue({ error: null, data: [] });
 show(false);
 await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith('tellher_outcome', { _q: 'new-star' }));
 await waitFor(() => expect(screen.queryByRole('region')).toBeNull());
 expect(mocks.rpc).toHaveBeenCalledTimes(1);
});