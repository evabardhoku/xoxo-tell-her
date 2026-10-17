import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { IllustratedAvatar } from '@/components/avatars';
import { OPEN_KEYS, randomOpen, safeOpen, type OpenAvatarConfig } from '@/lib/avatar';
import { errorText } from '@/lib/askher';
import { profileQuery, type PrivateProfile } from '@/lib/profile';

/** Persistent named avatar; anonymous appearances are automatic. */
export function AvatarStudio({ profile, photoUrl }: { profile: PrivateProfile; photoUrl: string | null | undefined }) {
 const qc = useQueryClient();
 const [kind, setKind] = useState<'photo' | 'illustrated'>(profile.open_avatar_type === 'illustrated' ? 'illustrated' : 'photo');
 const [open, setOpen] = useState<OpenAvatarConfig>(safeOpen(profile.open_avatar_config));
 const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null); const [busy, setBusy] = useState(false);
 const save = async () => {
  setBusy(true); setNote(null);
  const { error } = await supabase.from('profiles').update({ open_avatar_type: kind, open_avatar_config: open }).eq('id', profile.id);
  setBusy(false); if (error) return setNote({ text: errorText(error), error: true });
  setNote({ text: 'Saved.' }); void qc.invalidateQueries({ queryKey: profileQuery.queryKey }); void qc.invalidateQueries({ queryKey: ['open-avatar'] });
 };
 return <section className="avatar-studio" aria-labelledby="studio-title">
  <h2 id="studio-title" className="sky-section-title">Open Avatar</h2>
  <div className="studio-grid studio-grid--open">
   <div className="studio-identity">
    <div className="studio-preview"><span className="avatar-frame member-initial studio-big">{kind === 'illustrated' ? <IllustratedAvatar config={open} size={88} /> : photoUrl ? <img src={photoUrl} alt="" className="h-full w-full rounded-full object-cover" /> : profile.first_name.slice(0, 1)}</span><p className="form-note"><strong>{profile.first_name}</strong><br />Open Avatar</p></div>
    <div className="segmented" role="group" aria-label="Open Avatar type"><Button type="button" variant="ghost" className="segmented-option" aria-pressed={kind === 'photo'} onClick={() => setKind('photo')}>Photo</Button><Button type="button" variant="ghost" className="segmented-option" aria-pressed={kind === 'illustrated'} onClick={() => setKind('illustrated')}>Illustrated</Button></div>
    {kind === 'illustrated' && <Button variant="ghost" size="sm" onClick={() => setOpen(randomOpen())}><Shuffle />Randomize</Button>}
   </div>
   <div className="studio-controls">
    {kind === 'photo' ? <p className="form-note">{photoUrl ? 'Your profile photo is used. Change it from Edit profile.' : 'Add a photo from Edit profile, or choose Illustrated.'}</p> : OPEN_KEYS.map(k => <Traits key={k.key} label={k.label} options={k.options} swatch={k.swatch} value={open[k.key]} onChange={v => setOpen({ ...open, [k.key]: v })} />)}
   </div>
  </div>
  <div className="flex gap-3 items-center"><Button variant="editorial" disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Save avatar'}</Button>{note && <p role={note.error ? 'alert' : 'status'} className={`form-note ${note.error ? 'form-error' : 'form-success'}`}>{note.text}</p>}</div>
 </section>;
}

function Traits({ label, options, value, onChange, swatch }: { label: string; options: string[]; value: number; onChange: (v: number) => void; swatch?: boolean | undefined }) {
 return <fieldset className="studio-traits"><legend>{label}</legend><div className="studio-options">{options.map((o, i) => <Button variant="ghost" key={o + i} type="button" aria-pressed={value === i} aria-label={swatch ? `${label} ${i + 1}` : o} className={swatch ? 'studio-swatch' : 'studio-chip'} style={swatch ? { background: o } : undefined} onClick={() => onChange(i)}>{swatch ? null : o}</Button>)}</div></fieldset>;
}
