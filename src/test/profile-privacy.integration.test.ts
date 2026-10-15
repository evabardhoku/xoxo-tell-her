import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Runs against the connected backend when server credentials are available.
// Creates isolated temporary accounts, exercises real RLS, then deletes both.
const url = process.env['SUPABASE_URL'];
const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('Private profile access', () => {
 let admin: SupabaseClient; let owner: SupabaseClient; const ids: string[] = [];
 beforeAll(async () => {
  if (!url || !key) throw new Error('Backend credentials required');
  admin = createClient(url, key, { auth: { persistSession: false } });
  for (let index = 0; index < 2; index++) {
   const email = `tellher-privacy-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: `Private ${index}`, last_name: 'Test', woman_attested: true } });
   if (error || !data.user) throw new Error('Could not create privacy test account');
   ids.push(data.user.id);
   if (index === 0) {
    owner = createClient(url, process.env['SUPABASE_PUBLISHABLE_KEY'] || key, { auth: { persistSession: false } });
    const { error: loginError } = await owner.auth.signInWithPassword({ email, password });
    if (loginError) throw new Error('Could not sign in privacy test account');
   }
  }
 }, 30000);
 afterAll(async () => { for (const id of ids) await admin.auth.admin.deleteUser(id); });
 it('automatically creates a profile linked to the new account', async () => {
  const { data, error } = await owner.from('profiles').select('id, first_name, last_name, woman_attested_at');
  expect(error).toBeNull(); expect(data).toHaveLength(1); expect(data?.[0]).toMatchObject({ id: ids[0], first_name: 'Private 0', last_name: 'Test' }); expect(data?.[0].woman_attested_at).toBeTruthy();
 });
 it('allows reading only the signed-in user’s profile', async () => {
  const { data, error } = await owner.from('profiles').select('id').eq('id', ids[1]);
  expect(error).toBeNull(); expect(data).toEqual([]);
 });
 it('allows updating own profile but not another user’s profile', async () => {
  const own = await owner.from('profiles').update({ first_name: 'Updated privately', city: 'Rome', country: 'Italy', bio: 'Private bio' }).eq('id', ids[0]).select('first_name, city, country, bio');
  expect(own.error).toBeNull(); expect(own.data).toEqual([{ first_name: 'Updated privately', city: 'Rome', country: 'Italy', bio: 'Private bio' }]);
  const other = await owner.from('profiles').update({ first_name: 'Should not change' }).eq('id', ids[1]).select('id');
  expect(other.data).toEqual([]);
  const check = await admin.from('profiles').select('first_name').eq('id', ids[1]).single();
  expect(check.data?.first_name).toBe('Private 1');
 });
 it('rejects email signup without explicit self-attestation', async () => {
  const { error } = await admin.auth.admin.createUser({ email: `no-attestation-${crypto.randomUUID()}@example.com`, password: crypto.randomUUID(), email_confirm: true, user_metadata: { first_name: 'Test', last_name: 'Member' } });
  expect(error).not.toBeNull();
 });
 it('requires explicit first and last names for attested members', async () => {
  const result = await owner.from('profiles').update({ last_name: '' }).eq('id', ids[0]); expect(result.error).not.toBeNull();
 });
 it('does not permit revoking or rewriting a recorded attestation', async () => {
  const result = await owner.from('profiles').update({ woman_attested_at: null }).eq('id', ids[0]); expect(result.error).not.toBeNull();
 });
 it('rejects another member’s avatar path', async () => {
  const result = await owner.from('profiles').update({ avatar_path: `${ids[1]}/${crypto.randomUUID()}.png` }).eq('id', ids[0]); expect(result.error).not.toBeNull();
 });
 it('keeps trust and question writes disabled and question metadata private', async () => {
  const question = await admin.from('questions').insert({ body: 'A private test question' }).select('id').single();
  expect(question.error).toBeNull(); const questionId = question.data?.id;
  try {
   expect((await admin.from('question_private_meta').insert({ question_id: questionId, owner_id: ids[1], initial_instinct: 'Private instinct' })).error).toBeNull();
   expect((await owner.from('questions').select('id').eq('id', questionId)).data).toEqual([]);
   expect((await owner.from('question_private_meta').select('*').eq('question_id', questionId)).data).toEqual([]);
   expect((await owner.from('questions').insert({ body: 'Not enabled' })).error).not.toBeNull();
   expect((await owner.from('trust_connections').insert({ requester_id: ids[0], recipient_id: ids[1] })).error).not.toBeNull();
   await admin.from('question_private_meta').update({ owner_id: ids[0] }).eq('question_id', questionId);
   expect((await owner.from('questions').select('id').eq('id', questionId)).data).toEqual([{ id: questionId }]);
  } finally { await admin.from('questions').delete().eq('id', questionId); }
 });
});