import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env['SUPABASE_URL'];
const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
const publishable = process.env['SUPABASE_PUBLISHABLE_KEY'] || key;

describe.skipIf(!url || !key || !publishable)('Profile ripples and private Wingwoman stars', () => {
 let admin: SupabaseClient;
 const clients: SupabaseClient[] = [];
 const ids: string[] = [];
 const questions: string[] = [];
 const named: Record<string, string> = {};
 let star = '';
 function client(i: number) { const c = clients[i]; if (!c) throw new Error('Missing member fixture'); return c; }
 async function ripples(i: number) {
  const r = await client(i).rpc('tellher_member_ripples', { _member: ids[0] });
  if (r.error) throw r.error;
  return r.data as { id: string; body: string }[];
 }
 beforeAll(async () => {
  if (!url || !key || !publishable) throw new Error('Test access unavailable');
  admin = createClient(url, key, { auth: { persistSession: false } });
  for (const first_name of ['ProfileAuthor', 'DirectViewer', 'ExtendedViewer', 'CommunityViewer']) {
   const email = `profile-discussions-${crypto.randomUUID()}@example.com`;
   const password = crypto.randomUUID();
   const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name, last_name: 'Fixture', woman_attested: true } });
   if (created.error || !created.data.user) throw created.error || new Error('No fixture user');
   ids.push(created.data.user.id);
   const c = createClient(url, publishable, { auth: { persistSession: false } });
   const login = await c.auth.signInWithPassword({ email, password });
   if (login.error) throw login.error;
   clients.push(c);
  }
  const profile = await admin.from('profiles').update({ discoverability: 'community' }).eq('id', ids[0]);
  if (profile.error) throw profile.error;
  const trust = await admin.from('trust_connections').insert([
   { requester_id: ids[0], recipient_id: ids[1], status: 'accepted' },
   { requester_id: ids[1], recipient_id: ids[2], status: 'accepted' },
  ]);
  if (trust.error) throw trust.error;
  for (const scope of ['circle', 'extended', 'community']) {
   const r = await client(0).rpc('tellher_publish_question_identity', { _category: 'Work', _body: `Profile visibility fixture for ${scope}`, _scope: scope, _instinct: 'unsure', _note: 'PRIVATE_INSTINCT', _author_visibility: 'named' });
   if (r.error) throw r.error;
   named[scope] = r.data; questions.push(r.data);
  }
  const anonymous = await client(0).rpc('tellher_publish_question_identity', { _category: 'Work', _body: 'PRIVATE_STAR_OWNER_INDEX', _scope: 'community', _instinct: 'unsure', _note: null, _author_visibility: 'anonymous' });
  if (anonymous.error) throw anonymous.error;
  star = anonymous.data; questions.push(star);
 }, 90000);
 afterAll(async () => {
  for (const q of questions) { const r = await client(0).rpc('tellher_delete_question', { _id: q }); if (r.error) throw r.error; }
  if (!ids.length) return;
  const trust = await admin.from('trust_connections').delete().in('requester_id', ids);
  if (trust.error) throw trust.error;
  for (const id of ids) { const r = await admin.auth.admin.deleteUser(id); if (r.error) throw r.error; }
 });
 it('Direct Circle can see all three named publication reaches', async () => {
  expect((await ripples(1)).map(q => q.id).sort()).toEqual(Object.values(named).sort());
 });
 it('Extended Circle sees extended and community, never direct-only', async () => {
  expect((await ripples(2)).map(q => q.id).sort()).toEqual([named['extended'], named['community']].sort());
 });
 it('Open community sees community only even when the profile is accessible', async () => {
  const profile = await client(3).rpc('tellher_member_profile', { _id: ids[0] });
  expect(profile.error).toBeNull(); expect(profile.data).toHaveLength(1);
  expect((await ripples(3)).map(q => q.id)).toEqual([named['community']]);
 });
 it('No profile, including the owner profile, associates anonymous stars or private instincts with the author', async () => {
  for (let i = 0; i < 4; i++) {
   const rows = await ripples(i);
   expect(rows.map(q => q.id)).not.toContain(star);
   const text = JSON.stringify(rows);
   for (const secret of ['PRIVATE_STAR_OWNER_INDEX', 'PRIVATE_INSTINCT', 'owner_id', 'my_instinct', 'my_note']) expect(text).not.toContain(secret);
  }
 });
 it('Wingwoman index reads only the caller’s own stars, not named ripples or another member’s stars', async () => {
  const own = await client(0).rpc('tellher_my_stars');
  expect(own.error).toBeNull(); expect(own.data.map((q: { id: string }) => q.id)).toEqual([star]);
  for (const i of [1, 2, 3]) { const other = await client(i).rpc('tellher_my_stars'); expect(other.error).toBeNull(); expect(other.data).toEqual([]); }
 });
 it('Both indexes reject signed-out callers', async () => {
  if (!url || !publishable) throw new Error('Test access unavailable');
  const signedOut = createClient(url, publishable, { auth: { persistSession: false } });
  expect((await signedOut.rpc('tellher_member_ripples', { _member: ids[0] })).error).not.toBeNull();
  expect((await signedOut.rpc('tellher_my_stars')).error).not.toBeNull();
 });
});