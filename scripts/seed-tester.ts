import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { testerScenario as demo } from './demo-community-data';

/** Only invoked by the controlled --tester mode; no account credentials are printed. */
export async function seedTester() {
 const url = process.env['SUPABASE_URL'];
 const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
 const pub = process.env['SUPABASE_PUBLISHABLE_KEY'];
 const password = process.env['TELLHER_TESTER_PASSWORD'];
 if (!url || !key || !pub || !password) throw new Error('Required tester configuration is unavailable.');
 const client = (k: string) => createClient(url, k, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => { const headers = new Headers(init?.headers); if (k.startsWith('sb_') && headers.get('Authorization') === `Bearer ${k}`) headers.delete('Authorization'); headers.set('apikey', k); return fetch(input, { ...init, headers }); } } });
 const admin = client(key);
 const listed = await admin.auth.admin.listUsers({ perPage: 1000 });
 if (listed.error) throw new Error('Could not resolve demo accounts.');
 let user = listed.data.users.find(u => u.email === demo.email);
 if (user && (user.user_metadata['first_name'] !== 'Blair' || user.user_metadata['last_name'] !== 'Waldorf')) throw new Error('Tester address belongs to an unexpected account.');
 const auth = user ? await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true }) : await admin.auth.admin.createUser({ email: demo.email, password, email_confirm: true, user_metadata: { first_name: 'Blair', last_name: 'Waldorf', woman_attested: true, fictional_demo: true } });
 if (auth.error || !auth.data.user) throw new Error('Could not prepare fictional tester login.');
 user = auth.data.user;
 const blair = client(pub);
 const login = await blair.auth.signInWithPassword({ email: demo.email, password });
 if (login.error) throw new Error('Tester password sign-in failed.');
 const ids: Record<string, string> = { blair: user.id };
 const clients: Record<string, SupabaseClient> = { blair };
 const helpers = [...demo.direct, demo.extended, demo.incoming, demo.outgoing, ...demo.helpers].filter((k, i, a) => a.indexOf(k) === i && k !== 'blair');
 for (const k of helpers) {
  const account = listed.data.users.find(u => u.email === `${k}.demo@example.com`);
  if (!account) throw new Error(`Fictional helper ${k} is unavailable.`);
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email: `${k}.demo@example.com` });
  if (link.error || !link.data.properties?.hashed_token) throw new Error('Could not authenticate fictional helper.');
  const cl = client(pub);
  const verify = await cl.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: 'magiclink' });
  if (verify.error) throw new Error('Fictional helper sign-in failed.');
  ids[k] = account.id; clients[k] = cl;
 }
 const get = (k: string) => { const cl = clients[k]; if (!cl) throw new Error(`Unknown demo actor ${k}.`); return cl; };
 const rpc = async (k: string, name: string, args?: Record<string, unknown>) => { const r = await get(k).rpc(name, args); if (r.error) throw new Error(`Demo action ${name} failed: ${r.error.message}`); return r.data; };
 // Duplicate-tolerant variant for reactions (likes, echoes) that may already exist on re-runs.
 const rpcSafe = async (k: string, name: string, args?: Record<string, unknown>) => { const r = await get(k).rpc(name, args); return !r.error; };
 const profile = await blair.from('profiles').update({ bio: 'Fictional competition tester account. Original demo stories, imaginary pastries, real privacy controls. Not affiliated with any television series.', city: 'New York', country: 'United States', occupation: 'Fictional founder & demo hostess', languages: ['English'], known_for: ['Pitch practice', 'Editorial flair', 'Friendly feedback'], ask_me_about: ['TellHer demo', 'Buildathon preparation', 'Setting boundaries'], discoverability: 'community', open_avatar_type: 'illustrated', open_avatar_config: { skin: 1, face: 0, hair: 3, hairColor: 1, accessory: 1, expression: 0, top: 2, topColor: 1, bg: 2 } }).eq('id', user.id);
 if (profile.error) throw new Error('Could not save tester profile.');
 const connect = async (a: string, b: string, tier?: 'direct' | 'extended') => {
  const rows = await rpc(a, 'tellher_my_circle') as { member_id: string; kind: string; connection_id: string }[];
  if (rows.some(r => r.member_id === ids[b] && ['direct', 'extended'].includes(r.kind))) return;
  let pending = rows.find(r => r.member_id === ids[b] && r.kind === 'outgoing');
  if (!pending) { await rpc(a, 'tellher_send_trust', { _recipient: ids[b] }); }
  if (tier) { const inbox = await rpc(b, 'tellher_my_circle') as typeof rows; const req = inbox.find(r => r.member_id === ids[a] && r.kind === 'incoming'); if (!req) throw new Error('Demo request not found.'); await rpc(b, 'tellher_respond_trust_tier', { _id: req.connection_id, _circle: tier }); }
 };
 for (const k of demo.direct) await connect('blair', k, 'direct');
 await connect('blair', demo.extended, 'extended');
 await connect(demo.incoming, 'blair'); await connect('blair', demo.outgoing);
 const ownedBy = async (k: string) => {
  const r = await admin.from('question_private_meta').select('question_id,questions!inner(body)').eq('owner_id', ids[k]);
  if (r.error) throw new Error('Could not check existing tester discussions.');
  return (r.data ?? []) as unknown as { question_id: string; questions: { body: string } }[];
 };
 const pool = helpers.slice().sort();
 let responseCount = 0, echoCount = 0, letterCount = 0, discussionCount = 0;
 for (const post of demo.discussions) {
  const owned = await ownedBy(post.by);
  const match = owned.find(q => q.questions.body === post.body);
  const qid = match?.question_id ?? await rpc(post.by, 'tellher_publish_question_identity', { _category: post.cat, _body: post.body, _scope: post.scope, _instinct: 'unsure', _note: 'Fictional tester scenario, not a real event.', _author_visibility: post.identity }) as string;
  discussionCount++;
  const named = post.identity === 'named';
  const readVisible = () => rpc(post.by, named ? 'tellher_open_comments' : 'tellher_replies', { _id: qid }) as Promise<{ id: string; body: string }[]>;
  const visible = await readVisible();
  for (const [actor, tag, body] of post.responses) {
   if (visible.some(r => r.body === body)) continue;
   await rpc(actor, named ? 'tellher_post_open_comment' : 'tellher_post_reply', named ? { _id: qid, _body: body } : { _id: qid, _tag: tag, _body: body });
   responseCount++;
  }
  const updated = await readVisible();
  for (const [i, want] of (post.likes ?? []).entries()) {
   const target = updated.find(r => r.body === post.responses[i]?.[2]);
   if (!target || !want) continue;
   const likers = pool.filter(k => k !== post.by && k !== post.responses[i]![0]);
   for (const k of likers.slice(0, want)) await rpcSafe(k, 'tellher_like_reply', { _reply: target.id });
  }
  if (!named && post.echoes) {
   const responders = new Set(post.responses.map(r => r[0]));
   const echoers = pool.filter(k => k !== post.by && !responders.has(k));
   for (const k of echoers.slice(0, post.echoes)) if (await rpcSafe(k, 'tellher_echo', { _id: qid })) echoCount++;
  }
  if (post.letter) {
   const [status, summary, note, shared] = post.letter;
   await rpc(post.by, 'tellher_set_outcome', { _q: qid, _status: status, _summary: summary, _note: note as string, _shared: shared });
   letterCount++;
  }
 }
 const picks = await blair.from('trusted_picks').select('title').eq('owner_id', user.id); if (picks.error) throw new Error('Could not check tester Picks.');
 for (const [category, title, note, location] of demo.picks) if (!(picks.data ?? []).some(p => p.title === title)) { const r = await blair.from('trusted_picks').insert({ owner_id: user.id, category, title, note, location }); if (r.error) throw new Error('Could not save tester Pick.'); }
 for (const [k, lines] of demo.threads) {
  const cid = await rpc('blair', 'tellher_open_conversation', { _member: ids[k] }) as string;
  const have = await blair.from('messages').select('body').eq('conversation_id', cid); if (have.error) throw new Error('Could not check tester messages.');
  for (const [i, body] of lines.entries()) if (!(have.data ?? []).some(m => m.body === body)) await rpc(i % 2 === 0 ? k : 'blair', 'tellher_send_message', { _c: cid, _body: body });
 }
 for (const s of demo.wingwoman) {
  const { count } = await blair.from('wingwoman_sessions').select('id', { count: 'exact', head: true }).eq('title', s.title);
  if (count) continue;
  const row = await blair.from('wingwoman_sessions').insert({ owner_id: user.id, title: s.title, context: s.context, instinct: s.instinct, situation: s.situation, reflection: s.reflection }).select('id').single();
  if (row.error) throw new Error('Could not save tester Wingwoman session.');
  for (const [role, content] of s.turns) { const r = await blair.from('wingwoman_messages').insert({ session_id: row.data.id, owner_id: user.id, role, content }); if (r.error) throw new Error('Could not save tester Wingwoman message.'); }
 }
 console.log(JSON.stringify({ prepared: true, email: demo.email, discussions: discussionCount, responses: responseCount, echoes: echoCount, starLetters: letterCount, picks: demo.picks.length, directConnections: demo.direct.length, extendedConnections: 1, pendingRequests: 2, messageThreads: demo.threads.length, wingwomanSessions: demo.wingwoman.length }));
}
