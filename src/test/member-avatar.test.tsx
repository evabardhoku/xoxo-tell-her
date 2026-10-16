import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { MemberAvatar } from '@/components/avatars';

const mocks = vi.hoisted(() => ({ read: vi.fn(), photo: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.read } }));
vi.mock('@/lib/member.functions', () => ({ memberAvatar: mocks.photo }));
function mount() {
 const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
 return render(<QueryClientProvider client={cache}><MemberAvatar id="member" name="Sara" hasPhoto /></QueryClientProvider>);
}
describe('Member portrait selection', () => {
 it('uses the checked illustration instead of signing a hidden underlying photo', async () => {
  mocks.read.mockResolvedValue({ data: [{ member_id: 'member', kind: 'illustrated', config: { skin: 2, hair: 1 } }], error: null });
  mocks.photo.mockClear();
  const { container } = mount();
  await waitFor(() => expect(container.querySelector('.illustrated-avatar')).not.toBeNull());
  expect(mocks.read).toHaveBeenCalledWith('tellher_open_avatars', { _ids: ['member'] });
  expect(mocks.photo).not.toHaveBeenCalled();
 });
 it('requests a checked signed photo only after the representation resolves to photo', async () => {
  mocks.read.mockResolvedValue({ data: [{ member_id: 'member', kind: 'photo', config: null }], error: null });
  mocks.photo.mockResolvedValue({ url: '/private-signed-photo' });
  const { container } = mount();
  await waitFor(() => expect(container.querySelector('img')?.getAttribute('src')).toBe('/private-signed-photo'));
  expect(mocks.photo).toHaveBeenCalledWith({ data: { id: 'member' } });
 });
 it('falls back to an initial without leaking a photo when avatar authorization fails', async () => {
  mocks.read.mockResolvedValue({ data: null, error: new Error('Not allowed') });
  mocks.photo.mockClear();
  mount();
  await waitFor(() => expect(mocks.read).toHaveBeenCalled());
  expect(screen.getAllByText('S').length).toBeGreaterThan(0);
  expect(mocks.photo).not.toHaveBeenCalled();
 });
});