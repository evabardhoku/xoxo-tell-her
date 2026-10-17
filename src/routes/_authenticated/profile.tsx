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
import { TrustedPicks } from '@/components/trusted-picks';
import { pageHead } from '@/lib/metadata';
import { supabase } from '@/integrations/supabase/client';
import { PrivacyData } from '@/components/privacy-data';
import { MemberRipples } from '@/components/profile-discussions';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_authenticated/profile')({ loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery), head: () => pageHead('Profile', 'Your TellHer profile, exactly as other women see it.'), component: Profile });

/** The same viewer-checked profile read other members get — relation 'self' for the owner. */
const asOthersQuery = (id: string) => ({
 queryKey: ['member-profile', id],
 queryFn: async () => {
  const { data, error } = await supabase.rpc('tellher_member_profile', { _id: id });
  if (error) throw error;
  return data?.[0] ?? null;
 },
});

function Profile() {
 const { data, refetch } = useSuspenseQuery(profileQuery);
 const [editing, setEditing] = useState(false);
 const view = useQuery(asOthersQuery(data.id));
 const { data: avatarUrl } = useQuery({
  queryKey: ['private-avatar', data.avatar_path],
  enabled: Boolean(data.avatar_path),
  queryFn: async () => {
   const { data: signed, error } = await supabase.storage.from('avatars').createSignedUrl(data.avatar_path ?? '', 300);
   if (error) return null;
   return signed.signedUrl;
  },
 });
 const isMod = useQuery({ queryKey: ['is-moderator'], queryFn: async () => (await supabase.rpc('tellher_is_moderator')).data === true });
 const m = view.data;
 const place = [m?.city, m?.country].filter(Boolean).join(', ');
 return <>
  <div className="page-heading"><div><h1>Your profile</h1><p>This is exactly how other women see you.</p></div><Button variant="editorial" size="sm" onClick={() => setEditing(true)}><Pencil />Edit profile</Button></div>

  <section className="circle-card me-header me-public" aria-labelledby="me-title">
   <span className="me-halo" aria-hidden />
   <div className="me-identity">
    <span className="me-avatar-wave">
     {data.open_avatar_type === 'illustrated' && data.open_avatar_config ? <span className="me-avatar avatar-frame" aria-hidden><IllustratedAvatar config={safeOpen(data.open_avatar_config)} size={72} /></span> : avatarUrl ? <img src={avatarUrl} alt="" className="me-avatar" /> : <span className="me-avatar me-initial" aria-hidden>{data.first_name.slice(0, 1).toUpperCase()}</span>}
    </span>
    <div>
     <h2 id="me-title">{m?.first_name ?? data.first_name} {m?.last_name ?? data.last_name}</h2>
     {(m?.occupation || place) && <p className="form-note">{m?.occupation}{m?.occupation && place && ' · '}{place && <span className="inline-flex items-center gap-1"><MapPin size={12} />{place}</span>}</p>}
     <span className="trust-context" data-relation="self">This is how members see you</span>
    </div>
   </div>
   {m?.bio && <p className="me-bio">{m.bio}</p>}
   {m && m.languages.length > 0 && <p className="form-note">Speaks {m.languages.join(', ')}</p>}
   {m && m.known_for.length > 0 && <div className="me-tags"><span className="eyebrow">KNOWN FOR</span><div className="choice-row">{m.known_for.map(t => <span key={t} className="choice-chip" data-static>{t}</span>)}</div></div>}
   {m && m.ask_me_about.length > 0 && <div className="me-tags"><span className="eyebrow">ASK ME ABOUT</span><div className="choice-row">{m.ask_me_about.map(t => <span key={t} className="choice-chip" data-static>{t}</span>)}</div></div>}
  </section>

  <TrustedPicks ownerOnly />

  <MemberRipples memberId={data.id} firstName={data.first_name} own />

  <Dialog open={editing} onOpenChange={setEditing}>
   <DialogContent className="profile-edit-dialog" aria-describedby={undefined}>
    <DialogTitle>Edit your profile</DialogTitle>
    <div className="profile-edit-scroll">
     <ProfileEditor profile={data} onSaved={async () => { await refetch(); setEditing(false); }} />
     <details className="profile-disclosure"><summary>Open Avatar</summary><AvatarStudio profile={data} photoUrl={avatarUrl} /></details>
     <details className="profile-disclosure"><summary>Privacy &amp; data</summary><PrivacyData userId={data.id} discoverability={discoverabilityOptions.find(o => o.value === data.discoverability)?.label} onEditDiscoverability={() => {}} /></details>
     {isMod.data && <p className="form-note"><Link to="/admin/reports" className="member-link">Moderation reports</Link></p>}
     <section className="account-settings"><SignOut /></section>
    </div>
   </DialogContent>
  </Dialog>
 </>;
}

