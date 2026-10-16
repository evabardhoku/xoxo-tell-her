import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('Independent Ripple reach and identity', () => {
 let admin: SupabaseClient; const clients: SupabaseClient[] = []; const ids: string[] = []; const questions: string[] = [];
 let anonymous = ''; let named = ''; let legacy = ''; let restricted = '';
 const name = `Identity${crypto.randomUUID().slice(0, 6)}`;
 const client = (i: number) => { const c = clients[i]; if (!c) throw new Error('Missing test member'); return c; };
 const identity = async (q: string, who = 1) => { const r = await client(who).rpc('tellher_ripple_identities', { _ids: [q] }); if (r.error) throw r.error; return r.data?.[0]; };
 const publish = async (scope: string, visibility?: string) => {
  const body = `${name}testtoken practical question ${questions.length}`;
  const args = { _category: 'Work', _body: body, _scope: scope, _instinct: 'unsure', _note: 'PRIVATE_INSTINCT_TOKEN' };
  const r = visibility ? await client(0).rpc('tellher_publish_question_identity', { ...args, _author_visibility: visibility }) : await client(0).rpc('tellher_publish_question', args);
  if (r.error) throw r.error; questions.push(r.data); return r.data as string;
 };
 beforeAll(async () => {
  if (!url || !key) throw new Error('Test access unavailable');
  admin = createClient(url, key, { auth: { persistSession: false } });
  for (const first of [name, 'ResponderPrivate', 'OutsidePrivate']) {
   const email = `identity-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const r = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: first, last_name: 'PrivateSurname', woman_attested: true } });
   if (r.error || !r.data.user) throw r.error; ids.push(r.data.user.id);
   const c = createClient(url, process.env['SUPABASE_PUBLISHABLE_KEY'] || key, { auth: { persistSession: false } });
   const login = await c.auth.signInWithPassword({ email, password }); if (login.error) throw login.error; clients.push(c);
  }
  const trust = await admin.from('trust_connections').insert([{ requester_id: ids[0], recipient_id: ids[1], status: 'accepted' }, { requester_id: ids[1], recipient_id: ids[0], status: 'accepted' }]); if (trust.error) throw trust.error;
  anonymous = await publish('community', 'anonymous'); named = await publish('community', 'named'); legacy = await publish('community'); restricted = await publish('circle', 'named');
 }, 60000);
 afterAll(async () => {
  for (const q of questions) await client(0).rpc('tellher_delete_question', { _id: q });
  if (ids.length) { await admin.from('trust_connections').delete().in('requester_id', ids); for (const id of ids) await admin.auth.admin.deleteUser(id); }
 });
 it('anonymous author representation contains no name, profile id or avatar', async () => {
  expect(await identity(anonymous)).toEqual({ question_id: anonymous, author_visibility: 'anonymous', first_name: null, profile_id: null, has_avatar: false });
 });
 it('named identity is safe while restrictive profile remains inaccessible', async () => {
  expect(await identity(named, 2)).toEqual({ question_id: named, author_visibility: 'named', first_name: name, profile_id: null, has_avatar: false });
  expect((await client(2).rpc('tellher_member_profile', { _id: ids[0] })).data).toEqual([]);
  expect(await identity(named)).toMatchObject({ first_name: name, profile_id: ids[0] });
 });
 it('identity never broadens circle reach', async () => { expect(await identity(restricted, 2)).toBeUndefined(); expect(await identity(restricted)).toMatchObject({ author_visibility: 'named' }); });
 it('old publication path defaults to anonymous', async () => { expect(await identity(legacy)).toMatchObject({ author_visibility: 'anonymous', first_name: null, profile_id: null }); });
 it('client and privileged updates cannot change published identity in either direction', async () => {
  for (const [q, change, original] of [[anonymous, 'named', 'anonymous'], [named, 'anonymous', 'named']] as const) {
   await client(0).from('questions').update({ author_visibility: change }).eq('id', q);
   expect((await admin.from('questions').update({ author_visibility: change }).eq('id', q)).error?.message).toContain('locked');
   expect((await identity(q)).author_visibility).toBe(original);
  }
 });
 it('anonymous APIs, direct rows, search, sky and notifications never resolve ownership', async () => {
  const detail = await client(1).rpc('tellher_question', { _id: anonymous });
  const feed = await client(1).rpc('tellher_feed'); const sky = await client(1).rpc('tellher_constellation');
  const search = await client(1).rpc('tellher_search', { _q: 'testtoken' });
  for (const r of [detail, feed, sky, search]) expect(r.error).toBeNull();
  const rows = [detail.data?.[0], feed.data?.find((r: { id: string }) => r.id === anonymous), sky.data?.find((r: { id: string }) => r.id === anonymous), search.data?.find((r: { id: string }) => r.id === anonymous)];
  const text = JSON.stringify(rows);
  for (const secret of [ids[0], 'PrivateSurname', 'PRIVATE_INSTINCT_TOKEN', 'owner_id', 'avatar_path']) expect(text).not.toContain(secret);
  expect(search.data?.find((r: { id: string }) => r.id === anonymous)).toMatchObject({ member_name: null, member_id: null });
  expect((await client(1).from('question_private_meta').select('*').eq('question_id', anonymous)).data).toEqual([]);
  expect((await client(1).from('questions').select('*').eq('id', anonymous)).data).toEqual([]);
  const notifications = await client(1).rpc('tellher_notifications'); expect(notifications.error).toBeNull(); expect(JSON.stringify(notifications.data)).not.toContain(name);
 });
 it('replies and echo identities remain anonymous on both models; first-letter notifications remain generic', async () => {
  for (const q of [anonymous, named]) {
   const reply = await client(1).rpc('tellher_post_reply_tagged', { _id: q, _tag: 'more_context', _body: 'I would compare the weekly workload and costs.', _mentions: [] }); expect(reply.error).toBeNull();
   const replies = await client(2).rpc('tellher_replies', { _id: q }); expect(replies.error).toBeNull();
   expect(replies.data).toHaveLength(1); for (const secret of [ids[1], 'ResponderPrivate', 'author_id']) expect(JSON.stringify(replies.data)).not.toContain(secret);
   expect((await client(1).rpc('tellher_echo', { _id: q })).error).toBeNull();
   const signal = await client(2).rpc('tellher_echo_signal', { _id: q }); expect(signal.error).toBeNull(); expect(signal.data?.[0]).toMatchObject({ below_threshold: true });
   expect((await client(1).rpc('tellher_write_letter', { _q: q, _body: 'You can give yourself time to compare both paths.', _where_now: 'Still learning' })).error).toBeNull();
   const letters = await client(2).rpc('tellher_letters', { _q: q }); expect(letters.error).toBeNull(); expect(letters.data).toHaveLength(1); expect(JSON.stringify(letters.data)).not.toContain(ids[1]);
  }
  const n = await client(0).rpc('tellher_notifications'); expect(n.error).toBeNull(); expect(n.data?.length).toBeGreaterThan(0); expect(JSON.stringify(n.data)).not.toContain('ResponderPrivate');
 });
});
