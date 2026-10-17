import { admitFixture } from './membership-fixture';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('Wingwoman conversations stay private', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = []; let sid = '';
 beforeAll(async () => {
  admin = createClient(url!, key!, { auth: { persistSession: false } });
  for (const n of ['Ana', 'Bo']) {
   const email = `tellher-ww-${n}-${crypto.randomUUID().slice(0, 6)}@example.com`; const password = crypto.randomUUID();
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: n, last_name: 'Test', woman_attested: true } });
   if (error || !data.user) throw error; ids.push(data.user.id); await admitFixture(admin, data.user.id);
   const cl = createClient(url!, process.env['SUPABASE_PUBLISHABLE_KEY'] || key!, { auth: { persistSession: false } });
   await cl.auth.signInWithPassword({ email, password }); c.push(cl);
  }
  const { data } = await c[0]!.from('wingwoman_sessions').insert({ owner_id: ids[0], context: 'Work', situation: 'Private situation text' }).select('id').single();
  sid = data!.id;
 }, 60000);
 afterAll(async () => { for (const id of ids) await admin.auth.admin.deleteUser(id); });
 it('owner can add and read turns in order', async () => {
  for (const [role, content] of [['user', 'one'], ['assistant', 'two'], ['user', 'three']]) expect((await c[0]!.from('wingwoman_messages').insert({ session_id: sid, owner_id: ids[0], role, content })).error).toBeNull();
  const { data } = await c[0]!.from('wingwoman_messages').select('content').eq('session_id', sid).order('created_at');
  expect(data!.map(m => m.content)).toEqual(['one', 'two', 'three']);
 });
 it('another member cannot read the session or its messages', async () => {
  expect((await c[1]!.from('wingwoman_sessions').select('id').eq('id', sid)).data).toEqual([]);
  expect((await c[1]!.from('wingwoman_messages').select('id').eq('session_id', sid)).data).toEqual([]);
 });
 it('another member cannot write into the session, even as herself', async () => {
  expect((await c[1]!.from('wingwoman_messages').insert({ session_id: sid, owner_id: ids[1], role: 'user', content: 'x' })).error).not.toBeNull();
  expect((await c[1]!.from('wingwoman_messages').insert({ session_id: sid, owner_id: ids[0], role: 'user', content: 'x' })).error).not.toBeNull();
 });
});
