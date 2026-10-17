import { describe, expect, it, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn() } }));
import { requireMembership } from '@/lib/membership';
describe('Server membership guard', () => {
 it('accepts only an explicitly admitted caller', async () => { await expect(requireMembership({ rpc: vi.fn().mockResolvedValue({ data: true, error: null }) })).resolves.toBeUndefined(); });
 it.each([false, null, [], 'true'])('rejects non-admitted response %s before AI', async data => { await expect(requireMembership({ rpc: vi.fn().mockResolvedValue({ data, error: null }) })).rejects.toThrow('redeem an invitation'); });
 it('fails closed on errors', async () => { await expect(requireMembership({ rpc: vi.fn().mockResolvedValue({ data: true, error: new Error('unavailable') }) })).rejects.toThrow('redeem an invitation'); });
});
