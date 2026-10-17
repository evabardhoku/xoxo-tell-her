import { admitFixture } from './membership-fixture';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('Extended Circle discovery', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = [];
 const [A, B, C, D] = [0, 1, 2, 3];
 const ext = async (v = A) => ((await c[v]!.rpc('tellher_extended_circle')).data ?? []) as { member_id: string; first_name: string; via: string; bridge_pending: boolean }[];
 const trust = async (a: number, b: number) => { await c[a]!.rpc('tellher_send_trust', { _recipient: ids[b] }); const { data } = await c[b]!.rpc('tellher_my_circle'); const r = (data as { connection_id: string; kind: string; member_id: string }[]).find(x => x.kind === 'incoming' && x.member_id === ids[a])!; await c[b]!.rpc('tellher_respond_trust', { _id: r.connection_id, _accept: true }); };
 beforeAll(async () => {
  admin = createClient(url!, key!, { auth: { persistSession: false } });
  for (const n of ['Ada', 'Bea', 'Cleo', 'Dina']) {
   const email = `tellher-ext-${n}-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: n, last_name: 'Test', woman_attested: true } });
   if (error || !data.user) throw error; ids.push(data.user.id); await admitFixture(admin, data.user.id);
   const cl = createClient(url!, process.env['SUPABASE_PUBLISHABLE_KEY'] || key!, { auth: { persistSession: false } });
   await cl.auth.signInWithPassword({ email, password }); c.push(cl);
  }
  await trust(A, B); await trust(B, C); await trust(A, D); await trust(D, C);
 }, 60000);
 afterAll(async () => { await admin.from('trust_connections').delete().or(ids.map(i => `requester_id.eq.${i}`).join(',')); for (const i of ids) await admin.auth.admin.deleteUser(i); });

 it('hides a second-degree member who does not allow Extended discovery', async () => {
  await c[C]!.from('profiles').update({ discoverability: 'direct' }).eq('id', ids[C]);
  expect((await ext()).map(m => m.member_id)).not.toContain(ids[C]);
  expect((await c[A]!.rpc('tellher_member_profile', { _id: ids[C] })).data).toHaveLength(0);
  expect((await c[A]!.rpc('tellher_extended_reach_count')).data).toBe(1);
 });
 it('shows a discoverable second-degree member once, with one path, and moves her to Direct after a Trust Bridge', async () => {
  await c[C]!.from('profiles').update({ discoverability: 'extended' }).eq('id', ids[C]);
  const list = await ext(); const cleo = list.filter(m => m.member_id === ids[C]);
  expect(cleo).toHaveLength(1); expect(['Bea', 'Dina']).toContain(cleo[0]!.via);
  expect(list.map(m => m.member_id)).not.toContain(ids[B]);
  expect((await c[A]!.rpc('tellher_extended_circle', { _via: ids[D] })).data?.[0]?.via).toBe('Dina');
  await c[A]!.rpc('tellher_send_trust', { _recipient: ids[C] });
  expect((await ext()).find(m => m.member_id === ids[C])?.bridge_pending).toBe(true);
  const { data } = await c[C]!.rpc('tellher_my_circle'); const r = (data as { connection_id: string; kind: string; member_id: string }[]).find(x => x.kind === 'incoming' && x.member_id === ids[A])!;
  await c[C]!.rpc('tellher_respond_trust', { _id: r.connection_id, _accept: true });
  expect((await ext()).map(m => m.member_id)).not.toContain(ids[C]);
  const circle = (await c[A]!.rpc('tellher_my_circle')).data as { kind: string; member_id: string }[];
  expect(circle.some(x => x.kind === 'direct' && x.member_id === ids[C])).toBe(true);
  expect((await c[A]!.rpc('tellher_extended_reach_count')).data).toBe(0);
 });
});
