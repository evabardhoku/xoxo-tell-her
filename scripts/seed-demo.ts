import { seedNamedRipples } from './seed-named-ripples';
// Seeds a small fictional TellHer demo network through the real member functions.
// Run: bun scripts/seed-demo.ts  (requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
const url = process.env['SUPABASE_URL']!; const key = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
const pub = process.env['SUPABASE_PUBLISHABLE_KEY'] || key;
const PASSWORD = 'TellHerDemo-2026';
const admin = createClient(url, key, { auth: { persistSession: false } });
const people = [
 ['maya', 'Maya', 'Demo', 'Lisbon'], ['lina', 'Lina', 'Demo', 'Porto'], ['sofia', 'Sofia', 'Demo', 'Madrid'],
 ['noor', 'Noor', 'Demo', 'Lyon'], ['iris', 'Iris', 'Demo', 'Ghent'], ['june', 'June', 'Demo', 'Bristol'],
] as const;
const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
// Safe member-profile details for the fictional demo members only (re-applied on every run).
const details: Record<string, Record<string, unknown>> = {
 maya: { bio: 'Project manager who likes a second opinion before big decisions.', country: 'Portugal', languages: ['Portuguese', 'English'], occupation: 'Project manager', known_for: ['Workplace politics'], ask_me_about: ['Asking for a raise'], discoverability: 'direct' },
 lina: { bio: 'Teacher in Porto. Calm, direct, and good at difficult conversations.', country: 'Portugal', languages: ['Portuguese', 'English', 'Spanish'], occupation: 'Secondary school teacher', known_for: ['Hard conversations', 'Education'], ask_me_about: ['Setting boundaries', 'Teaching careers'], discoverability: 'community' },
 sofia: { bio: 'Software engineer, moved countries twice. Happy to talk relocation.', country: 'Spain', languages: ['Spanish', 'English'], occupation: 'Software engineer', known_for: ['Relocating', 'Tech jobs'], ask_me_about: ['Moving abroad', 'Salary negotiation'], discoverability: 'extended' },
 noor: { bio: 'Studying medicine in Lyon. I like practical questions.', country: 'France', languages: ['Arabic', 'French', 'English'], occupation: 'Medical student', known_for: ['Student life'], ask_me_about: ['Studying abroad', 'Finding flatmates'], discoverability: 'extended' },
 iris: { bio: 'Illustrator in Ghent who travels for fairs.', country: 'Belgium', languages: ['Dutch', 'English'], occupation: 'Illustrator', known_for: ['Freelancing', 'Travel'], ask_me_about: ['Trade fairs', 'Pricing creative work'], discoverability: 'community' },
 june: { bio: 'Charity fundraiser in Bristol and keen cyclist.', country: 'United Kingdom', languages: ['English'], occupation: 'Fundraiser', known_for: ['Nonprofits'], ask_me_about: ['Cycling commutes'], discoverability: 'direct' },
};
for (const u of list.users) { const k = u.email?.match(/^(\w+)\.demo@example\.com$/)?.[1]; if (k && details[k]) { const r = await admin.from('profiles').update(details[k]).eq('id', u.id); if (r.error) throw r.error; } }
// Between Us: three fictional conversations between demo Direct Circle members only (idempotent; never real accounts).
const seedMessages = async () => {
 const sign = async (k: string) => { const cl = createClient(url, pub, { auth: { persistSession: false } }); const s = await cl.auth.signInWithPassword({ email: `${k}.demo@example.com`, password: PASSWORD }); if (s.error) throw s.error; return { cl, uid: s.data.user.id }; };
 const maya = await sign('maya');
 const existing = await maya.cl.rpc('tellher_inbox'); if (existing.error) throw existing.error;
 if ((existing.data ?? []).length) return;
 const threads: [string, [boolean, string][]][] = [
  ['lina', [[true, 'Thank you for your perspective on the meeting question. It helped more than you know.'], [false, 'Of course. Did you end up talking to her?'], [true, 'Not yet — I’m writing down the three examples first, like you suggested.'], [false, 'Good plan. Happy to read it over before you send anything.']]],
  ['sofia', [[false, 'Are you still looking for a flat near the river?'], [true, 'Yes! Viewing two on Saturday.'], [false, 'Ask them about the heating bills in winter. Mine were a surprise.']]],
  ['noor', [[true, 'Your Trusted Pick for the bakery was perfect, by the way.'], [false, 'So glad! Get there before nine or the cardamom buns are gone.']]],
 ];
 for (const [k, msgs] of threads) {
  const other = await sign(k);
  const conv = await maya.cl.rpc('tellher_open_conversation', { _member: other.uid }); if (conv.error) throw conv.error;
  for (const [fromMaya, body] of msgs) { const r = await (fromMaya ? maya : other).cl.rpc('tellher_send_message', { _c: conv.data as string, _body: body }); if (r.error) throw r.error; }
 }
 console.log('Seeded Between Us demo conversations.');
};
// Extras (idempotent, demo accounts only): a duplicate second-degree path, a pending Trust Bridge,
// Trust Notes for the Lisbon network, and two private Wingwoman sessions for Maya (one multi-turn).
const seedExtras = async () => {
 const sign = async (k: string) => { const cl = createClient(url, pub, { auth: { persistSession: false } }); const s = await cl.auth.signInWithPassword({ email: `${k}.demo@example.com`, password: PASSWORD }); if (s.error) throw s.error; return { cl, uid: s.data.user.id }; };
 const m: Record<string, { cl: SupabaseClient; uid: string }> = {};
 for (const k of ['maya', 'lina', 'sofia', 'noor', 'iris']) m[k] = await sign(k);
 const edge = async (a: string, b: string) => (await admin.from('trust_connections').select('id').eq('requester_id', m[a]!.uid).eq('recipient_id', m[b]!.uid).in('status', ['pending', 'accepted'])).data?.length;
 // Noor also trusts Iris, so Iris reaches Maya through both Lina and Noor (counted once).
 if (!(await edge('noor', 'iris'))) {
  const r = await m['noor']!.cl.rpc('tellher_send_trust', { _recipient: m['iris']!.uid }); if (r.error) throw r.error;
  const { data } = await m['iris']!.cl.rpc('tellher_my_circle'); const req = (data as { connection_id: string; kind: string; member_id: string }[]).find(x => x.kind === 'incoming' && x.member_id === m['noor']!.uid);
  if (req) { const a = await m['iris']!.cl.rpc('tellher_respond_trust', { _id: req.connection_id, _accept: true }); if (a.error) throw a.error; }
 }
 // Maya has asked Iris (Extended Circle) for a Trust Bridge; left pending for Iris to answer.
 if (!(await edge('maya', 'iris')) && !(await edge('iris', 'maya'))) { const r = await m['maya']!.cl.rpc('tellher_send_trust', { _recipient: m['iris']!.uid }); if (r.error) throw r.error; }
 const notes: Record<string, [string, string, string, string | null]> = {
  lina: ['Preparing for a difficult conversation', 'Work', 'I write down what happened, what I need, and one sentence I can repeat if I get flustered. Then I ask for ten minutes, not “a chat”.', 'Porto'],
  sofia: ['First month after moving countries', 'Housing & Moving', 'Register your address early, open a local bank account before you need it, and keep paper copies of your rental contract. Everything else can wait.', 'Madrid'],
  noor: ['Finding a flatmate as a student', 'Study', 'Meet in a café first, ask how they split bills and cleaning, and talk to the current flatmate alone if you can.', 'Lyon'],
  iris: ['Pricing illustration work fairly', 'Money', 'I quote per project, not per hour, include two rounds of changes, and ask for 30% upfront from new clients.', 'Ghent'],
 };
 for (const [k, [title, topic, body, location]] of Object.entries(notes)) {
  const { count } = await m[k]!.cl.from('trust_notes').select('id', { count: 'exact', head: true }).eq('title', title); if (count) continue;
  const r = await m[k]!.cl.from('trust_notes').insert({ author_id: m[k]!.uid, title, topic, body, location }); if (r.error) throw r.error;
 }
 // Echoes on demo Ripples (demo members only): varied states — 0, below threshold, 3+, and a higher count.
 const all: Record<string, { cl: SupabaseClient; uid: string }> = { ...m, june: await sign('june') };
 const feed = ((await all['maya']!.cl.rpc('tellher_feed')).data ?? []) as { id: string; body: string }[];
 const echoPlan: [string, string[]][] = [['My manager keeps presenting', ['lina', 'sofia', 'noor', 'iris', 'june']], ['I’m travelling alone for the first time', ['lina', 'sofia', 'noor', 'maya']], ['After two dates he suggested', ['maya']]];
 for (const [start, who] of echoPlan) { const q = feed.find(f => f.body.startsWith(start)); if (!q) continue; for (const k of who) await all[k]!.cl.rpc('tellher_echo', { _id: q.id }); }
 // Echo Room on Maya's manager-credit Ripple (5 Echoes); anonymous voices, demo members only, only if empty.
 const credit = feed.find(f => f.body.startsWith('My manager keeps presenting'));
 if (credit && !((await all['maya']!.cl.rpc('tellher_echo_room', { _q: credit.id })).data ?? []).length) {
  const roomMsgs: [string, string][] = [['maya', 'Thank you for echoing this. It helps to know it isn’t just me.'], ['lina', 'Same pattern with a previous manager. Recap emails after every 1:1 changed a lot.'], ['sofia', 'I kept a simple doc of ideas with dates. I never had to use it, but it made me calmer.'], ['maya', 'I’m going to try the recap email this week.']];
  for (const [k, b] of roomMsgs) { const r = await all[k]!.cl.rpc('tellher_echo_room_post', { _q: credit.id, _body: b }); if (r.error) throw r.error; }
 }
 // The Other Side: fictional shared outcomes written by each demo author on her own Ripple (upsert, so re-runs don't duplicate).
 const outcomes: [string, string, string, string, string | null][] = [
  ['maya', 'My manager keeps presenting', 'boundary', 'I started sending recap emails after every 1:1, and I raised credit once, calmly.', 'She now names me when she presents my ideas. It isn’t perfect, but it’s much better than it was.'],
  ['iris', 'I’m travelling alone for the first time', 'moved_forward', 'I gave the host an arrival window instead of my flight number. The trip was lovely.', null],
  ['sofia', 'After two dates he suggested', 'figuring_out', 'I said I wasn’t ready to share locations yet. We’re still seeing each other, and I’m watching how he takes it.', null],
 ];
 for (const [k, start, status, summary, note] of outcomes) { const f = ((await all[k]!.cl.rpc('tellher_feed')).data ?? []) as { id: string; body: string; is_mine: boolean }[]; const q = f.find(x => x.is_mine && x.body.startsWith(start)); if (q) { const r = await all[k]!.cl.rpc('tellher_set_outcome', { _q: q.id, _status: status, _summary: summary, _note: note as string, _shared: true }); if (r.error) throw r.error; } }
 const maya = m['maya']!;
 const { count: ww } = await maya.cl.from('wingwoman_sessions').select('id', { count: 'exact', head: true }).eq('title', 'Asked to cover a colleague’s project again'); if (ww) return;
 // Legacy-style one-shot reflection.
 const one = await maya.cl.from('wingwoman_sessions').insert({ owner_id: maya.uid, title: 'A friend keeps cancelling at the last minute', context: 'Friendship', instinct: 'unsure',
  situation: 'A close friend has cancelled our plans at the last minute four times in two months. She always apologises, but I’m starting to feel like I’m the only one making an effort.',
  reflection: { what_stands_out: ['The cancellations have become a pattern over two months.', 'She apologises each time, so she seems aware of it.', 'You are noticing an imbalance in effort.'], questions: ['Do you know what is going on in her life right now?', 'What would feel fair to you going forward?'], next_step: 'You might consider telling her, kindly, how the cancellations land for you and asking what would work better for her.', safety_note: null } });
 if (one.error) throw one.error;
 // Multi-turn conversation.
 const s = await maya.cl.from('wingwoman_sessions').insert({ owner_id: maya.uid, title: 'Asked to cover a colleague’s project again', context: 'Work', instinct: 'feels_off',
  situation: 'My team lead asked me, for the third time, to quietly finish a colleague’s project before a deadline. The colleague gets the credit in the review.',
  reflection: { what_stands_out: ['This is the third time, so it is a pattern rather than a one-off.', 'The work is done quietly, which makes your contribution hard to see.', 'Credit goes to someone else in a formal review.'], questions: ['What do you want your lead to understand about this?', 'Is there a record of the work you did?'], next_step: 'You might consider keeping a short written note of what you delivered each time, before deciding whether to raise it.', safety_note: null } }).select('id').single();
 if (s.error) throw s.error;
 const turns: [string, string][] = [
  ['user', 'I do have emails showing I sent the final files. I just don’t want to look like I’m complaining.'],
  ['assistant', 'That makes sense — and having the emails changes things. Pointing to what you delivered isn’t complaining; it’s making your work visible. What would you want your lead to do differently next time?'],
  ['user', 'Honestly, just ask me openly instead of making it a secret favour.'],
  ['assistant', 'That’s a clear, reasonable ask. You could put it almost exactly like that: “Happy to help when I can — I’d just like it to be visible on my side too.” Does that sound like you?'],
 ];
 for (const [role, content] of turns) { const r = await maya.cl.from('wingwoman_messages').insert({ session_id: s.data.id, owner_id: maya.uid, role, content }); if (r.error) throw r.error; }
 console.log('Seeded demo extras.');
};
if (list.users.some(u => u.email === 'maya.demo@example.com')) { await seedMessages(); await seedExtras(); await seedNamedRipples(); console.log('Demo already seeded; profile details refreshed.'); process.exit(0); }
const id: Record<string, string> = {}; const c: Record<string, SupabaseClient> = {};
for (const [k, first, last, city] of people) {
 const email = `${k}.demo@example.com`;
 const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { first_name: first, last_name: last, woman_attested: true } });
 if (error) throw error; id[k] = data.user!.id;
 const cl = createClient(url, pub, { auth: { persistSession: false } });
 const s = await cl.auth.signInWithPassword({ email, password: PASSWORD }); if (s.error) throw s.error;
 await cl.from('profiles').update({ city, ...details[k] }).eq('id', id[k]); c[k] = cl;
}
const trust = async (a: string, b: string) => {
 const e1 = await c[a]!.rpc('tellher_send_trust', { _recipient: id[b]! }); if (e1.error) throw e1.error;
 const { data } = await c[b]!.rpc('tellher_my_circle'); const req = (data as { connection_id: string; kind: string }[]).find(r => r.kind === 'incoming')!;
 const e2 = await c[b]!.rpc('tellher_respond_trust', { _id: req.connection_id, _accept: true }); if (e2.error) throw e2.error;
};
for (const m of ['lina', 'sofia', 'noor']) await trust('maya', m);
await trust('lina', 'iris'); await trust('sofia', 'june');
for (const m of ['lina', 'sofia', 'noor']) await trust(m, 'maya');
const ask = async (who: string, category: string, body: string, scope: string, instinct: string, note: string | null) => {
 const { data, error } = await c[who]!.rpc('tellher_publish_question', { _category: category, _body: body, _scope: scope, _instinct: instinct, _note: note as string }); if (error) throw error; return data as string;
};
const reply = async (who: string, q: string, tag: string, body: string) => { const { error } = await c[who]!.rpc('tellher_post_reply', { _id: q, _tag: tag, _body: body }); if (error) throw error; };
const q1 = await ask('maya', 'Work', 'My manager keeps presenting ideas I shared with her in one-on-ones as her own in team meetings. It has happened three times this quarter. How would you approach this without making things awkward?', 'extended', 'unsure', 'I don’t want to seem petty.');
await reply('lina', q1, 'address', 'I would bring it up privately and calmly, with one concrete example, and ask how she sees credit being shared in the team.');
await reply('sofia', q1, 'been_there', 'Something similar happened to me. What helped was sending a short recap email after one-on-ones so my ideas were written down.');
await reply('noor', q1, 'watch_wait', 'I might note dates and examples for a few weeks first, so I feel clearer before saying anything.');
await reply('iris', q1, 'more_context', 'I’d want to know whether she does this with others too, and whether there is anyone else you trust on the team.');
await reply('june', q1, 'address', 'Next time it happens in a meeting, I would add a light follow-up like “glad that idea landed — happy to share the detail I drafted.”');
const q2 = await ask('iris', 'Travel', 'I’m travelling alone for the first time next month and my host keeps asking for my exact arrival time and flight number. Is that normal for a guesthouse?', 'community', 'feels_off', null);
await reply('lina', q2, 'more_context', 'Some small guesthouses ask so someone can meet you with keys. I’d want to know if the request came through the booking platform.');
await reply('sofia', q2, 'been_there', 'A host asked me the same once and it was just for key handover. I gave an arrival window instead of my flight number and that was fine.');
await reply('noor', q2, 'address', 'I would reply through the booking platform and ask why they need it, so there is a record of the conversation.');
await reply('june', q2, 'watch_wait', 'I’d see how they respond to a general time window before sharing more.');
await ask('lina', 'Housing & Moving', 'A landlord asked me to pay the deposit in cash before viewing the flat in person. The listing photos look great. What would you want to check first?', 'circle', 'feels_off', null);
await ask('sofia', 'Dating & Boundaries', 'After two dates he suggested we share locations on our phones “so we always know the other is safe.” I like him, but it feels fast. How have others handled this?', 'extended', 'unsure', null);
await ask('noor', 'Everyday Life', 'A neighbour I barely know asked if she could leave her spare key with me while she travels. Is it reasonable to say no?', 'community', 'feels_okay', null);
const pick = async (who: string, category: string, title: string, note: string, location: string | null) => { const { error } = await c[who]!.from('trusted_picks').insert({ owner_id: id[who]!, category, title, note, location }); if (error) throw error; };
await pick('lina', 'Services', 'A locksmith who quotes before starting', 'She told me the price on the phone, arrived on time and didn’t upsell anything.', 'Rome · Trastevere');
await pick('sofia', 'Health & Care', 'A GP who listens without rushing', 'She took my questions seriously and explained the options plainly.', null);
await pick('sofia', 'Travel', 'Women-run guesthouse with clear check-in', 'They sent written check-in instructions and never asked for flight details.', 'Lisbon');
await seedMessages(); await seedExtras(); await seedNamedRipples();
console.log('Seeded demo. Sign in as maya.demo@example.com /', PASSWORD);
