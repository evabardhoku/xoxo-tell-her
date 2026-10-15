// One-off: fictional members (@example.com) connected to the project owner's account, with Ripples, replies and picks.
// Uses member functions for everything members can do themselves; only trust edges where the owner is the requester are written with the admin key.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env['SUPABASE_URL']!; const admin = createClient(url, process.env['SUPABASE_SERVICE_ROLE_KEY']!, { auth: { persistSession: false } });
const EVA = '549c72b0-03c4-439f-a866-e11f12b13123'; const PASSWORD = 'TellHerDemo-2026';
const people: [string, string, string, string, string][] = [
 ['giulia', 'Giulia', 'Romano', 'Rome', 'Architect. Always happy to talk about renting in Rome.'],
 ['amira', 'Amira', 'Haddad', 'Milan', 'Product designer, frequent solo traveller.'],
 ['elena', 'Elena', 'Kovač', 'Tirana', 'Nurse and night-shift survivor.'],
 ['chiara', 'Chiara', 'Bianchi', 'Bologna', 'PhD student, new to the city.'],
 ['nadia', 'Nadia', 'Rossi', 'Turin', 'Runs a small bakery.'],
 ['hana', 'Hana', 'Mori', 'Florence', 'Freelance translator.'],
 ['valentina', 'Valentina', 'Greco', 'Naples', 'Lawyer, mother of two.'],
];
const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
const resume = list.users.some(u => u.email === 'giulia.demo@example.com');
const c: Record<string, SupabaseClient> = {}; const id: Record<string, string> = { eva: EVA };
for (const [k, first, last, city, bio] of people) {
 const email = `${k}.demo@example.com`;
 const existing = list.users.find(u => u.email === email);
 const data = existing ? { user: existing } : (await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { first_name: first, last_name: last, woman_attested: true } })).data!;
 id[k] = data.user!.id;
 const cl = createClient(url, process.env['SUPABASE_PUBLISHABLE_KEY']!, { auth: { persistSession: false } });
 const s = await cl.auth.signInWithPassword({ email, password: PASSWORD }); if (s.error) throw s.error; c[k] = cl;
 const p = await cl.from('profiles').update({ city, country: 'Italy', bio }).eq('id', data.user.id); if (p.error) throw p.error;
}
const trust = async (a: string, b: string) => {
 const e1 = await c[a]!.rpc('tellher_send_trust', { _recipient: id[b]! }); if (e1.error) throw e1.error;
 if (b === 'eva') return; // Eva accepts or declines herself
 const { data } = await c[b]!.rpc('tellher_my_circle'); const req = (data as { connection_id: string; kind: string }[]).find(r => r.kind === 'incoming')!;
 const e2 = await c[b]!.rpc('tellher_respond_trust', { _id: req.connection_id, _accept: true }); if (e2.error) throw e2.error;
};
if (!resume) {
// Eva's direct circle: Giulia, Amira, Elena, Chiara (mutual)
const edges = ['giulia', 'amira', 'elena', 'chiara'].flatMap(m => [{ requester_id: EVA, recipient_id: id[m]!, status: 'accepted' }, { requester_id: id[m]!, recipient_id: EVA, status: 'accepted' }]);
const ins = await admin.from('trust_connections').insert(edges); if (ins.error) throw ins.error;
// Second layer: Nadia and Hana, trusted by Eva's circle
await trust('giulia', 'nadia'); await trust('amira', 'hana'); await trust('elena', 'nadia');
// A pending request for Eva to answer
await trust('valentina', 'eva');
} else { const { data: mine } = await c['giulia']!.rpc('tellher_feed'); for (const q of (mine ?? []) as { id: string; is_mine: boolean }[]) if (q.is_mine) await c['giulia']!.rpc('tellher_delete_question', { _id: q.id }); }

