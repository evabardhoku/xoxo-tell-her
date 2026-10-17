import { admitFixture } from './membership-fixture';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { tally } from '@/lib/perspectives';

const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
const tags = ['address', 'watch_wait', 'more_context', 'been_there'];
describe.skipIf(!url || !key)('Replies and Perspective Map', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = []; let community = ''; let circle = '';
 // 0 = author, 1..4 = community repliers, 5 = outsider for circle question
 beforeAll(async () => {
  admin = createClient(url!, key!, { auth: { persistSession: false } });
  for (const n of ['Ana', 'Bo', 'Cy', 'Di', 'Ed', 'Fi']) {
   const email = `tellher-pm-${n}-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: n, last_name: 'Hidden', woman_attested: true } });
   if (error || !data.user) throw error; ids.push(data.user.id); await admitFixture(admin, data.user.id);
   const cl = createClient(url!, process.env['SUPABASE_PUBLISHABLE_KEY'] || key!, { auth: { persistSession: false } });
   await cl.auth.signInWithPassword({ email, password }); c.push(cl);
  }
  await admin.from('trust_connections').insert({ requester_id: ids[0], recipient_id: ids[1], status: 'accepted' });
  community = (await c[0]!.rpc('tellher_publish_question', { _category: 'Work', _body: 'Community question for maps', _scope: 'community', _instinct: 'unsure', _note: 'secret hunch' })).data as string;
  circle = (await c[0]!.rpc('tellher_publish_question', { _category: 'Work', _body: 'Circle question for maps', _scope: 'circle', _instinct: 'feels_off', _note: null })).data as string;
 }, 60000);
 afterAll(async () => { for (const q of [community, circle]) if (q) await c[0]!.rpc('tellher_delete_question', { _id: q }); await admin.from('trust_connections').delete().in('requester_id', ids); for (const id of ids) await admin.auth.admin.deleteUser(id); });

 it('eligible members post each perspective type and counts persist', async () => {
  for (let i = 0; i < 4; i++) expect((await c[i + 1]!.rpc('tellher_post_reply', { _id: community, _tag: tags[i], _body: `View ${i}` })).error).toBeNull();
  const fresh = createClient(url!, key!, { auth: { persistSession: false } });
  const { data } = await fresh.from('replies').select('perspective_tag').eq('question_id', community);
  expect(tally(data ?? [])).toEqual({ address: 1, watch_wait: 1, more_context: 1, been_there: 1 });
  const viewer = (await c[5]!.rpc('tellher_replies', { _id: community })).data ?? [];
  expect(tally(viewer)).toEqual({ address: 1, watch_wait: 1, more_context: 1, been_there: 1 });
 });
 it('rejects unknown tags, duplicate replies, and author self-replies', async () => {
  expect((await c[5]!.rpc('tellher_post_reply', { _id: community, _tag: 'agree', _body: 'Hi there' })).error).not.toBeNull();
  expect((await c[1]!.rpc('tellher_post_reply', { _id: community, _tag: 'address', _body: 'Again' })).error).not.toBeNull();
  expect((await c[0]!.rpc('tellher_post_reply', { _id: community, _tag: 'address', _body: 'Mine' })).error).not.toBeNull();
 });
 it('author sees private instinct; others do not', async () => {
  expect((await c[0]!.rpc('tellher_question', { _id: community })).data?.[0]).toMatchObject({ is_mine: true, my_instinct: 'unsure', my_note: 'secret hunch' });
  const other = (await c[2]!.rpc('tellher_question', { _id: community })).data?.[0];
  expect(other).toMatchObject({ is_mine: false, my_instinct: null, my_note: null });
 });
 it('never exposes author or reply-author identity', async () => {
  const text = JSON.stringify((await c[5]!.rpc('tellher_question', { _id: community })).data) + JSON.stringify((await c[5]!.rpc('tellher_replies', { _id: community })).data);
  for (const leak of [...ids, 'Ana', 'Bo', 'Hidden', 'secret hunch']) expect(text).not.toContain(leak);
 });
 it('blocks non-recipients from a circle question by direct ID', async () => {
  expect((await c[5]!.rpc('tellher_question', { _id: circle })).data).toEqual([]);
  expect((await c[5]!.rpc('tellher_replies', { _id: circle })).error).not.toBeNull();
  expect((await c[5]!.rpc('tellher_post_reply', { _id: circle, _tag: 'address', _body: 'Sneaky' })).error).not.toBeNull();
  expect((await c[1]!.rpc('tellher_question', { _id: circle })).data).toHaveLength(1);
 });
 it('members delete only their own reply', async () => {
  const rows = ((await c[1]!.rpc('tellher_replies', { _id: community })).data ?? []) as { id: string; is_mine: boolean }[];
  const mine = rows.find(r => r.is_mine)!; const theirs = rows.find(r => !r.is_mine)!;
  expect((await c[1]!.rpc('tellher_delete_reply', { _id: theirs.id })).error).not.toBeNull();
  expect((await c[1]!.from('replies').update({ body: 'edited' }).eq('id', theirs.id).select()).data ?? []).toEqual([]);
  expect((await c[1]!.rpc('tellher_delete_reply', { _id: mine.id })).error).toBeNull();
  expect(tally((await c[5]!.rpc('tellher_replies', { _id: community })).data ?? [])).toEqual({ address: 0, watch_wait: 1, more_context: 1, been_there: 1 });
 });
});
