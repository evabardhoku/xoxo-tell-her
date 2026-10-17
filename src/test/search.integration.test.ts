import { admitFixture } from './membership-fixture';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('TellHer search privacy', () => {
 let admin: SupabaseClient; const c: SupabaseClient[] = []; const ids: string[] = []; const emails: string[] = [];
 const tag = `zq${crypto.randomUUID().slice(0, 6)}`;
 const [A, B, C, D] = [0, 1, 2, 3];
 const search = async (q: string, v = A) => { const { data, error } = await c[v]!.rpc('tellher_search', { _q: q }); if (error) throw error; return (data ?? []) as { kind: string; id: string; member_id: string | null }[]; };
 const trust = async (a: number, b: number) => { await c[a]!.rpc('tellher_send_trust', { _recipient: ids[b] }); const { data } = await c[b]!.rpc('tellher_my_circle'); const r = (data as { connection_id: string; kind: string; member_id: string }[]).find(x => x.kind === 'incoming' && x.member_id === ids[a])!; await c[b]!.rpc('tellher_respond_trust', { _id: r.connection_id, _accept: true }); };
 beforeAll(async () => {
  admin = createClient(url!, key!, { auth: { persistSession: false } });
  for (const n of ['Ada', 'Bea', 'Cleo', 'Dina']) {
   const email = `tellher-search-${n}-${tag}@example.com`; const password = crypto.randomUUID();
   const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: `${n}${tag}`, last_name: 'Test', woman_attested: true } });
   if (error || !data.user) throw error; ids.push(data.user.id); await admitFixture(admin, data.user.id); emails.push(email);
   const cl = createClient(url!, process.env['SUPABASE_PUBLISHABLE_KEY'] || key!, { auth: { persistSession: false } });
   await cl.auth.signInWithPassword({ email, password }); c.push(cl);
  }
  await trust(A, B); await trust(B, C); await trust(B, A);
  await c[C]!.from('profiles').update({ discoverability: 'direct', known_for: [`Secret${tag}`] }).eq('id', ids[C]);
  await c[B]!.from('profiles').update({ known_for: [`Leases${tag}`] }).eq('id', ids[B]);
  // B asks anonymously to her circle, with a private instinct note; D writes a private Wingwoman situation.
  await c[B]!.rpc('tellher_publish_question', { _category: 'Work', _body: `Question about ${tag} rota swaps at work`, _scope: 'community', _instinct: 'unsure', _note: `instinctnote${tag}` });
  await c[A]!.from('wingwoman_sessions').insert({ owner_id: ids[A], context: 'Work', situation: `Private wingwoman phrase ${tag}wing describing things` });
 }, 60000);
 afterAll(async () => { const { data } = await admin.from('question_private_meta').select('question_id').in('owner_id', ids); for (const r of data ?? []) await admin.rpc('tellher_delete_question', { _id: r.question_id }).then(() => {}, () => {}); await admin.from('question_audience').delete().in('recipient_id', ids); await admin.from('question_private_meta').delete().in('owner_id', ids); await admin.from('wingwoman_sessions').delete().in('owner_id', ids); await admin.from('trust_connections').delete().or(ids.map(i => `requester_id.eq.${i}`).join(',')); for (const i of ids) await admin.auth.admin.deleteUser(i); });

 it('finds a Direct Circle member by topic and the anonymous question by keyword', async () => {
  expect((await search(`Leases${tag}`)).some(r => r.kind === 'person' && r.member_id === ids[B])).toBe(true);
  const qs = (await search(`${tag} rota`, D)).filter(r => r.kind === 'question'); expect(qs).toHaveLength(1); expect(qs[0]!.member_id).toBeNull();
 });
 it('returns nothing for a hidden email', async () => { expect(await search(emails[B]!)).toHaveLength(0); expect(await search(`search-Bea-${tag}`)).toHaveLength(0); });
 it('never links an anonymous question to its author name', async () => { expect((await search(`Bea${tag}`, D)).filter(r => r.kind !== 'person')).toHaveLength(0); expect(await search(`Bea${tag}`, D)).toHaveLength(0); });
 it('returns nothing for a non-discoverable Extended member', async () => { expect(await search(`Cleo${tag}`)).toHaveLength(0); expect(await search(`Secret${tag}`)).toHaveLength(0); });
 it('returns nothing for private Wingwoman text or My Instinct notes', async () => { expect(await search(`${tag}wing`)).toHaveLength(0); expect(await search(`instinctnote${tag}`, B)).toHaveLength(0); });
});
