import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { admitFixture } from './membership-fixture';

const url = process.env['SUPABASE_URL'];
const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('Recipient connection tiers', () => {
 let admin: SupabaseClient;
 const clients: SupabaseClient[] = []; const ids: string[] = [];
 const client = (i: number) => { const c = clients[i]; if (!c) throw new Error('Fixture missing'); return c; };
 const request = async (from: number, to: number) => {
  const sent = await client(from).rpc('tellher_send_trust', { _recipient: ids[to] }); if (sent.error) throw sent.error;
  const incoming = await client(to).rpc('tellher_my_circle'); if (incoming.error) throw incoming.error;
  const row = incoming.data.find((r: { kind: string; member_id: string }) => r.kind === 'incoming' && r.member_id === ids[from]);
  if (!row) throw new Error('Incoming request missing'); return row.connection_id;
 };
 beforeAll(async () => {
  if (!url || !key) throw new Error('Missing test environment');
  admin = createClient(url, key, { auth: { persistSession: false } });
  for (const name of ['TierAna', 'TierBea', 'TierCleo']) {
   const email = `tellher-tier-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const made = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: name, last_name: 'Test', woman_attested: true } });
   if (made.error || !made.data.user) throw made.error || new Error('User missing');
   ids.push(made.data.user.id); await admitFixture(admin, made.data.user.id);
   const c = createClient(url, process.env['SUPABASE_PUBLISHABLE_KEY'] || key, { auth: { persistSession: false } });
   const signed = await c.auth.signInWithPassword({ email, password }); if (signed.error) throw signed.error; clients.push(c);
   const profile = await c.from('profiles').update({ discoverability: 'extended' }).eq('id', made.data.user.id); if (profile.error) throw profile.error;
  }
 }, 60000);
 afterAll(async () => { for (const id of ids) { const result = await admin.auth.admin.deleteUser(id); if (result.error) throw result.error; } });
 it('recipient can accept Extended and both members see Extended, not Direct', async () => {
  const id = await request(0, 1);
  expect((await client(0).rpc('tellher_respond_trust_tier', { _id: id, _circle: 'direct' })).error).not.toBeNull();
  expect((await client(1).rpc('tellher_respond_trust_tier', { _id: id, _circle: 'extended' })).error).toBeNull();
  for (const [a,b] of [[0,1],[1,0]] as const) {
   const circle = await client(a).rpc('tellher_my_circle'); expect(circle.error).toBeNull();
   expect(circle.data).toEqual(expect.arrayContaining([expect.objectContaining({ member_id: ids[b], kind: 'extended' })]));
   expect((await client(a).rpc('tellher_extended_reach_count')).data).toBe(1);
   expect((await client(a).rpc('tellher_member_profile', { _id: ids[b] })).data?.[0]?.relation).toBe('extended');
  }
 });
 it('Extended never receives Direct-only messaging, tags or Ripple audience', async () => {
  expect((await client(0).rpc('tellher_can_message', { _member: ids[1] })).data).toBe(false);
  expect((await client(0).rpc('tellher_taggable')).data).toEqual([]);
  expect((await client(0).rpc('tellher_reach_preview', { _scope: 'circle' })).data).toBe(0);
  expect((await client(0).rpc('tellher_reach_preview', { _scope: 'extended' })).data).toBe(1);
  const disc = await client(1).from('profiles').update({ discoverability: 'direct' }).eq('id', ids[1]); expect(disc.error).toBeNull();
  expect((await client(0).rpc('tellher_member_profile', { _id: ids[1] })).data).toEqual([]);
 });
 it('recipient can accept Direct and both members get Direct connection', async () => {
  const id = await request(0, 2);
  expect((await client(2).rpc('tellher_respond_trust_tier', { _id: id, _circle: 'direct' })).error).toBeNull();
  for (const [a,b] of [[0,2],[2,0]] as const) {
   const circle = await client(a).rpc('tellher_my_circle'); expect(circle.error).toBeNull();
   expect(circle.data).toEqual(expect.arrayContaining([expect.objectContaining({ member_id: ids[b], kind: 'direct' })]));
   expect((await client(a).rpc('tellher_can_message', { _member: ids[b] })).data).toBe(true);
  }
 });
 it('invalid tiers, self requests, duplicates and anonymous writes are rejected', async () => {
  expect((await client(0).rpc('tellher_respond_trust_tier', { _id: crypto.randomUUID(), _circle: 'admin' })).error).not.toBeNull();
  expect((await client(0).rpc('tellher_send_trust', { _recipient: ids[0] })).error).not.toBeNull();
  expect((await client(0).rpc('tellher_send_trust', { _recipient: ids[1] })).error).not.toBeNull();
  if (!url || !key) throw new Error('Missing environment');
  const anon = createClient(url, process.env['SUPABASE_PUBLISHABLE_KEY'] || key, { auth: { persistSession: false } });
  expect((await anon.rpc('tellher_respond_trust_tier', { _id: crypto.randomUUID(), _circle: 'direct' })).error).not.toBeNull();
 });
});