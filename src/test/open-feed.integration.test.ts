import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
const pub = process.env['SUPABASE_PUBLISHABLE_KEY'] || key;
describe.skipIf(!url || !key)('My Feed: open Ripples, audiences, named comments and likes', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = []; const qs: Record<string, string> = {};
 const names = ['OpenAuthor', 'DirectFriend', 'ExtendedFriend', 'CommunityMember'].map(n => n + crypto.randomUUID().slice(0, 4));
 const feedIds = async (i: number) => { const r = await c[i]!.rpc('tellher_feed'); if (r.error) throw r.error; return (r.data as { id: string }[]).map(x => x.id); };
 beforeAll(async () => {
  admin = createClient(url!, key!, { auth: { persistSession: false } });
  for (const first of names) {
   const email = `openfeed-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const r = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: first, last_name: 'Test', woman_attested: true } });
   if (r.error || !r.data.user) throw r.error; ids.push(r.data.user.id);
   const cl = createClient(url!, pub!, { auth: { persistSession: false } }); const l = await cl.auth.signInWithPassword({ email, password }); if (l.error) throw l.error; c.push(cl);
  }
  const pair = (a: number, b: number) => [{ requester_id: ids[a], recipient_id: ids[b], status: 'accepted' }];
  const t = await admin.from('trust_connections').insert([...pair(0, 1), ...pair(1, 2)]); if (t.error) throw t.error;
  for (const [k, scope, vis] of [['circle', 'circle', 'named'], ['extended', 'extended', 'named'], ['community', 'community', 'named'], ['anon', 'community', 'anonymous']] as const) {
   const r = await c[0]!.rpc('tellher_publish_question_identity', { _category: 'Travel', _body: `openfeed ${k} question`, _scope: scope, _instinct: 'unsure', _note: null, _author_visibility: vis });
   if (r.error) throw r.error; qs[k] = r.data;
  }
 }, 90000);
 afterAll(async () => { for (const q of Object.values(qs)) await c[0]!.rpc('tellher_delete_question', { _id: q }); await admin.from('trust_connections').delete().in('requester_id', ids); for (const id of ids) await admin.auth.admin.deleteUser(id); });

 it('Direct Circle sees the circle Ripple, labelled My Circle', async () => {
  expect(await feedIds(1)).toEqual(expect.arrayContaining([qs.circle, qs.extended, qs.community]));
  const ctx = await c[1]!.rpc('tellher_open_feed_context', { _ids: [qs.circle] }); expect(ctx.data?.[0]?.relation).toBe('circle');
 });
 it('Extended Circle sees extended but not circle, with the bridging name', async () => {
  const f = await feedIds(2); expect(f).toContain(qs.extended); expect(f).not.toContain(qs.circle);
  const ctx = await c[2]!.rpc('tellher_open_feed_context', { _ids: [qs.extended] }); expect(ctx.data?.[0]).toMatchObject({ relation: 'extended', via_name: names[1] });
 });
 it('Community member sees only the community Ripple', async () => {
  const f = await feedIds(3); expect(f).toContain(qs.community); expect(f).not.toContain(qs.circle); expect(f).not.toContain(qs.extended);
 });
 it('unauthorized readers cannot load comments of a Ripple outside their audience', async () => {
  expect((await c[3]!.rpc('tellher_open_comments', { _id: qs.circle })).error).not.toBeNull();
  expect((await c[3]!.rpc('tellher_post_open_comment', { _id: qs.circle, _body: 'hi' })).error).not.toBeNull();
  const anon = createClient(url!, pub!, { auth: { persistSession: false } });
  expect((await anon.rpc('tellher_open_comments', { _id: qs.community })).error).not.toBeNull();
 });
 it('anonymous Ripples take no named comments and get no open context', async () => {
  expect((await c[1]!.rpc('tellher_post_open_comment', { _id: qs.anon, _body: 'hello' })).error).not.toBeNull();
  expect((await c[1]!.rpc('tellher_open_feed_context', { _ids: [qs.anon] })).data).toEqual([]);
 });
 it('open Ripples refuse anonymous perspectives', async () => {
  expect((await c[1]!.rpc('tellher_post_reply', { _id: qs.community, _tag: 'address', _body: 'anon try' })).error?.message).toContain('named comments');
 });
 it('comments are named with a profile link, likes work and duplicates do not count twice', async () => {
  const p = await c[1]!.rpc('tellher_post_open_comment', { _id: qs.community, _body: 'Go in spring!' }); expect(p.error).toBeNull();
  const own = await c[0]!.rpc('tellher_post_open_comment', { _id: qs.community, _body: 'Thank you' }); expect(own.error).toBeNull();
  const list = await c[0]!.rpc('tellher_open_comments', { _id: qs.community });
  const friend = list.data!.find((r: { body: string }) => r.body === 'Go in spring!')!;
  const safe = (await c[0]!.rpc('tellher_member_profile', { _id: ids[1] })).data?.[0];
  expect(friend).toMatchObject({ first_name: names[1], profile_id: safe ? ids[1] : null }); // link only when her safe profile is viewable
  await c[0]!.rpc('tellher_like_reply', { _reply: friend.id }); await c[0]!.rpc('tellher_like_reply', { _reply: friend.id });
  const after = await c[3]!.rpc('tellher_open_comments', { _id: qs.community });
  expect(after.data!.find((r: { id: string }) => r.id === friend.id)?.likes).toBe(1);
  const dup = await admin.from('reply_likes').insert({ reply_id: friend.id, member_id: ids[0] }); expect(dup.error).not.toBeNull();
 });
});
