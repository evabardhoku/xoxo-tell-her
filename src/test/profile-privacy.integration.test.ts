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
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: `Private ${index}` } });
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
  const { data, error } = await owner.from('profiles').select('id, display_name');
  expect(error).toBeNull(); expect(data).toEqual([{ id: ids[0], display_name: 'Private 0' }]);
 });
 it('allows reading only the signed-in user’s profile', async () => {
  const { data, error } = await owner.from('profiles').select('id').eq('id', ids[1]);
  expect(error).toBeNull(); expect(data).toEqual([]);
 });
 it('allows updating own profile but not another user’s profile', async () => {
  const own = await owner.from('profiles').update({ display_name: 'Updated privately' }).eq('id', ids[0]).select('display_name');
  expect(own.error).toBeNull(); expect(own.data).toEqual([{ display_name: 'Updated privately' }]);
  const other = await owner.from('profiles').update({ display_name: 'Should not change' }).eq('id', ids[1]).select('id');
  expect(other.data).toEqual([]);
  const check = await admin.from('profiles').select('display_name').eq('id', ids[1]).single();
  expect(check.data?.display_name).toBe('Private 1');
 });
});