// Adds fictional activity around the owner's account: picks she owns, Circle replies on her named Ripple, likes and Between Us messages.
// Idempotent: picks match by title, replies are skipped when the member already replied, conversations get messages only once.
import { createClient } from '@supabase/supabase-js';

export async function seedEvaExtras(EVA: string, PASSWORD: string) {
  const url = process.env['SUPABASE_URL']!;
  const admin = createClient(url, process.env['SUPABASE_SERVICE_ROLE_KEY']!, { auth: { persistSession: false } });
  const picks: [string, string, string, string | null][] = [
    ['Dr. Lleshi, gynaecologist', 'Health & Care', 'Listens properly and never rushes you. Booking two weeks ahead is normal.', 'Tirana'],
    ['Antico Forno Roscioli', 'Food & Drink', 'Best pizza bianca in Rome. Go before 11 to avoid the queue.', 'Rome'],
    ['Women-only taxi line (Pink Cab)', 'Travel', 'Felt safe on late arrivals from the airport. Drivers wait inside arrivals.', 'Milan'],
    ['Studio Verde tenancy check', 'Housing & Moving', 'They read my lease for a small fee and spotted two unfair clauses.', 'Rome'],
    ['Sunday market at Porta Portese', 'Everyday Life', 'Cheap vintage finds. Keep your bag in front of you and bring cash.', 'Rome'],
    ['Lavanderia Bolle', 'Services', 'Kind owner, fair prices, will hold your laundry until evening.', null],
  ];
  const { data: have } = await admin.from('trusted_picks').select('title').eq('owner_id', EVA);
  const titles = new Set((have ?? []).map(p => p.title));
  const rows = picks.filter(p => !titles.has(p[0])).map(([title, category, note, location]) => ({ owner_id: EVA, title, category, note, location }));
  if (rows.length) { const r = await admin.from('trusted_picks').insert(rows); if (r.error) throw r.error; }

  const ripple = '8edb1bd9-0e03-422d-89d0-4d3e898b7a8d';
  const friends: [string, string, string][] = [
    ['giulia', 'been_there', 'We did the same trip last summer. Book the ferry early and share one rental car, it saved us a lot.'],
    ['amira', 'more_context', 'How many days do you have? That changes everything about which islands are worth it.'],
    ['elena', 'address', 'Make a shared note with addresses and a check-in time each evening. Small thing, very calming.'],
    ['chiara', 'watch_wait', 'Prices drop a lot in late September if you can be flexible with the dates.'],
  ];
  const replyIds: string[] = [];
  for (const [k, tag, body] of friends) {
    const cl = createClient(url, process.env['SUPABASE_PUBLISHABLE_KEY']!, { auth: { persistSession: false, autoRefreshToken: false } });
    const s = await cl.auth.signInWithPassword({ email: `${k}.demo@example.com`, password: PASSWORD });
    if (s.error) { console.warn(k, s.error.message); continue; }
    const mine = await cl.from('replies').select('id').eq('question_id', ripple).eq('author_id', s.data.user.id);
    if (!mine.data?.length) { const r = await cl.rpc('tellher_post_open_comment', { _id: ripple, _body: body }); if (r.error) console.warn(k, r.error.message); else replyIds.push(r.data); }
    for (const id of replyIds.slice(0, -1)) await cl.rpc('tellher_like_reply', { _reply: id });
    const c = await cl.rpc('tellher_open_conversation', { _member: EVA });
    if (c.error) { console.warn(k, c.error.message); continue; }
    const sent = await cl.from('messages').select('id').eq('conversation_id', c.data).limit(1);
    if (!sent.data?.length) await cl.rpc('tellher_send_message', { _c: c.data, _body: `Hi Eva! I saw your Ripple about the trip — happy to share more details here if useful.` });
  }
  console.log(`Eva extras: ${rows.length} picks, ${replyIds.length} replies.`);
}
