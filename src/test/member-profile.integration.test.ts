import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('Safe member profiles', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = []; const emails: string[] = [];
 const [A, B, C, U] = [0, 1, 2, 3];
 const view = async (viewer: number, target: number) => ((await c[viewer]!.rpc('tellher_member_profile', { _id: ids[target] })).data ?? [])[0];
 const setDisc = (i: number, d: string) => admin.from('profiles').update({ discoverability: d }).eq('id', ids[i]);
 beforeAll(async () => {
  admin = createClient(url!, key!, { auth: { persistSession: false } });
  for (const n of ['Ana', 'Bea', 'Cleo', 'Uma']) {
   const email = `tellher-mp-${n}-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: n, last_name: 'Surname', woman_attested: true } });
   if (error || !data.user) throw error; ids.push(data.user.id); emails.push(email);
   const client = createClient(url!, process.env['SUPABASE_PUBLISHABLE_KEY'] || key!, { auth: { persistSession: false } });
   await client.auth.signInWithPassword({ email, password }); c.push(client);
  }
  // Mutual A<->B, mutual B<->C. A and C are not connected. U is outside.
  await admin.from('trust_connections').insert([[A, B], [B, A], [B, C], [C, B]].map(([r, t]) => ({ requester_id: ids[r!], recipient_id: ids[t!], status: 'accepted' })));
  await admin.from('profiles').update({ bio: 'Hello', known_for: ['Renting'], avatar_path: null }).eq('id', ids[C]);
 }, 60000);
 afterAll(async () => { await admin.from('trust_connections').delete().in('requester_id', ids); for (const id of ids) await admin.auth.admin.deleteUser(id); });

 it('defaults to Direct Circle only', async () => {
  expect((await admin.from('profiles').select('discoverability').eq('id', ids[A]).single()).data?.discoverability).toBe('direct');
 });
 it('Direct Circle only: her circle sees it, extended and community do not', async () => {
  await setDisc(C, 'direct');
  expect(await view(B, C)).toMatchObject({ first_name: 'Cleo', last_name: 'Surname', relation: 'direct', bio: 'Hello', known_for: ['Renting'] });
  expect(await view(A, C)).toBeUndefined(); expect(await view(U, C)).toBeUndefined();
 });
 it('Direct + Extended: second-degree viewer sees initial only, with "via" context; community still blocked', async () => {
  await setDisc(C, 'extended');
  expect(await view(A, C)).toMatchObject({ first_name: 'Cleo', last_name: 'S', relation: 'extended', via: 'Bea' });
  expect(await view(U, C)).toBeUndefined();
 });
 it('Community: any member sees it', async () => {
  await setDisc(C, 'community');
  expect(await view(U, C)).toMatchObject({ relation: 'community', via: null });
 });
 it('never returns email, ids, avatar path or private fields; raw profiles stay owner-only', async () => {
  const text = JSON.stringify(await view(U, C));
  for (const leak of [emails[C]!, ids[C]!, 'avatar_path', 'woman_attested', 'discoverability']) expect(text).not.toContain(leak);
  expect((await c[U]!.from('profiles').select('*').eq('id', ids[C])).data).toEqual([]);
  expect((await c[B]!.from('profiles').select('*').eq('id', ids[C])).data).toEqual([]);
 });
 it('tampered or unknown ids return nothing; members cannot change others\u2019 settings', async () => {
  expect((await c[U]!.rpc('tellher_member_profile', { _id: crypto.randomUUID() })).data).toEqual([]);
  await c[U]!.from('profiles').update({ discoverability: 'community' }).eq('id', ids[A]);
  expect(await view(U, A)).toBeUndefined();
 });
 it('rejects oversized tag lists', async () => {
  const { error } = await c[A]!.from('profiles').update({ known_for: Array.from({ length: 9 }, (_, i) => `t${i}`) }).eq('id', ids[A]);
  expect(error).not.toBeNull();
 });
});
