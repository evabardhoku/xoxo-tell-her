import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('Constellations access', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = []; let circle = ''; let community = '';
 // 0 = author, 1 = Direct Circle, 2 = outsider
 beforeAll(async () => {
  admin = createClient(url!, key!, { auth: { persistSession: false } });
  for (const n of ['Ana', 'Bo', 'Cy']) {
   const email = `tellher-sky-${n}-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: n, last_name: 'Hidden', woman_attested: true } });
   if (error || !data.user) throw error; ids.push(data.user.id);
   const cl = createClient(url!, process.env['SUPABASE_PUBLISHABLE_KEY'] || key!, { auth: { persistSession: false } });
   await cl.auth.signInWithPassword({ email, password }); c.push(cl);
  }
  await admin.from('trust_connections').insert({ requester_id: ids[0], recipient_id: ids[1], status: 'accepted' });
  circle = (await c[0]!.rpc('tellher_publish_question', { _category: 'Work', _body: 'Sky circle question', _scope: 'circle', _instinct: 'unsure', _note: 'sky secret' })).data as string;
  community = (await c[0]!.rpc('tellher_publish_question', { _category: 'Travel', _body: 'Sky community question', _scope: 'community', _instinct: 'unsure', _note: null })).data as string;
  await c[0]!.rpc('tellher_set_outcome', { _q: circle, _status: 'other', _summary: 'private sky outcome', _note: '', _shared: false });
 }, 60000);
 afterAll(async () => { for (const q of [circle, community]) if (q) await c[0]!.rpc('tellher_delete_question', { _id: q }); await admin.from('trust_connections').delete().in('requester_id', ids); for (const id of ids) await admin.auth.admin.deleteUser(id); });
 const sky = async (i: number) => ((await c[i]!.rpc('tellher_constellation')).data ?? []) as { id: string; has_outcome: boolean; echo_level: number }[];

 it('shows only Ripples the viewer can open, with no author identity', async () => {
  const out = await sky(2); expect(out.some(s => s.id === circle)).toBe(false); expect(out.some(s => s.id === community)).toBe(true);
  const inner = await sky(1); expect(inner.some(s => s.id === circle)).toBe(true);
  const text = JSON.stringify(inner); for (const leak of [...ids, 'Ana', 'Hidden', 'sky secret']) expect(text).not.toContain(leak);
 });
 it('private outcomes only light up for the author; small echo counts stay coarse', async () => {
  expect((await sky(0)).find(s => s.id === circle)?.has_outcome).toBe(true);
  expect((await sky(1)).find(s => s.id === circle)?.has_outcome).toBe(false);
  await c[2]!.rpc('tellher_echo', { _id: community });
  expect((await sky(1)).find(s => s.id === community)?.echo_level).toBe(1);
 });
});
