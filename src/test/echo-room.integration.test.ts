import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { voiceLabel } from '@/lib/echo-room';

const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('Echo Room', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = []; let q = '';
 // 0 = author, 1..3 = echoers, 4 = member who only replied/never echoed
 beforeAll(async () => {
  admin = createClient(url!, key!, { auth: { persistSession: false } });
  for (const n of ['Ana', 'Bo', 'Cy', 'Di', 'Ed']) {
   const email = `tellher-room-${n}-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: n, last_name: 'Hidden', woman_attested: true } });
   if (error || !data.user) throw error; ids.push(data.user.id);
   const cl = createClient(url!, process.env['SUPABASE_PUBLISHABLE_KEY'] || key!, { auth: { persistSession: false } });
   await cl.auth.signInWithPassword({ email, password }); c.push(cl);
  }
  q = (await c[0]!.rpc('tellher_publish_question', { _category: 'Work', _body: 'Echo room test question', _scope: 'community', _instinct: 'unsure', _note: null })).data as string;
 }, 60000);
 afterAll(async () => { if (q) await c[0]!.rpc('tellher_delete_question', { _id: q }); for (const id of ids) await admin.auth.admin.deleteUser(id); });

 it('below threshold nobody can enter, including the author and echoers', async () => {
  await c[1]!.rpc('tellher_echo', { _id: q }); await c[2]!.rpc('tellher_echo', { _id: q });
  for (const i of [0, 1]) { expect((await c[i]!.rpc('tellher_echo_room', { _q: q })).error).not.toBeNull(); expect((await c[i]!.rpc('tellher_echo_room_post', { _q: q, _body: 'hi' })).error).not.toBeNull(); }
  expect((await c[0]!.rpc('tellher_echo_room_status', { _q: q })).data?.[0]).toMatchObject({ unlocked: false, can_enter: false });
 });
 it('at threshold the author and echoers enter; others are refused', async () => {
  await c[3]!.rpc('tellher_echo', { _id: q });
  for (const i of [0, 1, 2, 3]) expect((await c[i]!.rpc('tellher_echo_room_status', { _q: q })).data?.[0]).toMatchObject({ unlocked: true, can_enter: true });
  expect((await c[4]!.rpc('tellher_echo_room_status', { _q: q })).data?.[0]).toMatchObject({ unlocked: true, can_enter: false });
  expect((await c[4]!.rpc('tellher_echo_room', { _q: q })).error).not.toBeNull();
  expect((await c[4]!.rpc('tellher_echo_room_post', { _q: q, _body: 'let me in' })).error).not.toBeNull();
  expect((await c[4]!.from('echo_room_messages').insert({ question_id: q, sender_id: ids[4], body: 'x' })).error).not.toBeNull();
 });
 it('messages persist with stable anonymous voices and no identities', async () => {
  for (const [i, b] of [[2, 'first voice'], [0, 'from the author'], [1, 'second voice'], [2, 'first voice again']] as const) expect((await c[i]!.rpc('tellher_echo_room_post', { _q: q, _body: b })).error).toBeNull();
  const fresh = (await c[3]!.rpc('tellher_echo_room', { _q: q })).data as { voice: number; body: string; mine: boolean }[];
  expect(fresh.map(m => [voiceLabel(m.voice), m.body])).toEqual([['Voice 1', 'first voice'], ['Original Poster', 'from the author'], ['Voice 2', 'second voice'], ['Voice 1', 'first voice again']]);
  const text = JSON.stringify(fresh); for (const leak of [...ids, 'Ana', 'Bo', 'Hidden']) expect(text).not.toContain(leak);
  expect((await c[4]!.from('echo_room_messages').select('*')).data ?? []).toEqual([]);
  expect((await c[4]!.from('echo_room_voices').select('*')).data ?? []).toEqual([]);
 });
 it('participants can report others’ room messages; outsiders cannot', async () => {
  const msgs = (await c[3]!.rpc('tellher_echo_room', { _q: q })).data as { id: string }[];
  expect((await c[3]!.rpc('tellher_report_room_message', { _id: msgs[0]!.id, _reason: 'unkind' })).error).toBeNull();
  expect((await c[4]!.rpc('tellher_report_room_message', { _id: msgs[0]!.id, _reason: 'x' })).error).not.toBeNull();
 });
 it('search never returns Echo Room content', async () => {
  for (const i of [0, 1, 4]) expect(((await c[i]!.rpc('tellher_search', { _q: 'first voice' })).data ?? []).length).toBe(0);
 });
});
