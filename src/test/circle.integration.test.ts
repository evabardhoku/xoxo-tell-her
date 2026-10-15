import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('MyCircle trust graph', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = []; const emails: string[] = [];
 beforeAll(async () => {
  admin = createClient(url!, key!, { auth: { persistSession: false } });
  for (const n of ['A', 'B', 'C', 'D']) {
   const email = `tellher-circle-${n}-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: n, last_name: 'Test', woman_attested: true } });
   if (error || !data.user) throw error; ids.push(data.user.id); emails.push(email);
   const client = createClient(url!, process.env['SUPABASE_PUBLISHABLE_KEY'] || key!, { auth: { persistSession: false } });
   await client.auth.signInWithPassword({ email, password }); c.push(client);
  }
 }, 40000);
 afterAll(async () => { await admin.from('trust_connections').delete().or(ids.map(i => `requester_id.eq.${i}`).join(',')); for (const id of ids) await admin.auth.admin.deleteUser(id); });
 const [A, B, C, D] = [0, 1, 2, 3];
 const incoming = async (i: number) => ((await c[i]!.rpc('tellher_my_circle')).data ?? []).filter((e: { kind: string }) => e.kind === 'incoming');
 it('finds members by exact email without exposing it', async () => {
  const { data } = await c[A]!.rpc('tellher_find_member', { _email: emails[B] });
  expect(data).toHaveLength(1); expect(JSON.stringify(data)).not.toContain(emails[B]); expect(data![0].first_name).toBe('B');
 });
 it('A trusts B, B accepts; B trusts C, C accepts; A sees B direct and extended reach 1', async () => {
  expect((await c[A]!.rpc('tellher_send_trust', { _recipient: ids[B] })).error).toBeNull();
  expect((await c[B]!.rpc('tellher_respond_trust', { _id: (await incoming(B))[0].connection_id, _accept: true })).error).toBeNull();
  expect((await c[B]!.rpc('tellher_send_trust', { _recipient: ids[C] })).error).toBeNull();
  expect((await c[C]!.rpc('tellher_respond_trust', { _id: (await incoming(C))[0].connection_id, _accept: true })).error).toBeNull();
  const circle = (await c[A]!.rpc('tellher_my_circle')).data;
  expect(circle.filter((e: { kind: string }) => e.kind === 'direct').map((e: { first_name: string }) => e.first_name)).toEqual(['B']);
  expect((await c[A]!.rpc('tellher_extended_reach_count')).data).toBe(1);
 });
 it('blocks self trust and duplicate requests', async () => {
  expect((await c[A]!.rpc('tellher_send_trust', { _recipient: ids[A] })).error).not.toBeNull();
  expect((await c[A]!.rpc('tellher_send_trust', { _recipient: ids[B] })).error).not.toBeNull();
 });
 it('de-duplicates paths, excludes self, and ignores pending edges', async () => {
  await c[A]!.rpc('tellher_send_trust', { _recipient: ids[D] });
  await c[D]!.rpc('tellher_respond_trust', { _id: (await incoming(D))[0].connection_id, _accept: true });
  await c[D]!.rpc('tellher_send_trust', { _recipient: ids[C] });
  await c[C]!.rpc('tellher_respond_trust', { _id: (await incoming(C))[0].connection_id, _accept: true });
  await c[B]!.rpc('tellher_send_trust', { _recipient: ids[A] });
  await c[A]!.rpc('tellher_respond_trust', { _id: (await incoming(A))[0].connection_id, _accept: true });
  expect((await c[A]!.rpc('tellher_extended_reach_count')).data).toBe(1);
 });
 it('only the recipient can accept, and direct table writes are blocked', async () => {
  await c[C]!.rpc('tellher_send_trust', { _recipient: ids[D] });
  const id = (await incoming(D))[0].connection_id;
  expect((await c[C]!.rpc('tellher_respond_trust', { _id: id, _accept: true })).error).not.toBeNull();
  expect((await c[A]!.from('trust_connections').update({ status: 'accepted' }).eq('id', id).select()).data ?? []).toEqual([]);
  expect((await c[C]!.from('trust_connections').insert({ requester_id: ids[C], recipient_id: ids[B], status: 'accepted' })).error).not.toBeNull();
 });
});
