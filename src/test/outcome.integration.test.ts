import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('The Other Side', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = []; let circle = '';
 // 0 = author, 1 = Direct Circle recipient, 2 = outsider
 beforeAll(async () => {
  admin = createClient(url!, key!, { auth: { persistSession: false } });
  for (const n of ['Ana', 'Bo', 'Cy']) {
   const email = `tellher-os-${n}-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: n, last_name: 'Hidden', woman_attested: true } });
   if (error || !data.user) throw error; ids.push(data.user.id);
   const cl = createClient(url!, process.env['SUPABASE_PUBLISHABLE_KEY'] || key!, { auth: { persistSession: false } });
   await cl.auth.signInWithPassword({ email, password }); c.push(cl);
  }
  await admin.from('trust_connections').insert({ requester_id: ids[0], recipient_id: ids[1], status: 'accepted' });
  circle = (await c[0]!.rpc('tellher_publish_question', { _category: 'Work', _body: 'Outcome circle question', _scope: 'circle', _instinct: 'unsure', _note: null })).data as string;
 }, 60000);
 afterAll(async () => { if (circle) await c[0]!.rpc('tellher_delete_question', { _id: circle }); await admin.from('trust_connections').delete().in('requester_id', ids); for (const id of ids) await admin.auth.admin.deleteUser(id); });
 const get = async (i: number) => (await c[i]!.rpc('tellher_outcome', { _q: circle })).data?.[0];
 const set = (i: number, shared: boolean, summary = 'Kestrelmoon outcome') => c[i]!.rpc('tellher_set_outcome', { _q: circle, _status: 'boundary', _summary: summary, _note: '', _shared: shared });

 it('only the author can add or edit her outcome; others cannot impersonate her', async () => {
  expect((await set(1, true)).error).not.toBeNull();
  expect((await set(2, true)).error).not.toBeNull();
  expect((await c[1]!.from('ripple_outcomes').insert({ question_id: circle, summary: 'fake', shared: true })).error).not.toBeNull();
  expect((await set(0, false)).error).toBeNull();
  expect((await set(1, false, 'overwrite')).error).not.toBeNull();
  expect(await get(0)).toMatchObject({ summary: 'Kestrelmoon outcome', shared: false, is_mine: true });
 });
 it('a private outcome is visible only to the author', async () => {
  expect(await get(1)).toBeUndefined(); expect(await get(2)).toBeUndefined();
 });
 it('a shared outcome follows the Ripple reach and never names the author', async () => {
  await set(0, true);
  const seen = await get(1); expect(seen).toMatchObject({ summary: 'Kestrelmoon outcome', is_mine: false });
  for (const leak of [...ids, 'Ana', 'Hidden']) expect(JSON.stringify(seen)).not.toContain(leak);
  expect(await get(2)).toBeUndefined();
 });
 it('feed and search are unchanged by outcomes', async () => {
  expect(((await c[2]!.rpc('tellher_feed')).data ?? []).some((q: { id: string }) => q.id === circle)).toBe(false);
  for (const i of [1, 2]) expect(((await c[i]!.rpc('tellher_search', { _q: 'Kestrelmoon' })).data ?? []).length).toBe(0);
 });
 it('author can remove her outcome', async () => {
  expect((await c[1]!.rpc('tellher_delete_outcome', { _q: circle })).error).not.toBeNull();
  expect((await c[0]!.rpc('tellher_delete_outcome', { _q: circle })).error).toBeNull();
  expect(await get(0)).toBeUndefined();
 });
});
