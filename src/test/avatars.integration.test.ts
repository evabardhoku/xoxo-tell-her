import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
const pub = process.env['SUPABASE_PUBLISHABLE_KEY'] || key;
describe.skipIf(!url || !key)('Dual avatars', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = []; const qs: string[] = [];
 beforeAll(async () => {
  admin = createClient(url!, key!, { auth: { persistSession: false, storageKey: `test-${crypto.randomUUID()}` } });
  for (const first of ['AvatarOwner', 'AvatarViewer']) {
   const email = `avatar-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const r = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: first, last_name: 'Test', woman_attested: true } });
   if (r.error || !r.data.user) throw r.error; ids.push(r.data.user.id);
   const cl = createClient(url!, pub!, { auth: { persistSession: false, storageKey: `test-${crypto.randomUUID()}` } }); const l = await cl.auth.signInWithPassword({ email, password }); if (l.error) throw l.error; c.push(cl);
  }
  await admin.from('trust_connections').insert({ requester_id: ids[0], recipient_id: ids[1], status: 'accepted' });
  const u = await c[0]!.from('profiles').update({ open_avatar_type: 'illustrated', open_avatar_config: { skin: 2, hair: 1 }, anonymous_style_config: { silhouette: 1, palette: 2, hair: 0, accessory: 1, motif: 1 } }).eq('id', ids[0]); if (u.error) throw u.error;
  for (let i = 0; i < 6; i++) { const r = await c[0]!.rpc('tellher_publish_question_identity', { _category: 'Work', _body: `avatar anon question ${i}`, _scope: 'circle', _instinct: 'unsure', _note: null, _author_visibility: 'anonymous' }); if (r.error) throw r.error; qs.push(r.data); }
 }, 90000);
 afterAll(async () => { for (const q of qs) await c[0]!.rpc('tellher_delete_question', { _id: q }); await admin.from('trust_connections').delete().in('requester_id', ids); for (const id of ids) await admin.auth.admin.deleteUser(id); });

 it('anonymous avatar response has no user id or style config and nothing to link a profile', async () => {
  const r = await c[1]!.rpc('tellher_anonymous_avatars', { _ids: qs }); expect(r.error).toBeNull();
  const text = JSON.stringify(r.data);
  for (const s of [ids[0]!, 'AvatarOwner', 'member_id', 'profile_id', 'open_avatar']) expect(text).not.toContain(s);
  expect(Object.keys(r.data![0]!).sort()).toEqual(['avatar', 'question_id']);
 });
 it('different anonymous Ripples by the same woman get different variants', async () => {
  const r = await c[1]!.rpc('tellher_anonymous_avatars', { _ids: qs });
  expect(new Set(r.data!.map((x: { avatar: unknown }) => JSON.stringify(x.avatar))).size).toBe(qs.length);
 });
 it('the same Ripple keeps the same avatar after refresh', async () => {
  const a = await c[1]!.rpc('tellher_anonymous_avatars', { _ids: [qs[0]] }); const b = await c[1]!.rpc('tellher_anonymous_avatars', { _ids: [qs[0]] });
  expect(a.data).toEqual(b.data);
 });
 it('open avatar is visible to a circle member; anonymous style config is owner-only', async () => {
  const o = await c[1]!.rpc('tellher_open_avatars', { _ids: [ids[0]] });
  expect(o.data?.[0]).toMatchObject({ kind: 'illustrated', config: { skin: 2, hair: 1 } });
  expect(JSON.stringify(o.data)).not.toContain('silhouette');
  expect((await c[1]!.from('profiles').select('anonymous_style_config').eq('id', ids[0])).data).toEqual([]);
  expect((await c[0]!.from('profiles').select('anonymous_style_config').eq('id', ids[0])).data?.[0]?.anonymous_style_config).toMatchObject({ palette: 2 });
 });
});
