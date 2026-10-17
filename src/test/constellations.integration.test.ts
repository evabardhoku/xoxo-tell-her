import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('Constellations access', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = []; let circle = ''; let community = '';
 // 0 = author, 1 = Direct Circle, 2 = outsider
 beforeAll(async () => {
  if (!url || !key) throw new Error('Missing test configuration');
  admin = createClient(url, key, { auth: { persistSession: false, storageKey: `sky-admin-${crypto.randomUUID()}` } });
  for (const n of ['Ana', 'Bo', 'Cy']) {
   const email = `tellher-sky-${n}-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: n, last_name: 'Hidden', woman_attested: true } });
   if (error || !data.user) throw error; ids.push(data.user.id);
   const cl = createClient(url, process.env['SUPABASE_PUBLISHABLE_KEY'] || key, { auth: { persistSession: false, storageKey: `sky-member-${data.user.id}` } });
   const login = await cl.auth.signInWithPassword({ email, password }); if (login.error) throw login.error; c.push(cl);
  }
  const connection = await admin.from('trust_connections').insert({ requester_id: ids[0], recipient_id: ids[1], status: 'accepted' }); if (connection.error) throw connection.error;
  const author = c[0]; if (!author) throw new Error('Missing author client');
  const direct = await author.rpc('tellher_publish_question', { _category: 'Work', _body: 'Sky circle question', _scope: 'circle', _instinct: 'unsure', _note: 'sky secret' });
  if (direct.error || !direct.data) throw direct.error ?? new Error('Circle question was not published'); circle = direct.data;
  const publicQuestion = await author.rpc('tellher_publish_question', { _category: 'Travel', _body: 'Sky community question', _scope: 'community', _instinct: 'unsure', _note: null });
  if (publicQuestion.error || !publicQuestion.data) throw publicQuestion.error ?? new Error('Community question was not published'); community = publicQuestion.data;
  const outcome = await author.rpc('tellher_set_outcome', { _q: circle, _status: 'other', _summary: 'private sky outcome', _note: '', _shared: false }); if (outcome.error) throw outcome.error;
 }, 60000);
 afterAll(async () => { const author = c[0]; for (const q of [circle, community]) if (q && author) await author.rpc('tellher_delete_question', { _id: q }); if (!admin) return; for (const id of ids) await admin.auth.admin.deleteUser(id); });
 const sky = async (i: number) => { const client = c[i]; if (!client) throw new Error('Missing viewer'); const result = await client.rpc('tellher_constellation'); if (result.error) throw result.error; return (result.data ?? []) as { id: string; has_outcome: boolean; echo_level: number }[]; };

 it('shows only Ripples the viewer can open, with no author identity', async () => {
  const out = await sky(2); expect(out.some(s => s.id === circle)).toBe(false); expect(out.some(s => s.id === community)).toBe(true);
  const inner = await sky(1); expect(inner.some(s => s.id === circle)).toBe(true);
  const text = JSON.stringify(inner); for (const leak of [...ids, 'Ana', 'Hidden', 'sky secret']) expect(text).not.toContain(leak);
 });
 it('private outcomes only light up for the author; small echo counts stay coarse', async () => {
  expect((await sky(0)).find(s => s.id === circle)?.has_outcome).toBe(true);
  expect((await sky(1)).find(s => s.id === circle)?.has_outcome).toBe(false);
  const outsider = c[2]; if (!outsider) throw new Error('Missing outsider'); const echo = await outsider.rpc('tellher_echo', { _id: community }); if (echo.error) throw echo.error;
  expect((await sky(1)).find(s => s.id === community)?.echo_level).toBe(1);
 });
});