const ask = async (who: string, category: string, body: string, scope: string, instinct: string, note: string | null) => {
 const { data, error } = await c[who]!.rpc('tellher_publish_question', { _category: category, _body: body, _scope: scope, _instinct: instinct, _note: note as string }); if (error) throw error; return data as string;
};
const reply = async (who: string, q: string, tag: string, body: string) => { const { error } = await c[who]!.rpc('tellher_post_reply', { _id: q, _tag: tag, _body: body }); if (error) throw error; };

const q1 = await ask('giulia', 'Housing & Moving', 'My landlord wants to enter the flat for “inspections” almost every week, sometimes with only an hour’s notice. Is this something others have pushed back on?', 'extended', 'feels_off', 'I don’t want to lose the flat.');
await reply('amira', q1, 'address', 'I would put a request in writing for at least 24 hours’ notice and a reason for each visit. It keeps things calm and documented.');
await reply('elena', q1, 'been_there', 'My old landlord did the same. Once I asked for visits to be agreed by message first, it dropped to once a month.');
await reply('chiara', q1, 'more_context', 'I’d want to know what the contract says about access before deciding how firm to be.');

const q2 = await ask('amira', 'Travel', 'A taxi driver from the airport offered to be my “private driver” for the rest of the trip and asked for my hotel name. I said maybe. How would you follow up?', 'extended', 'unsure', null);
await reply('elena', q2, 'watch_wait', 'I’d leave it at maybe and book through the hotel instead. No need to explain.');
await reply('giulia', q2, 'address', 'I would message that you’ve made other arrangements. Short and polite, no hotel details.');
await reply('hana', q2, 'been_there', 'This happened to me in Marrakech. I used the hotel’s driver and felt much more relaxed.');

const q3 = await ask('elena', 'Work', 'A senior colleague keeps asking me to swap night shifts at the last minute and gets cold when I say no. How do I hold the line without making the ward tense?', 'extended', 'unsure', null);
await reply('giulia', q3, 'address', 'I’d say once, clearly, that you can only swap with 48 hours’ notice, and then repeat it the same way every time.');
await reply('chiara', q3, 'watch_wait', 'Maybe keep a note of each request for a few weeks so you have a clearer picture.');

const q4 = await ask('chiara', 'Dating & Boundaries', 'Someone I met at a conference keeps sending long voice notes late at night. He’s friendly, but I didn’t ask for this. Is it okay to just stop replying?', 'community', 'feels_off', null);
await reply('valentina', q4, 'address', 'Yes. You can also send one short message saying you prefer to keep things professional.');
await reply('hana', q4, 'more_context', 'I’d want to know if you’ll see him at work again — that might shape how you end it.');
await reply('amira', q4, 'been_there', 'I simply stopped replying once and it was fine. You don’t owe anyone access to your evenings.');

await ask('nadia', 'Services', 'An electrician quoted me double what a friend paid for similar work and said the price is only valid today. Is that a normal tactic?', 'community', 'feels_off', null);
await ask('amira', 'Everyday Life', 'A new neighbour asked me to sign for her parcels while she’s away for a month. Would you say yes?', 'circle', 'feels_okay', null);

if (process.env['RESUMED_PICKS']) process.exit(0);
const pick = async (who: string, category: string, title: string, note: string, location: string | null) => { const { error } = await c[who]!.from('trusted_picks').insert({ owner_id: id[who]!, category, title, note, location }); if (error) throw error; };
await pick('giulia', 'Housing & Moving', 'A tenants’ advice desk that answers emails', 'They read my contract for free and told me exactly which clauses mattered.', 'Rome · Pigneto');
await pick('amira', 'Travel', 'Airport transfer booked through the hotel', 'Fixed price, driver waited with a name sign, no surprises.', 'Milan Malpensa');
await pick('elena', 'Health & Care', 'A physiotherapist who doesn’t rush', 'She explained every exercise and checked in after a week.', 'Tirana');
await pick('chiara', 'Food & Drink', 'A quiet café where studying alone feels normal', 'Good light, kind staff, and nobody hurries you out.', 'Bologna · Santo Stefano');
console.log('Seeded network around Eva.');
