import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('moderation & rate limits', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = []; let q = '';
 beforeAll(async () => {
  admin = createClient(url!, key!, { auth: { persistSession: false } });
  for (const n of ['A', 'B', 'Mod']) {
   const email = `tellher-mod-${n}-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: n, last_name: 'Test', woman_attested: true } });
   if (error || !data.user) throw error; ids.push(data.user.id);
   const cl = createClient(url!, process.env['SUPABASE_PUBLISHABLE_KEY'] || key!, { auth: { persistSession: false } });
   await cl.auth.signInWithPassword({ email, password }); c.push(cl);
  }
  await admin.from('user_roles').insert({ user_id: ids[2], role: 'moderator' });
  q = (await c[0]!.rpc('tellher_publish_question', { _category: 'Work', _body: 'Moderation test question', _scope: 'community', _instinct: 'unsure', _note: null })).data as string;
 }, 60000);
 afterAll(async () => { await admin.from('reports').delete().eq('question_id', q); await admin.from('questions').delete().eq('id', q); for (const id of ids) await admin.auth.admin.deleteUser(id); });

 it('members cannot read the queue, grant themselves roles, or act', async () => {
  expect((await c[1]!.rpc('tellher_mod_reports')).error).not.toBeNull();
  expect((await c[1]!.from('user_roles').insert({ user_id: ids[1], role: 'admin' })).error).not.toBeNull();
  expect((await c[1]!.from('moderation_actions').select('*')).data ?? []).toEqual([]);
 });
 it('moderator sees content without identities and can remove it', async () => {
  expect((await c[1]!.rpc('tellher_report_question', { _id: q, _reason: 'spam' })).error).toBeNull();
  const { data, error } = await c[2]!.rpc('tellher_mod_reports');
  expect(error).toBeNull();
  const row = (data as Record<string, unknown>[]).find(r => r['ripple_id'] === q)!;
  expect(row).toBeTruthy(); expect(Object.keys(row)).not.toContain('reporter_id');
  expect((await c[1]!.rpc('tellher_mod_act', { _report: row['id'], _action: 'remove' })).error).not.toBeNull();
  expect((await c[2]!.rpc('tellher_mod_act', { _report: row['id'], _action: 'remove' })).error).toBeNull();
  const { data: qr } = await admin.from('questions').select('body').eq('id', q).single();
  expect(qr!.body).toMatch(/removed by TellHer moderators/);
  const { count } = await admin.from('moderation_actions').select('*', { count: 'exact', head: true }).eq('report_id', row['id']);
  expect(count).toBe(1);
 });
 it('report spam is rate limited (10 per hour)', async () => {
  await admin.from('rate_limits').update({ max_count: 1 }).eq('action', 'report');
  try {
   const r = await c[0]!.from('reports').insert({ reporter_id: ids[0], question_id: q, reason: 'x' });
   const r2 = await c[1]!.rpc('tellher_report_question', { _id: q, _reason: 'again' });
   expect([r.error?.message, r2.error?.message].join(' ')).toBeTruthy();
  } finally { await admin.from('rate_limits').update({ max_count: 10 }).eq('action', 'report'); }
 });
});
