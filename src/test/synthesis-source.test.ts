import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-start', () => ({ createServerFn: () => {
 const builder = { middleware: () => builder, inputValidator: () => builder, handler: (fn: unknown) => fn };
 return builder;
} }));
vi.mock('@/integrations/supabase/auth-middleware', () => ({ requireSupabaseAuth: {} }));
import { synthesizePerspectives } from '@/lib/synthesis.functions';
const summary = { enough: true, common_thread: 'A conversation may help.', different_perspective: 'Some suggest waiting.', questions_open: ['What would change?'] };
const responses = ['Talk directly about the situation.', 'Wait a little and see what changes.', 'Ask what support she would prefer.'].map(body => ({ body, first_name: 'PrivateName', profile_id: 'private-id' }));
const run = synthesizePerspectives as unknown as (args: { data: { id: string }; context: { supabase: { rpc: ReturnType<typeof vi.fn> } } }) => Promise<unknown>;
beforeEach(() => {
 vi.stubEnv('LOVABLE_API_KEY', 'test-only-key');
 vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(`data: ${JSON.stringify({ type: 'response.output_text.delta', delta: JSON.stringify(summary) })}\n\n`)));
});
describe('Checked synthesis sources', () => {
 it.each([['named', 'tellher_open_comments'], ['anonymous', 'tellher_replies']])('uses the checked %s response reader without sending identities', async (visibility, reader) => {
  const rpc = vi.fn(async (name: string) => ({ error: null, data: name === 'tellher_question' ? [{ body: 'What should I consider?', category: 'Friendship' }] : name === 'tellher_ripple_identities' ? [{ author_visibility: visibility }] : responses }));
  expect(await run({ data: { id: 'ripple' }, context: { supabase: { rpc } } })).toEqual(summary);
  expect(rpc).toHaveBeenCalledWith(reader, { _id: 'ripple' });
  const otherReader = reader === 'tellher_open_comments' ? 'tellher_replies' : 'tellher_open_comments';
  expect(rpc).not.toHaveBeenCalledWith(otherReader, expect.anything());
  const payload = JSON.parse(vi.mocked(fetch).mock.calls[0]?.[1]?.body as string);
  expect(payload.input[0].content).toContain(responses[0]?.body);
  expect(payload.input[0].content).not.toContain('PrivateName');
  expect(payload.input[0].content).not.toContain('private-id');
 });
 it('does not call AI when the checked question is unavailable', async () => {
  const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
  await expect(run({ data: { id: 'hidden' }, context: { supabase: { rpc } } })).rejects.toThrow('isn’t available');
  expect(fetch).not.toHaveBeenCalled();
 });
});