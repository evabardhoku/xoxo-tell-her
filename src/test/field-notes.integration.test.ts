import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url || !key)('Field Note links and identity consent', () => {
 let admin: SupabaseClient; const clients: SupabaseClient[] = []; const ids: string[] = []; const qs: string[] = []; let legacy = ''; let note = ''; let named = ''; let anon = ''; let other = '';
 const c = (i: number) => { const cl = clients[i]; if (!cl) throw new Error('Missing test member'); return cl; };
 const save = (ripple?: string, confirm = false, id?: string, body = 'What I learned from this experience was to leave myself time to compare options.') => c(0).rpc('tellher_save_field_note', { _id: id, _title: 'Fieldnotetest moving experience', _body: body, _topic: 'Housing & Moving', _ripple: ripple, _confirm_reveal: confirm });
 beforeAll(async () => {
  if (!url || !key) throw new Error('Missing test access');
  admin = createClient(url, key, { auth: { persistSession: false } });
  for (const first of ['NoteAuthor', 'PrivateRippleAuthor', 'ThirdPerspective', 'FourthPerspective']) {
   const email = `fieldnote-${crypto.randomUUID()}@example.com`; const password = crypto.randomUUID();
   const r = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: first, last_name: 'Test', woman_attested: true } });
   if (r.error || !r.data.user) throw r.error; ids.push(r.data.user.id);
   const cl = createClient(url, process.env['SUPABASE_PUBLISHABLE_KEY'] || key, { auth: { persistSession: false } });
   const s = await cl.auth.signInWithPassword({ email, password }); if (s.error) throw s.error; clients.push(cl);
  }
  await admin.from('trust_connections').insert([{ requester_id: ids[0], recipient_id: ids[1], status: 'accepted' }, { requester_id: ids[1], recipient_id: ids[0], status: 'accepted' }]);
  const old = await c(0).from('trust_notes').insert({ author_id: ids[0], title: 'Legacy Field Note', topic: 'Travel', body: 'An existing note remains in the same record after this product change.' }).select('id').single(); if (old.error) throw old.error; legacy = old.data.id;
  for (const [owner, visibility] of [[0, 'anonymous'], [0, 'named'], [1, 'anonymous']] as const) {
   const r = await c(owner).rpc('tellher_publish_question_identity', { _category: 'Housing & Moving', _body: 'Fieldnotetest what helped you prepare for moving abroad?', _scope: 'community', _instinct: 'unsure', _author_visibility: visibility });
   if (r.error) throw r.error; qs.push(r.data);
  }
  [anon, named, other] = qs;
 }, 60000);
 afterAll(async () => { for (const q of qs) await c(q === other ? 1 : 0).rpc('tellher_delete_question', { _id: q }); if (admin) { await admin.from('trust_connections').delete().in('requester_id', ids); for (const id of ids) await admin.auth.admin.deleteUser(id); } });
 it('reuses the existing note in the profile shelf', async () => { expect((await c(1).rpc('tellher_member_shelf', { _id: ids[0] })).data?.find((n: { id: string }) => n.id === legacy)?.title).toBe('Legacy Field Note'); });
 it('creates linked named Field Note without warning consent', async () => { const r = await save(named); expect(r.error).toBeNull(); note = r.data; expect((await c(1).rpc('tellher_ripple_field_notes', { _q: named })).data?.some((n: { id: string }) => n.id === note)).toBe(true); });
 it('edits own note and blocks another writer', async () => { expect((await save(named, false, note)).error).toBeNull(); expect((await c(1).rpc('tellher_save_field_note', { _id: note, _title: 'Hijacked note', _body: 'Another woman should not be allowed to edit this note.', _topic: 'Work' })).error).not.toBeNull(); });
 it('rejects unconfirmed own anonymous link and leaves the original link intact', async () => { expect((await save(anon, false, note)).error?.message).toContain('confirmation'); expect((await c(0).from('trust_notes').select('linked_ripple_id').eq('id', note).single()).data?.linked_ripple_id).toBe(named); });
 it('rejects direct linkage bypass', async () => { expect((await c(0).from('trust_notes').update({ linked_ripple_id: anon }).eq('id', note)).error).not.toBeNull(); });
 it('confirmed reveal links knowledge without changing Ripple visibility', async () => { expect((await save(anon, true, note)).error).toBeNull(); expect((await c(1).rpc('tellher_field_note_context', { _ids: [note] })).data?.[0]).toMatchObject({ question_id: anon, identity_revealed: true, perspective_count: null }); expect((await c(1).rpc('tellher_ripple_identities', { _ids: [anon] })).data?.[0]).toMatchObject({ author_visibility: 'anonymous', first_name: null, profile_id: null }); });
 it('another author’s anonymous Ripple stays anonymous', async () => { expect((await save(other, false, note)).error).toBeNull(); const ctx = await c(1).rpc('tellher_field_note_context', { _ids: [note] }); expect(ctx.data?.[0]?.identity_revealed).toBe(false); expect(JSON.stringify(ctx.data)).not.toContain(ids[1]); expect((await c(0).rpc('tellher_ripple_identities', { _ids: [other] })).data?.[0]?.first_name).toBeNull(); });
 it('perspective credit is hidden at two and visible at three, with no participant identities', async () => {
  for (const i of [0,2,3]) { expect((await c(i).rpc('tellher_post_reply', { _id: other, _tag: 'been_there', _body: 'I gave myself a month to settle before judging the move.' })).error).toBeNull(); const ctx = await c(1).rpc('tellher_field_note_context', { _ids: [note] }); expect(ctx.data?.[0]?.perspective_count).toBe(i === 3 ? 3 : null); for (const id of ids) expect(JSON.stringify(ctx.data)).not.toContain(id); }
 });
 it('search and linked Ripple reuse the same note and obey profile access', async () => { expect((await c(1).rpc('tellher_search', { _q: 'Fieldnotetest' })).data?.filter((r: { kind: string; id: string }) => r.kind === 'note' && r.id === note)).toHaveLength(1); expect((await c(2).rpc('tellher_ripple_field_notes', { _q: other })).data).toEqual([]); expect((await c(2).rpc('tellher_field_note_context', { _ids: [note] })).data).toEqual([]); });
 it('enforces the 2500 character body limit at the database boundary', async () => { expect((await save(undefined, false, undefined, 'x'.repeat(2500))).error).toBeNull(); expect((await save(undefined, false, undefined, 'x'.repeat(2501))).error).not.toBeNull(); });
});