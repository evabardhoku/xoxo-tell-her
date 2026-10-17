import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReplyLike } from '@/components/reply-like';

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.rpc } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function show(mine = false) {
 const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
 render(<QueryClientProvider client={client}><ReplyLike questionId="anonymous-ripple" reply={{ id: 'reply', is_mine: mine }} /></QueryClientProvider>);
}
it('reads checked counts and persists a like then an unlike without fetching identities', async () => {
 let count = 2; let mine = false;
 mocks.rpc.mockImplementation(async (name: string) => {
  if (name === 'tellher_like_reply') { count = 3; mine = true; }
  if (name === 'tellher_unlike_reply') { count = 2; mine = false; }
  return { error: null, data: name === 'tellher_reply_likes' ? [{ reply_id: 'reply', likes: count, mine }] : null };
 });
 show();
 await waitFor(() => expect(screen.getByRole('button', { name: 'Like perspective' })).toBeEnabled());
 expect(screen.getByRole('button', { name: 'Like perspective' })).toHaveTextContent('2');
 fireEvent.click(screen.getByRole('button', { name: 'Like perspective' }));
 await waitFor(() => expect(screen.getByRole('button', { name: 'Unlike perspective' })).toHaveTextContent('3'));
 await waitFor(() => expect(screen.getByRole('button', { name: 'Unlike perspective' })).toBeEnabled());
 fireEvent.click(screen.getByRole('button', { name: 'Unlike perspective' }));
 await waitFor(() => expect(screen.getByRole('button', { name: 'Like perspective' })).toHaveTextContent('2'));
 expect(mocks.rpc).toHaveBeenCalledWith('tellher_like_reply', { _reply: 'reply' });
 expect(mocks.rpc).toHaveBeenCalledWith('tellher_unlike_reply', { _reply: 'reply' });
 expect(mocks.rpc.mock.calls.every(([name]) => ['tellher_reply_likes', 'tellher_like_reply', 'tellher_unlike_reply'].includes(name))).toBe(true);
});
it('shows the owner count without allowing self-likes', async () => {
 mocks.rpc.mockResolvedValue({ error: null, data: [{ reply_id: 'reply', likes: 4, mine: false }] });
 show(true);
 await waitFor(() => expect(screen.getByLabelText('4 likes')).toBeVisible());
 expect(screen.queryByRole('button', { name: 'Like perspective' })).toBeNull();
 expect(mocks.rpc.mock.calls.every(([name]) => name === 'tellher_reply_likes')).toBe(true);
});
it('keeps the checked count unchanged when the like is refused', async () => {
 mocks.rpc.mockImplementation(async (name: string) => name === 'tellher_reply_likes'
  ? { error: null, data: [{ reply_id: 'reply', likes: 1, mine: false }] }
  : { error: { message: 'not allowed' }, data: null });
 show();
 await waitFor(() => expect(screen.getByRole('button', { name: 'Like perspective' })).toBeEnabled());
 fireEvent.click(screen.getByRole('button', { name: 'Like perspective' }));
 await waitFor(() => expect(screen.getByRole('alert')).toBeVisible());
 expect(screen.getByRole('button', { name: 'Like perspective' })).toHaveTextContent('1');
});