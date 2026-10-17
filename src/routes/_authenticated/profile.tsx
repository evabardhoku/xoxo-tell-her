import { AvatarStudio } from '@/components/avatar-studio';
import { IllustratedAvatar } from '@/components/avatars';
import { safeOpen } from '@/lib/avatar';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { MapPin, Pencil } from 'lucide-react';
import { ProfileEditor } from '@/components/profile-editor';
import { discoverabilityOptions, profileQuery } from '@/lib/profile';
import { SignOut } from '@/components/app-shell';
import { TrustShelf } from '@/components/trust-shelf';
import { pageHead } from '@/lib/metadata';
import { supabase } from '@/integrations/supabase/client';
import { PrivacyData } from '@/components/privacy-data';

import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_authenticated/profile')({ loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery), head: () => pageHead('Profile', 'Your private TellHer account and profile.'), component: Profile });

function Profile() {
 const { data, refetch } = useSuspenseQuery(profileQuery);
 const [editing, setEditing] = useState(false);
 const { data: avatarUrl } = useQuery({
  queryKey: ['private-avatar', data.avatar_path],
  enabled: Boolean(data.avatar_path),
  queryFn: async () => {
   const { data: signed, error } = await supabase.storage.from('avatars').createSignedUrl(data.avatar_path ?? '', 300);
   if (error) return null;
   return signed.signedUrl;
  },
 });
 const discovery = discoverabilityOptions.find(o => o.value === data.discoverability);
 const isMod = useQuery({ queryKey: ['is-moderator'], queryFn: async () => (await supabase.rpc('tellher_is_moderator')).data === true });
 return <>
  <div className="page-heading"><div><h1>Your profile</h1><p>Your name, your account, your own pace.</p></div></div>

  <section className="circle-card me-header" aria-labelledby="me-title">
   <div className="me-identity">
    {data.open_avatar_type === 'illustrated' && data.open_avatar_config ? <span className="me-avatar avatar-frame" aria-hidden><IllustratedAvatar config={safeOpen(data.open_avatar_config)} size={72} /></span> : avatarUrl ? <img src={avatarUrl} alt="" className="me-avatar" /> : <span className="me-avatar me-initial" aria-hidden>{data.first_name.slice(0, 1).toUpperCase()}</span>}
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

  </section>

  {editing && <div id="profile-editor-region"><ProfileEditor profile={data} onSaved={async () => { await refetch(); setEditing(false); }} /></div>}

  <TrustShelf memberId={data.id} firstName={data.first_name} editable />

  <details className="profile-disclosure"><summary>Open Avatar</summary><AvatarStudio profile={data} photoUrl={avatarUrl} /></details>

  <details className="profile-disclosure"><summary>Privacy &amp; data</summary><PrivacyData userId={data.id} discoverability={discovery?.label} onEditDiscoverability={() => { setEditing(true); requestAnimationFrame(() => document.getElementById('profile-editor-region')?.scrollIntoView({ block: 'start' })); }} /></details>
  {isMod.data && <p className="form-note"><Link to="/admin/reports" className="member-link">Moderation reports</Link></p>}
  <section className="account-settings"><SignOut /></section>
 </>;
}
