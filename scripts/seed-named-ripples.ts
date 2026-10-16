import { createClient } from '@supabase/supabase-js';
/** Add practical named examples only; never recreate historical demo Ripples. */
export async function seedNamedRipples() {
 const url = process.env['SUPABASE_URL']; const pub = process.env['SUPABASE_PUBLISHABLE_KEY'];
 if (!url || !pub) throw new Error('Demo access unavailable');
 const examples = [
  ['amira', 'Travel', 'I’m planning a weekend in Porto. Which neighbourhood would you choose for walking, good cafés and easy train connections?', 'community'],
  ['giulia', 'Housing & Moving', 'I’m considering moving abroad to Lisbon. What practical paperwork would you sort out before looking for a long-term rental?', 'community'],
  ['chiara', 'Work', 'I’m comparing a part-time postgraduate course with a paid internship. Which practical questions helped you compare the workload and learning opportunities?', 'community'],
  ['amira', 'Travel', 'Has anyone here done a weekend solo trip to Vienna?', 'circle'],
  ['giulia', 'Work', 'I’m applying for a research internship in Milan — any advice?', 'extended'],
  ['chiara', 'Housing & Moving', 'What is one thing you wish you’d known before moving abroad?', 'community'],
 ] as const;
 for (const [who, category, body, scope = 'community'] of examples as readonly (readonly [string, string, string, string?])[]) {
  const client = createClient(url, pub, { auth: { persistSession: false, autoRefreshToken: false } });
  const login = await client.auth.signInWithPassword({ email: `${who}.demo@example.com`, password: 'TellHerDemo-2026' }); if (login.error) throw login.error;
  const feed = await client.rpc('tellher_feed'); if (feed.error) throw feed.error;
  if (feed.data?.some((r: { body: string; is_mine: boolean }) => r.is_mine && r.body === body)) continue;
  const r = await client.rpc('tellher_publish_question_identity', { _category: category, _body: body, _scope: scope, _instinct: 'feels_okay', _note: null, _author_visibility: 'named' }); if (r.error) throw r.error;
 }
 console.log('Practical named examples retained alongside anonymous history.');
}
