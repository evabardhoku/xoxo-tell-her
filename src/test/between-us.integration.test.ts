import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('Between Us messaging', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = []; let ab = '';
 const [A, B, C, D] = [0, 1, 2, 3];
 const trust = async (a: number, b: number) => { await c[a]!.rpc('tellher_send_trust', { _recipient: ids[b] }); const { data } = await c[b]!.rpc('tellher_my_circle'); const r = (data as { connection_id: string; kind: string; member_id: string }[]).find(x => x.kind === 'incoming' && x.member_id === ids[a])!; const { error } = await c[b]!.rpc('tellher_respond_trust', { _id: r.connection_id, _accept: true }); if (error) throw error; };
 beforeAll(async () => {
  admin = createClient(url!, key!, { auth: { persistSession: false } });
  for (const n of ['Ada', 'Bea', 'Cleo', 'Dina']) {
   const email = `tellher-bu-${n}-${crypto.randomUUID().slice(0, 6)}@example.com`; const password = crypto.randomUUID();
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: n, last_name: 'Test', woman_attested: true } });
   if (error || !data.user) throw error; ids.push(data.user.id);
   const cl = createClient(url!, process.env['SUPABASE_PUBLISHABLE_KEY'] || key!, { auth: { persistSession: false } });
   await cl.auth.signInWithPassword({ email, password }); c.push(cl);
  }
  await trust(A, B); await trust(B, C); // C is only Extended for A
 }, 60000);
 afterAll(async () => { for (const id of ids) await admin.auth.admin.deleteUser(id); });

 it('Direct Circle members can open a conversation and exchange messages', async () => {
  const o = await c[A]!.rpc('tellher_open_conversation', { _member: ids[B] }); expect(o.error).toBeNull(); ab = o.data as string;
  expect((await c[B]!.rpc('tellher_open_conversation', { _member: ids[A] })).data).toBe(ab); // same 1:1, no duplicates
  expect((await c[A]!.rpc('tellher_send_message', { _c: ab, _body: 'hello B' })).error).toBeNull();
  expect((await c[B]!.rpc('tellher_send_message', { _c: ab, _body: 'hi A' })).error).toBeNull();
  const { data } = await c[B]!.from('messages').select('body').eq('conversation_id', ab).order('created_at');
  expect(data!.map(m => m.body)).toEqual(['hello B', 'hi A']);
  const inbox = (await c[A]!.rpc('tellher_inbox')).data as { conversation_id: string; unread: boolean; last_body: string }[];
  expect(inbox.find(r => r.conversation_id === ab)).toMatchObject({ unread: true, last_body: 'hi A' });
 });
 it('Extended Circle alone does not allow messaging', async () => {
  expect((await c[A]!.rpc('tellher_can_message', { _member: ids[C] })).data).toBe(false);
  expect((await c[A]!.rpc('tellher_open_conversation', { _member: ids[C] })).error).not.toBeNull();
 });
 it('an accepted trust request makes messaging available', async () => {
  await trust(A, C);
  expect((await c[C]!.rpc('tellher_can_message', { _member: ids[A] })).data).toBe(true);
  expect((await c[A]!.rpc('tellher_open_conversation', { _member: ids[C] })).error).toBeNull();
 });
 it('an outsider cannot read, write, report or mark a conversation by id', async () => {
  expect((await c[D]!.from('messages').select('id').eq('conversation_id', ab)).data).toEqual([]);
  expect((await c[D]!.from('conversation_participants').select('member_id').eq('conversation_id', ab)).data).toEqual([]);
  expect((await c[D]!.rpc('tellher_send_message', { _c: ab, _body: 'intrude' })).error).not.toBeNull();
  expect((await c[D]!.from('messages').insert({ conversation_id: ab, sender_id: ids[D], body: 'x' })).error).not.toBeNull();
  expect((await c[D]!.from('conversation_participants').insert({ conversation_id: ab, member_id: ids[D] })).error).not.toBeNull();
  expect((await c[D]!.rpc('tellher_conversation_partner', { _c: ab })).data).toBeNull();
  const msg = (await c[A]!.from('messages').select('id').eq('conversation_id', ab).limit(1)).data![0]!.id;
  expect((await c[D]!.rpc('tellher_report_message', { _id: msg, _reason: 'x' })).error).not.toBeNull();
  expect(((await c[D]!.rpc('tellher_inbox')).data as unknown[]).length).toBe(0);
  // A participant also cannot write as someone else.
  expect((await c[A]!.from('messages').insert({ conversation_id: ab, sender_id: ids[B], body: 'spoof' })).error).not.toBeNull();
 });
 it('blocking stops messaging both ways until unblocked', async () => {
  expect((await c[B]!.rpc('tellher_block', { _member: ids[A] })).error).toBeNull();
  expect((await c[A]!.rpc('tellher_send_message', { _c: ab, _body: 'still there?' })).error).not.toBeNull();
  expect((await c[B]!.rpc('tellher_send_message', { _c: ab, _body: 'x' })).error).not.toBeNull();
  expect((await c[A]!.rpc('tellher_open_conversation', { _member: ids[B] })).error).not.toBeNull();
  await c[B]!.rpc('tellher_unblock', { _member: ids[A] });
  expect((await c[A]!.rpc('tellher_send_message', { _c: ab, _body: 'back' })).error).toBeNull();
 });
 it('participants can report a message from the other person', async () => {
  const msg = (await c[A]!.from('messages').select('id').eq('sender_id', ids[B]).limit(1)).data![0]!.id;
  expect((await c[A]!.rpc('tellher_report_message', { _id: msg, _reason: 'Testing reports' })).error).toBeNull();
 });
});
