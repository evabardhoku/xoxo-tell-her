import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Compass, Heart, LockKeyhole, MapPin, Pencil, Sparkles, Users, Waves } from 'lucide-react';
import { ProfileEditor } from '@/components/profile-editor';
import { discoverabilityOptions, profileQuery } from '@/lib/profile';
import { SignOut } from '@/components/app-shell';
import { TrustShelf } from '@/components/trust-shelf';
import { pageHead } from '@/lib/metadata';
import { supabase } from '@/integrations/supabase/client';
import { instincts } from '@/lib/askher';
import { outcomeStatuses } from '@/lib/outcome';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_authenticated/profile')({ loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery), head: () => pageHead('Me', 'Your private TellHer account and profile.'), component: Profile });

type InstinctRow = { question_id: string; category: string; created_at: string; instinct: string | null; note: string | null; outcome: string | null };
type Impact = { helped: number; trusted_by: number; ripples_started: number; picks_shared: number; instincts: InstinctRow[]; instinct_matched: number };

const impactQuery = {
 queryKey: ['my-impact'],
 queryFn: async () => {
  const { data, error } = await supabase.rpc('tellher_my_impact');
  if (error) throw error;
  return data as unknown as Impact;
 },
};

function Profile() {
 const { data, refetch } = useSuspenseQuery(profileQuery);
 const impact = useQuery(impactQuery);
 const [editing, setEditing] = useState(false);
 const { data: avatarUrl } = useQuery({
  queryKey: ['private-avatar', data.avatar_path],
  enabled: Boolean(data.avatar_path),
  queryFn: async () => {
   const { data: signed, error } = await supabase.storage.from('avatars').createSignedUrl(data.avatar_path!, 300);
   if (error) return null;
   return signed.signedUrl;
  },
 });
 const discovery = discoverabilityOptions.find(o => o.value === data.discoverability);
 const stats: { icon: typeof Heart; label: string; value: number }[] = impact.data ? [
  { icon: Heart, label: 'Women you’ve helped', value: impact.data.helped },
  { icon: Users, label: 'Women who trust you', value: impact.data.trusted_by },
  { icon: Ripple, label: 'Ripples you started', value: impact.data.ripples_started },
  { icon: Sparkles, label: 'Picks you recommended', value: impact.data.picks_shared },
 ] : [];
 const withOutcomes = impact.data?.instincts.filter(i => i.outcome) ?? [];
 return <>
  <div className="page-heading"><div><div className="eyebrow">ME</div><h1>A space that’s yours.</h1><p>Your name, your account, your own pace.</p></div></div>

  <section className="circle-card me-header" aria-labelledby="me-title">
   <div className="me-identity">
    {avatarUrl ? <img src={avatarUrl} alt="" className="me-avatar" /> : <span className="me-avatar me-initial" aria-hidden>{data.first_name.slice(0, 1).toUpperCase()}</span>}
    <div>
     <h2 id="me-title">{data.first_name} {data.last_name}</h2>
     {(data.city || data.country) && <p className="form-note inline-flex items-center gap-1"><MapPin size={12} />{[data.city, data.country].filter(Boolean).join(', ')}</p>}
     {data.occupation && <p className="form-note">{data.occupation}</p>}
    </div>
   </div>
   {data.bio && <p className="me-bio">{data.bio}</p>}
   {data.languages.length > 0 && <p className="form-note">Speaks {data.languages.join(', ')}</p>}
   {data.known_for.length > 0 && <div className="me-tags"><span className="eyebrow">KNOWN FOR</span><div className="choice-row">{data.known_for.map(t => <span key={t} className="choice-chip" data-static>{t}</span>)}</div></div>}
   {data.ask_me_about.length > 0 && <div className="me-tags"><span className="eyebrow">ASK ME ABOUT</span><div className="choice-row">{data.ask_me_about.map(t => <span key={t} className="choice-chip" data-static>{t}</span>)}</div></div>}
   <div className="flex gap-2 flex-wrap mt-4">
    <Button size="sm" variant="outline" onClick={() => setEditing(e => !e)}><Pencil />{editing ? 'Close editor' : 'Edit profile'}</Button>
    <Link to="/profile/$memberId" params={{ memberId: data.id }} className="member-link text-sm self-center">See your member profile as others do</Link>
   </div>
   <p className="form-note mt-3">Discoverability: <strong>{discovery?.label}</strong> — {discovery?.hint} <button type="button" className="member-link" onClick={() => setEditing(true)}>Change</button></p>
  </section>

  {editing && <ProfileEditor profile={data} onSaved={async () => { await refetch(); setEditing(false); }} />}

  {impact.data && <section className="impact-row" aria-label="Your impact">
   {stats.map(s => <div key={s.label} className="impact-card"><s.icon size={16} aria-hidden /><strong>{s.value}</strong><span>{s.label}</span></div>)}
  </section>}
  <p className="form-note impact-note"><LockKeyhole size={12} /> These numbers are only visible to you.</p>

  <TrustShelf memberId={data.id} firstName={data.first_name} editable />

  {impact.data && impact.data.instincts.length > 0 && <section className="circle-card mt-6" aria-labelledby="instinct-title">
   <div className="eyebrow">PRIVATE</div>
   <h2 id="instinct-title">My Instinct history</h2>
   <p className="form-note"><LockKeyhole size={12} /> Only you see this. Your instincts stay unlinked from your anonymous Ripples.</p>
   {withOutcomes.length > 0 && <p className="instinct-insight"><Compass size={14} aria-hidden /> Your instinct matched what happened {impact.data.instinct_matched} {impact.data.instinct_matched === 1 ? 'time' : 'times'}.</p>}
   <ul className="instinct-history">
    {impact.data.instincts.map(i => <li key={i.question_id}>
     <div className="question-meta"><span className="question-category">{i.category}</span><span>{new Date(i.created_at).toLocaleDateString()}</span></div>
     <p className="instinct-line">You started here: <strong>{instincts.find(x => x.value === i.instinct)?.label ?? '—'}</strong></p>
     {i.note && <p className="form-note">{i.note}</p>}
     {i.outcome && <p className="form-note">In the end: {outcomeStatuses.find(o => o.value === i.outcome)?.label ?? i.outcome}</p>}
    </li>)}
   </ul>
  </section>}

  <div className="mt-6"><SignOut /></div>
 </>;
}
