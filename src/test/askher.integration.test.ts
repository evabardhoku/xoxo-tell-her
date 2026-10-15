import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('AskHer Trust Ripples', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = []; const emails: string[] = []; const q: Record<string, string> = {};
 const [A, B, C, U] = [0, 1, 2, 3];
 beforeAll(async () => {
  admin = createClient(url!, key!, { auth: { persistSession: false } });
  for (const n of ['Ada', 'Bea', 'Cleo', 'Uma']) {
   const email = `tellher-ask-${n}-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: n, last_name: 'Secret', woman_attested: true } });
   if (error || !data.user) throw error; ids.push(data.user.id); emails.push(email);
   const client = createClient(url!, process.env['SUPABASE_PUBLISHABLE_KEY'] || key!, { auth: { persistSession: false } });
   await client.auth.signInWithPassword({ email, password }); c.push(client);
  }
  await admin.from('trust_connections').insert([{ requester_id: ids[A], recipient_id: ids[B], status: 'accepted' }, { requester_id: ids[B], recipient_id: ids[C], status: 'accepted' }, { requester_id: ids[B], recipient_id: ids[A], status: 'accepted' }]);
  for (const s of ['circle', 'extended', 'community']) {
   const { data, error } = await c[A]!.rpc('tellher_publish_question', { _category: 'Work', _body: `A ${s} question for testing`, _scope: s, _instinct: 'feels_off', _note: 'my private hunch' });
   if (error) throw error; q[s] = data as string;
  }
 }, 60000);
 afterAll(async () => { for (const id of Object.values(q)) await c[A]!.rpc('tellher_delete_question', { _id: id }); await admin.from('trust_connections').delete().in('requester_id', ids); for (const id of ids) await admin.auth.admin.deleteUser(id); });
 const feed = async (i: number) => ((await c[i]!.rpc('tellher_feed')).data ?? []) as { id: string }[];
 const sees = async (i: number, s: string) => (await feed(i)).some(r => r.id === q[s]);
 it('previews reach with de-duplicated two-layer count excluding the author', async () => {
  expect((await c[A]!.rpc('tellher_reach_preview', { _scope: 'circle' })).data).toBe(1);
  expect((await c[A]!.rpc('tellher_reach_preview', { _scope: 'extended' })).data).toBe(2);
 });
 it('direct-circle question reaches direct recipients only', async () => {
  expect(await sees(B, 'circle')).toBe(true); expect(await sees(C, 'circle')).toBe(false); expect(await sees(U, 'circle')).toBe(false);
 });
 it('extended question reaches 1-hop and 2-hop recipients only, with shortest distance', async () => {
  expect(await sees(B, 'extended')).toBe(true); expect(await sees(C, 'extended')).toBe(true); expect(await sees(U, 'extended')).toBe(false);
  const { data } = await admin.from('question_audience').select('recipient_id, trust_distance').eq('question_id', q['extended']!);
  expect(data?.sort((x, y) => x.trust_distance - y.trust_distance)).toEqual([{ recipient_id: ids[B], trust_distance: 1 }, { recipient_id: ids[C], trust_distance: 2 }]);
 });
 it('community question reaches any member', async () => { expect(await sees(U, 'community')).toBe(true); });
 it('never exposes author identity or instinct to others', async () => {
  const text = JSON.stringify(await feed(U)) + JSON.stringify(await feed(C));
  for (const leak of [ids[A]!, emails[A]!, 'Ada', 'Secret', 'my private hunch', 'feels_off']) expect(text).not.toContain(leak);
  expect((await c[U]!.from('question_private_meta').select('*').eq('question_id', q['community']!)).data).toEqual([]);
  expect((await c[U]!.from('questions').select('id').eq('id', q['community']!)).data).toEqual([]);
 });
 it('author sees her own instinct; others cannot delete; reports are recorded once', async () => {
  const mine = (await c[A]!.rpc('tellher_feed')).data?.find((r: { id: string }) => r.id === q['community']);
  expect(mine).toMatchObject({ is_mine: true, my_instinct: 'feels_off', my_note: 'my private hunch' });
  expect((await c[U]!.rpc('tellher_delete_question', { _id: q['community']! })).error).not.toBeNull();
  expect(await sees(U, 'community')).toBe(true);
  expect((await c[U]!.rpc('tellher_report_question', { _id: q['community']!, _reason: 'Spam or not genuine' })).error).toBeNull();
  expect((await c[U]!.rpc('tellher_report_question', { _id: q['community']!, _reason: 'Spam' })).error).not.toBeNull();
  expect((await c[U]!.rpc('tellher_report_question', { _id: q['circle']!, _reason: 'Spam' })).error).not.toBeNull();
 });
 it('author can delete her own question', async () => {
  expect((await c[A]!.rpc('tellher_delete_question', { _id: q['circle']! })).error).toBeNull();
  expect(await sees(B, 'circle')).toBe(false); delete q['circle'];
 });
});
