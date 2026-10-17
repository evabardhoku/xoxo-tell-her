import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('Trust Shelf notes', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = []; let noteId = '';
 const [A, B, U] = [0, 1, 2];
 const shelf = async (viewer: number) => ((await c[viewer]!.rpc('tellher_member_shelf', { _id: ids[A] })).data ?? []) as { kind: string; id: string; title: string }[];
 beforeAll(async () => {
  admin = createClient(url!, key!, { auth: { persistSession: false, storageKey: `test-${crypto.randomUUID()}` } });
  for (const n of ['Ana', 'Bea', 'Uma']) {
   const email = `tellher-tn-${n}-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: n, last_name: 'Test', woman_attested: true } });
   if (error || !data.user) throw error; ids.push(data.user.id);
   const client = createClient(url!, process.env['SUPABASE_PUBLISHABLE_KEY'] || key!, { auth: { persistSession: false, storageKey: `test-${crypto.randomUUID()}` } });
   const login = await client.auth.signInWithPassword({ email, password }); if (login.error) throw login.error; c.push(client);
  }
  // A and B trust each other; U is outside. A's profile stays Direct Circle only.
  const trust = await admin.from('trust_connections').insert([{ requester_id: ids[A], recipient_id: ids[B], status: 'accepted' }, { requester_id: ids[B], recipient_id: ids[A], status: 'accepted' }]); if (trust.error) throw trust.error;
  await c[A]!.from('trusted_picks').insert({ owner_id: ids[A], title: 'A calm dentist', category: 'Health & Care', note: 'Explains everything first.' });
 }, 60000);
 afterAll(async () => { await admin.from('trust_connections').delete().in('requester_id', ids); for (const id of ids) await admin.auth.admin.deleteUser(id); });

 it('author creates and edits her note', async () => {
  const { data, error } = await c[A]!.from('trust_notes').insert({ author_id: ids[A], title: 'Renting abroad', topic: 'Housing & Moving', body: 'Photograph every room on the first day.' }).select('id').single();
  expect(error).toBeNull(); noteId = data!.id;
  expect((await c[A]!.from('trust_notes').update({ title: 'Renting abroad, updated' }).eq('id', noteId).select('title').single()).data?.title).toBe('Renting abroad, updated');
 });
 it('cannot write a note under someone else’s name', async () => {
  expect((await c[B]!.from('trust_notes').insert({ author_id: ids[A], title: 'Fake note', topic: 'Work', body: 'This should never be allowed here.' })).error).not.toBeNull();
 });
 it('circle member sees notes and picks on the profile; outsider sees nothing', async () => {
  const s = await shelf(B);
  expect(s.find(r => r.kind === 'note')?.title).toBe('Renting abroad, updated');
  expect(s.some(r => r.kind === 'pick')).toBe(true);
  expect(await shelf(U)).toEqual([]);
  expect((await c[U]!.from('trust_notes').select('*').eq('id', noteId)).data).toEqual([]);
 });
 it('notes are search-ready', async () => {
  expect((await admin.from('trust_notes').select('id').textSearch('search', 'photograph', { config: 'simple' }).eq('id', noteId)).data).toHaveLength(1);
 });
 it('another member cannot edit or delete it; the author can delete', async () => {
  expect((await c[B]!.from('trust_notes').update({ title: 'Hijacked' }).eq('id', noteId).select()).data ?? []).toEqual([]);
  expect((await c[B]!.from('trust_notes').delete().eq('id', noteId).select()).data ?? []).toEqual([]);
  expect((await shelf(B)).find(r => r.kind === 'note')?.title).toBe('Renting abroad, updated');
  await c[A]!.from('trust_notes').delete().eq('id', noteId);
  expect((await shelf(B)).some(r => r.kind === 'note')).toBe(false);
 });
});
