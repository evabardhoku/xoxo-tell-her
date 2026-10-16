import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { echoLine } from '@/components/echo';

const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('Echo', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = []; let q = ''; let circle = '';
 // 0 = author, 1..4 = members, 5 = outsider for the circle question
 beforeAll(async () => {
  admin = createClient(url!, key!, { auth: { persistSession: false } });
  for (const n of ['Ana', 'Bo', 'Cy', 'Di', 'Ed', 'Fi']) {
   const email = `tellher-echo-${n}-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: n, last_name: 'Hidden', woman_attested: true } });
   if (error || !data.user) throw error; ids.push(data.user.id);
   const cl = createClient(url!, process.env['SUPABASE_PUBLISHABLE_KEY'] || key!, { auth: { persistSession: false } });
   await cl.auth.signInWithPassword({ email, password }); c.push(cl);
  }
  q = (await c[0]!.rpc('tellher_publish_question', { _category: 'Work', _body: 'Echo test question', _scope: 'community', _instinct: 'unsure', _note: null })).data as string;
  await admin.from('trust_connections').insert({ requester_id: ids[0], recipient_id: ids[1], status: 'accepted' });
  circle = (await c[0]!.rpc('tellher_publish_question', { _category: 'Work', _body: 'Echo circle question', _scope: 'circle', _instinct: 'unsure', _note: null })).data as string;
 }, 60000);
 afterAll(async () => { for (const x of [q, circle]) if (x) await c[0]!.rpc('tellher_delete_question', { _id: x }); await admin.from('trust_connections').delete().in('requester_id', ids); for (const id of ids) await admin.auth.admin.deleteUser(id); });
 const signal = async (i: number, id = q) => (await c[i]!.rpc('tellher_echo_signal', { _id: id })).data?.[0];

 it('one Echo per member; echoing twice keeps a single row', async () => {
  expect((await c[1]!.rpc('tellher_echo', { _id: q })).error).toBeNull();
  expect((await c[1]!.rpc('tellher_echo', { _id: q })).error).toBeNull();
  const { count } = await admin.from('ripple_echoes').select('*', { count: 'exact', head: true }).eq('question_id', q);
  expect(count).toBe(1);
  expect(await signal(1)).toMatchObject({ mine: true });
 });
 it('hides the exact count below 3 and shows it from 3', async () => {
  await c[2]!.rpc('tellher_echo', { _id: q });
  expect(await signal(0)).toMatchObject({ echo_count: null, below_threshold: true });
  await c[3]!.rpc('tellher_echo', { _id: q });
  expect(await signal(4)).toMatchObject({ echo_count: 3, mine: false });
  expect(echoLine({ echo_count: 2, below_threshold: true, mine: false }, false)).not.toMatch(/\d/);
 });
 it('removing an Echo works', async () => {
  expect((await c[3]!.rpc('tellher_unecho', { _id: q })).error).toBeNull();
  expect(await signal(3)).toMatchObject({ echo_count: null, mine: false });
 });
 it('author sees the signal but cannot echo her own Ripple', async () => {
  expect((await c[0]!.rpc('tellher_echo', { _id: q })).error).not.toBeNull();
  await c[3]!.rpc('tellher_echo', { _id: q });
  expect(await signal(0)).toMatchObject({ echo_count: 3 });
 });
 it('never exposes identities and blocks non-recipients', async () => {
  const rows = (await c[4]!.from('ripple_echoes').select('*')).data ?? [];
  expect(rows).toEqual([]);
  const text = JSON.stringify(await signal(4)); for (const id of ids) expect(text).not.toContain(id);
  expect((await c[5]!.rpc('tellher_echo', { _id: circle })).error).not.toBeNull();
  expect(await signal(5, circle)).toBeUndefined();
  expect((await c[4]!.from('ripple_echoes').insert({ question_id: q, member_id: ids[4] })).error).not.toBeNull();
 });
 it('Echo does not change replies', async () => {
  expect((await c[1]!.rpc('tellher_post_reply', { _id: q, _tag: 'been_there', _body: 'Same here' })).error).toBeNull();
  expect((await c[4]!.rpc('tellher_replies', { _id: q })).data).toHaveLength(1);
 });
});
