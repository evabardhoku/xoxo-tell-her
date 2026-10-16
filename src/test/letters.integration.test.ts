import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('Letters from the Other Side', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = []; let q = '';
 // 0 = author, 1 = Direct recipient who echoes, 2 = Direct recipient without Echo, 3 = outsider
 beforeAll(async () => {
  admin = createClient(url!, key!, { auth: { persistSession: false } });
  for (const n of ['Ana', 'Bo', 'Cy', 'Di']) {
   const email = `tellher-lt-${n}-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: n, last_name: 'Hidden', woman_attested: true } });
   if (error || !data.user) throw error; ids.push(data.user.id);
   const cl = createClient(url!, process.env['SUPABASE_PUBLISHABLE_KEY'] || key!, { auth: { persistSession: false } });
   await cl.auth.signInWithPassword({ email, password }); c.push(cl);
  }
  await admin.from('trust_connections').insert([{ requester_id: ids[0], recipient_id: ids[1], status: 'accepted' }, { requester_id: ids[0], recipient_id: ids[2], status: 'accepted' }]);
  q = (await c[0]!.rpc('tellher_publish_question', { _category: 'Work', _body: 'Letters circle question', _scope: 'circle', _instinct: 'unsure', _note: null })).data as string;
  await c[1]!.rpc('tellher_echo', { _id: q });
 }, 60000);
 afterAll(async () => { if (q) await c[0]!.rpc('tellher_delete_question', { _id: q }); await admin.from('trust_connections').delete().in('requester_id', ids); for (const id of ids) await admin.auth.admin.deleteUser(id); });
 const write = (i: number, body = 'Quillfern letter') => c[i]!.rpc('tellher_write_letter', { _q: q, _body: body, _where_now: 'a year later' });
 const list = async (i: number) => (await c[i]!.rpc('tellher_letters', { _q: q })).data ?? [];

 it('only echoers, or the author after a shared outcome, may write', async () => {
  expect((await write(2)).error).not.toBeNull();
  expect((await write(3)).error).not.toBeNull();
  expect((await write(0)).error).not.toBeNull();
  expect((await write(1)).error).toBeNull();
  await c[0]!.rpc('tellher_set_outcome', { _q: q, _status: 'boundary', _summary: 'done', _note: '', _shared: true });
  expect((await write(0, 'Author letter')).error).toBeNull();
 });
 it('rejects letters over 600 characters', async () => {
  expect((await write(1, 'x'.repeat(601))).error).not.toBeNull();
 });
 it('the author is notified once when the first letter arrives', async () => {
  const { count } = await admin.from('notifications').select('id', { count: 'exact', head: true }).eq('recipient_id', ids[0]).eq('kind', 'letter');
  expect(count).toBe(1);
 });
 it('readers within reach see letters without any author identity; outsiders see none', async () => {
  const seen = await list(2); expect(seen).toHaveLength(2);
  for (const leak of [...ids, 'Ana', 'Bo', 'Hidden']) expect(JSON.stringify(seen)).not.toContain(leak);
  expect(await list(3)).toHaveLength(0);
  expect((await c[2]!.from('ripple_letters').select('author_id')).error).not.toBeNull();
 });
 it('"This helped" is one per woman and its count is visible only to the letter author', async () => {
  const letter = (await list(2)).find((l: { body: string }) => l.body === 'Quillfern letter')!;
  await c[2]!.rpc('tellher_help_letter', { _id: letter.id }); await c[2]!.rpc('tellher_help_letter', { _id: letter.id });
  expect((await list(2)).find((l: { id: string }) => l.id === letter.id).help_count).toBeNull();
  expect((await list(1)).find((l: { id: string }) => l.id === letter.id).help_count).toBe(1);
  expect((await c[1]!.rpc('tellher_help_letter', { _id: letter.id })).error).not.toBeNull();
 });
 it('only the writer can edit or delete her letter; others can report it', async () => {
  const letter = (await list(1)).find((l: { mine: boolean }) => l.mine)!;
  expect((await c[2]!.rpc('tellher_delete_letter', { _id: letter.id })).error).not.toBeNull();
  await c[2]!.from('ripple_letters').update({ body: 'hijack' }).eq('id', letter.id);
  expect((await list(1)).find((l: { id: string }) => l.id === letter.id).body).toBe('Quillfern letter');
  expect((await c[2]!.rpc('tellher_report_letter', { _id: letter.id, _reason: 'test' })).error).toBeNull();
  expect((await c[1]!.rpc('tellher_delete_letter', { _id: letter.id })).error).toBeNull();
  expect(await list(2)).toHaveLength(1);
 });
});
