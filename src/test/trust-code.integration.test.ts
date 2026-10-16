import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
type R = { status: string; first_name: string | null };
describe.skipIf(!url || !key)('Trust Code', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = [];
 beforeAll(async () => {
  admin = createClient(url!, key!, { auth: { persistSession: false } });
  for (const n of ['Eva', 'Sara', 'Giulia', 'Maya', 'Lia', 'Noa', 'Zoe', 'Ida']) {
   const email = `tellher-tc-${n}-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: n, last_name: 'Test', woman_attested: true } });
   if (error || !data.user) throw error; ids.push(data.user.id);
   const cl = createClient(url!, process.env['SUPABASE_PUBLISHABLE_KEY'] || key!, { auth: { persistSession: false } });
   await cl.auth.signInWithPassword({ email, password }); c.push(cl);
  }
 }, 90000);
 afterAll(async () => { await admin.from('trust_connections').delete().or(`requester_id.in.(${ids}),recipient_id.in.(${ids})`); await admin.from('member_blocks').delete().in('blocker_id', ids); for (const id of ids) await admin.auth.admin.deleteUser(id); });
 const make = async (i: number, group = false) => (await c[i]!.rpc('tellher_create_trust_code', { _group: group })).data[0] as { id: string; code: string; max_uses: number; expires_at: string };
 const redeem = async (i: number, code: string) => ((await c[i]!.rpc('tellher_redeem_trust_code', { _code: code })).data as R[])[0]!;
 const pair = async (a: number, b: number) => (await admin.from('trust_connections').select('status').or(`and(requester_id.eq.${ids[a]},recipient_id.eq.${ids[b]}),and(requester_id.eq.${ids[b]},recipient_id.eq.${ids[a]})`)).data ?? [];

 it('one-person code: 15 min, secure, stored hashed, connects once, then is used up', async () => {
  const t = await make(0);
  expect(t.max_uses).toBe(1); expect(t.code).toMatch(/^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
  const mins = (Date.parse(t.expires_at) - Date.now()) / 60000; expect(mins).toBeGreaterThan(14); expect(mins).toBeLessThanOrEqual(15);
  const { data: row } = await admin.from('trust_codes').select('code_hash').eq('id', t.id).single();
  expect(row!.code_hash).not.toContain(t.code.replace('-', ''));
  expect((await c[1]!.rpc('tellher_preview_trust_code', { _code: t.code })).data[0]).toEqual({ status: 'ok', first_name: 'Eva' });
  expect(await redeem(1, t.code.toLowerCase())).toEqual({ status: 'connected', first_name: 'Eva' });
  expect(await pair(0, 1)).toEqual([{ status: 'accepted' }]);
  const { data: n } = await admin.from('notifications').select('title').eq('recipient_id', ids[0]).eq('kind', 'trust_code');
  expect(n![0]!.title).toBe('Sara joined your Circle.');
  expect((await redeem(2, t.code)).status).toBe('invalid');
 });
 it('already Direct: no duplicate', async () => {
  const t = await make(0); expect((await redeem(1, t.code)).status).toBe('already'); expect(await pair(0, 1)).toHaveLength(1);
 });
 it('expired and cancelled codes fail', async () => {
  const e = await make(0); await admin.from('trust_codes').update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq('id', e.id);
  expect((await redeem(2, e.code)).status).toBe('expired');
  const x = await make(0); await c[0]!.rpc('tellher_cancel_trust_code', { _id: x.id });
  expect((await redeem(2, x.code)).status).toBe('invalid');
  expect((await c[2]!.rpc('tellher_cancel_trust_code', { _id: x.id })).error).not.toBeNull();
 });
 it('creator cannot redeem own code; blocked pair fails neutrally', async () => {
  const t = await make(0); expect((await redeem(0, t.code)).status).toBe('own');
  await admin.from('member_blocks').insert({ blocker_id: ids[0], blocked_id: ids[6] });
  expect(await redeem(6, t.code)).toEqual({ status: 'unavailable', first_name: null });
  expect(await pair(0, 6)).toEqual([]);
 });
 it('pending request is resolved into one accepted connection', async () => {
  await admin.from('trust_connections').insert({ requester_id: ids[2], recipient_id: ids[0], status: 'pending' });
  const t = await make(0); expect((await redeem(2, t.code)).status).toBe('connected');
  expect(await pair(0, 2)).toEqual([{ status: 'accepted' }]);
 });
 it('group code: max 5, 2 hours, members connect only to the creator, concurrent redemptions never exceed max', async () => {
  const g = await make(3, true); expect(g.max_uses).toBe(5);
  expect((Date.parse(g.expires_at) - Date.now()) / 3600000).toBeGreaterThan(1.9);
  await admin.from('trust_codes').update({ max_uses: 2 }).eq('id', g.id);
  const res = await Promise.all([1, 4, 5, 7].map(i => redeem(i, g.code)));
  expect(res.filter(r => r.status === 'connected')).toHaveLength(2);
  const { data } = await admin.from('trust_codes').select('uses').eq('id', g.id).single(); expect(data!.uses).toBe(2);
  const winners = [1, 4, 5, 7].filter((_, k) => res[k]!.status === 'connected');
  expect(await pair(winners[0]!, winners[1]!)).toEqual([]);
 });
 it('repeated invalid guesses are rate limited', async () => {
  for (let i = 0; i < 10; i++) await redeem(7, `ZZZZZ-ZZZZ${i}`);
  expect((await redeem(7, 'ZZZZZ-ZZZZZ')).status).toBe('rate_limited');
 });
});
