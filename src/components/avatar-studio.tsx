import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Shuffle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AnonymousAvatar, IllustratedAvatar } from '@/components/avatars';
import { ANON_KEYS, ANON_PALETTES, DEFAULT_ANON, OPEN_KEYS, previewAnon, randomOpen, safeAnon, safeOpen, type AnonStyle, type OpenAvatarConfig } from '@/lib/avatar';
import { errorText } from '@/lib/askher';
import { profileQuery, type PrivateProfile } from '@/lib/profile';

/** Two identity modes: a persistent Open Avatar, and a private Undercover style that yields a fresh look per anonymous Ripple. */
export function AvatarStudio({ profile, photoUrl }: { profile: PrivateProfile; photoUrl: string | null | undefined }) {
 const qc = useQueryClient();
 const [kind, setKind] = useState<'photo' | 'illustrated'>(profile.open_avatar_type === 'illustrated' ? 'illustrated' : 'photo');
 const [open, setOpen] = useState<OpenAvatarConfig>(safeOpen(profile.open_avatar_config));
 const [style, setStyle] = useState<AnonStyle>(() => { const { variant: _v, ...s } = safeAnon(profile.anonymous_style_config ?? DEFAULT_ANON); return s; });
 const [preview, setPreview] = useState(() => previewAnon(style));
 const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null); const [busy, setBusy] = useState(false);
 const save = async () => {
  setBusy(true); setNote(null);
  const { error } = await supabase.from('profiles').update({ open_avatar_type: kind, open_avatar_config: open, anonymous_style_config: style }).eq('id', profile.id);
  setBusy(false); if (error) return setNote({ text: errorText(error), error: true });
  setNote({ text: 'Saved.' }); void qc.invalidateQueries({ queryKey: profileQuery.queryKey }); void qc.invalidateQueries({ queryKey: ['open-avatar'] });
 };
 const setAnon = (s: AnonStyle) => { setStyle(s); setPreview(previewAnon(s)); };
 return <section className="avatar-studio" aria-labelledby="studio-title">
  <h2 id="studio-title" className="sky-section-title">Avatar Studio</h2>
  <div className="studio-grid">
   <div className="studio-card">
    <h3>Open Avatar</h3><p className="form-note">How you appear when you post openly.</p>
    <div className="studio-preview"><span className="avatar-frame member-initial studio-big">{kind === 'illustrated' ? <IllustratedAvatar config={open} size={88} /> : photoUrl ? <img src={photoUrl} alt="" className="h-full w-full rounded-full object-cover" /> : profile.first_name.slice(0, 1)}</span><p className="form-note"><strong>{profile.first_name}</strong> · Open Ripple / Comment</p></div>
    <div className="segmented" role="group" aria-label="Open Avatar type"><button type="button" className="segmented-option" aria-pressed={kind === 'photo'} onClick={() => setKind('photo')}>Photo</button><button type="button" className="segmented-option" aria-pressed={kind === 'illustrated'} onClick={() => setKind('illustrated')}>Illustrated</button></div>
    {kind === 'photo' ? <p className="form-note">{photoUrl ? 'Your profile photo is used. Change it from Edit profile.' : 'Add a photo from Edit profile, or choose Illustrated.'}</p> : <>
     {OPEN_KEYS.map(k => <Traits key={k.key} label={k.label} options={k.options} swatch={k.swatch} value={open[k.key]} onChange={v => setOpen({ ...open, [k.key]: v })} />)}
     <Button variant="ghost" size="sm" onClick={() => setOpen(randomOpen())}><Shuffle />Randomize</Button>
    </>}
   </div>
   <div className="studio-card">
    <h3>Undercover Look</h3><p className="form-note">Your style for anonymous sharing. Only you see these settings.</p>
    <div className="studio-preview"><span className="avatar-frame member-initial studio-big"><AnonymousAvatar avatar={preview} size={88} /></span><p className="form-note"><strong>Anonymous</strong> · Anonymous Ripple</p></div>
    {ANON_KEYS.map(k => <Traits key={k.key} label={k.label} options={k.key === 'palette' ? ANON_PALETTES.map(p => p[0]!) : k.options} swatch={k.key === 'palette'} value={style[k.key]} onChange={v => setAnon({ ...style, [k.key]: v })} />)}
    <Button variant="ghost" size="sm" onClick={() => setPreview(previewAnon(style))}><RefreshCw />Generate another preview</Button>
    <p className="form-note">Your anonymous appearance changes between Ripples to help prevent them being linked together.</p>
   </div>
  </div>
  <div className="flex gap-3 items-center"><Button variant="editorial" disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Save avatars'}</Button>{note && <p role={note.error ? 'alert' : 'status'} className={`form-note ${note.error ? 'form-error' : 'form-success'}`}>{note.text}</p>}</div>
 </section>;
}

function Traits({ label, options, value, onChange, swatch }: { label: string; options: string[]; value: number; onChange: (v: number) => void; swatch?: boolean | undefined }) {
 return <fieldset className="studio-traits"><legend>{label}</legend><div className="studio-options">{options.map((o, i) => <button key={o + i} type="button" aria-pressed={value === i} aria-label={swatch ? `${label} ${i + 1}` : o} className={swatch ? 'studio-swatch' : 'studio-chip'} style={swatch ? { background: o } : undefined} onClick={() => onChange(i)}>{swatch ? null : o}</button>)}</div></fieldset>;
}
