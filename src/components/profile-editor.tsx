import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { LockKeyhole, Upload, UserRound, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from '@/hooks/account';
import { attestationText, discoverabilityOptions, profileSchema, type PrivateProfile } from '@/lib/profile';

export function ProfileEditor({ profile, onSaved }: { profile: PrivateProfile; onSaved: () => Promise<unknown> }) {
 const { user } = useAccount(); const queryClient = useQueryClient();
 const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
 const [avatar, setAvatar] = useState<File | null>(null); const [removeAvatar, setRemoveAvatar] = useState(false);
 const { data: avatarUrl } = useQuery({ queryKey: ['private-avatar', profile.avatar_path], enabled: Boolean(profile.avatar_path), queryFn: async () => {
  if (!profile.avatar_path) return null;
  const { data, error } = await supabase.storage.from('avatars').createSignedUrl(profile.avatar_path, 300);
  if (error) throw error; return data.signedUrl;
 }, staleTime: 240000, refetchInterval: 240000 });
 async function save(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); if (!user) return;
  setBusy(true); setError(''); setMessage(''); const fields = new FormData(event.currentTarget); let uploadedPath: string | null = null;
  try {
   const values = profileSchema.parse({ first_name: fields.get('first_name'), last_name: fields.get('last_name'), city: fields.get('city'), country: fields.get('country'), bio: fields.get('bio'), occupation: fields.get('occupation') ?? '', languages: fields.get('languages') ?? '', known_for: fields.get('known_for') ?? '', ask_me_about: fields.get('ask_me_about') ?? '', discoverability: fields.get('discoverability') ?? 'direct', woman_attested: Boolean(profile.woman_attested_at) || fields.get('woman_attested') === 'on' });
   let path = removeAvatar ? null : profile.avatar_path;
   if (avatar) {
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[avatar.type];
    if (!extension || avatar.size > 5 * 1024 * 1024) throw new Error('Choose a JPG, PNG, or WebP image up to 5 MB.');
    // Decode and re-encode: removes image metadata and rejects files that are not images.
    const bitmap = await createImageBitmap(avatar); const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height)); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d'); if (!context) throw new Error('Image processing is unavailable.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.85)); if (!blob) throw new Error('Could not read this image.');
    path = `${user.id}/${crypto.randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/webp' });
    if (uploadError) throw uploadError; uploadedPath = path;
   }
   const { woman_attested, ...details } = values;
   const { data, error: saveError } = await supabase.from('profiles').update({ ...details, avatar_path: path, ...(profile.woman_attested_at ? {} : { woman_attested_at: new Date().toISOString() }) }).eq('id', user.id).select('id').single();
   if (saveError || !data) throw saveError || new Error('Your profile could not be saved.');
   if (profile.avatar_path && profile.avatar_path !== path) await supabase.storage.from('avatars').remove([profile.avatar_path]);
   await onSaved(); await queryClient.invalidateQueries({ queryKey: ['private-profile'] });
   setAvatar(null); setRemoveAvatar(false); setMessage('Your profile has been saved.');
  } catch (err) {
   if (uploadedPath) await supabase.storage.from('avatars').remove([uploadedPath]);
   setError(err instanceof Error && 'issues' in err ? ((err as unknown as { issues: { message: string }[] }).issues.find(i => /item|40/.test(i.message))?.message ?? 'Please enter your first and last name and confirm the community self-attestation.') : err instanceof Error ? err.message : 'Your profile could not be saved.');
  } finally { setBusy(false); }
 }
 return <section className="profile-panel"><h2>{profile.woman_attested_at ? 'Your private profile' : 'Make yourself at home.'}</h2><p className="form-note mt-3"><LockKeyhole size={12} className="inline mr-2" />Your email and account stay private. Who can see your member profile is up to you below.</p><form className="account-form" onSubmit={save}>
  <div className="grid gap-5 sm:grid-cols-2">{(['first_name', 'last_name'] as const).map((key) => <div className="field" key={key}><label htmlFor={key}>{key === 'first_name' ? 'First name' : 'Last name'}</label><Input id={key} name={key} defaultValue={profile[key]} autoComplete={key === 'first_name' ? 'given-name' : 'family-name'} required maxLength={80} /></div>)}</div>
  <div className="field"><label htmlFor="profile-email">Email address</label><Input id="profile-email" value={user?.email || ''} readOnly /></div>
  <div className="grid gap-5 sm:grid-cols-2">{(['city', 'country'] as const).map(key => <div className="field" key={key}><label htmlFor={key}>{key === 'city' ? 'City' : 'Country'} <span className="text-muted-foreground">(optional)</span></label><Input id={key} name={key} defaultValue={profile[key] || ''} maxLength={100} autoComplete={key === 'city' ? 'address-level2' : 'country-name'} /></div>)}</div>
  <div className="field"><label htmlFor="bio">Bio <span className="text-muted-foreground">(optional)</span></label><Textarea id="bio" name="bio" defaultValue={profile.bio || ''} maxLength={1000} className="min-h-28 bg-card" /></div>
  <div className="field"><label htmlFor="occupation">Occupation or field of study <span className="text-muted-foreground">(optional)</span></label><Input id="occupation" name="occupation" defaultValue={profile.occupation || ''} maxLength={120} /></div>
  {([['languages', 'Languages', 'Italian, English'], ['known_for', 'Known for', 'Renting in Rome, Solo travel'], ['ask_me_about', 'Ask me about', 'Starting a PhD, Negotiating rotas']] as const).map(([key, label, eg]) => <div className="field" key={key}><label htmlFor={key}>{label} <span className="text-muted-foreground">(optional)</span></label><Input id={key} name={key} defaultValue={profile[key].join(', ')} placeholder={`e.g. ${eg}`} aria-describedby={`${key}-hint`} /><p id={`${key}-hint`} className="form-note">Separate with commas · up to 8</p></div>)}
  <fieldset className="field"><legend className="field-legend">Who can open your member profile?</legend><div className="choice-stack">{discoverabilityOptions.map(o => <label key={o.value} className="discover-option"><input type="radio" name="discoverability" value={o.value} defaultChecked={profile.discoverability === o.value} className="accent-primary" /><span><strong>{o.label}</strong><span>{o.hint}</span></span></label>)}</div><p className="form-note">Your email, private notes, Wingwoman and anonymous questions are never part of your member profile.</p></fieldset>
  <div className="field"><label htmlFor="avatar">Avatar <span className="text-muted-foreground">(optional)</span></label><div className="flex items-center gap-4"><div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-primary">{avatarUrl && !removeAvatar ? <img src={avatarUrl} alt="Your private avatar" className="size-full object-cover" /> : <UserRound />}</div><div className="min-w-0 flex-1"><Input id="avatar" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { setAvatar(e.target.files?.[0] || null); setRemoveAvatar(false); }} /><p className="form-note mt-2">JPG, PNG, or WebP · up to 5 MB</p></div>{profile.avatar_path && <Button type="button" variant="ghost" size="icon" title="Remove avatar" aria-label="Remove avatar" onClick={() => { setRemoveAvatar(true); setAvatar(null); }}><Trash2 /></Button>}</div></div>
  <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" name="woman_attested" required checked={profile.woman_attested_at ? true : undefined} disabled={Boolean(profile.woman_attested_at)} className="mt-1 size-4 shrink-0 accent-primary" />{attestationText}</label>
  {error && <p role="alert" className="form-note form-error">{error}</p>}{message && <p role="status" className="form-note form-success">{message}</p>}
  <Button variant="editorial" disabled={busy}><Upload />{busy ? 'Saving…' : profile.woman_attested_at ? 'Save profile' : 'Save and continue'}</Button>
 </form></section>;
}