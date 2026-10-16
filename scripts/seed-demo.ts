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
if (list.users.some(u => u.email === 'maya.demo@example.com')) { console.log('Demo already seeded; profile details refreshed.'); process.exit(0); }
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
console.log('Seeded demo. Sign in as maya.demo@example.com /', PASSWORD);
