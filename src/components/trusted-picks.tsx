import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from '@/hooks/account';
import { Button } from './ui/button';
import { ScrollPanel } from './scroll-panel';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

export const pickCategories = ['Services', 'Food & Drink', 'Health & Care', 'Housing & Moving', 'Travel', 'Everyday Life'] as const;
type Pick = { id: string; title: string; category: string; note: string; location: string | null };

export const picksQuery = {
 queryKey: ['trusted-picks'],
 queryFn: async () => {
  const [mine, circle] = await Promise.all([
   supabase.from('trusted_picks').select('id, title, category, note, location').order('created_at', { ascending: false }),
   supabase.rpc('tellher_circle_picks'),
  ]);
  if (mine.error) throw mine.error; if (circle.error) throw circle.error;
  return { mine: (mine.data ?? []) as Pick[], circle: (circle.data ?? []) as (Pick & { recommender: string })[] };
 },
};

export function PickItem({ p, provenance, children }: { p: Pick; provenance: string; children?: React.ReactNode }) {
 return <li className="pick-item pick-square">
  <div className="question-meta"><span className="question-category">{p.category}</span>{p.location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{p.location}</span>}</div>
  <strong className="pick-title">{p.title}</strong>
  <p className="pick-note" tabIndex={0} aria-label={`Recommendation for ${p.title}`}>{p.note}</p>
  <div className="pick-foot"><span className="form-note">{provenance}</span>{children}</div>
 </li>;
}

export function TrustedPicks({ ownerOnly = false }: { ownerOnly?: boolean }) {
 const { user } = useAccount();
 const picks = useQuery({ ...picksQuery, enabled: Boolean(user) });
 const qc = useQueryClient(); const refresh = () => { qc.invalidateQueries({ queryKey: picksQuery.queryKey }); qc.invalidateQueries({ queryKey: ['trust-shelf'] }); };
 const [open, setOpen] = useState(false); const [category, setCategory] = useState(''); const [error, setError] = useState('');
 const add = useMutation({
  mutationFn: async (v: { title: string; note: string; location: string }) => {
   if (!user) throw new Error('Please sign in again.');
   const { error } = await supabase.from('trusted_picks').insert({ owner_id: user.id, category, title: v.title, note: v.note, location: v.location || null });
   if (error) throw new Error('That pick couldn’t be saved. Check the fields and try again.');
  },
  onSuccess: () => { setOpen(false); setCategory(''); refresh(); }, onError: e => setError(e.message),
 });
 const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from('trusted_picks').delete().eq('id', id); if (error) throw error; }, onSuccess: refresh });
 const submit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault(); setError(''); const f = new FormData(e.currentTarget);
  const title = String(f.get('title') ?? '').trim(), note = String(f.get('note') ?? '').trim(), location = String(f.get('location') ?? '').trim();
  if (!category) return setError('Choose a category.'); if (title.length < 2) return setError('Add a short title.'); if (note.length < 5) return setError('Add a short personal note.');
  add.mutate({ title, note, location });
 };
 return <section className={ownerOnly ? "picks-card owner-picks" : "circle-card picks-card"} aria-labelledby="picks-title">
  <div className="picks-head"><div><h2 id="picks-title">Picks</h2><p className="voice-line">No stars. Just women willing to put their name behind it.</p>{!ownerOnly && <p className="form-note">Recommendations from your Direct Circle.</p>}</div>{!open && <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus />Share a pick</Button>}</div>
  {open && <form className="pick-form" onSubmit={submit}>
   <fieldset className="field"><legend className="field-legend">Category</legend><div className="choice-row">{pickCategories.map(c => <Button variant="ghost" type="button" key={c} className="choice-chip" aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</Button>)}</div></fieldset>
   <div className="field"><label htmlFor="pick-title">Title</label><Input id="pick-title" name="title" maxLength={120} placeholder="e.g. A plumber who explains everything" /></div>
   <div className="field"><label htmlFor="pick-note">Your personal note</label><Textarea id="pick-note" name="note" maxLength={500} placeholder="Why you'd recommend it to a friend" /></div>
   <div className="field"><label htmlFor="pick-location">Location (optional)</label><Input id="pick-location" name="location" maxLength={120} /></div>
   {error && <p role="alert" className="form-note form-error">{error}</p>}
   <div className="flex gap-2"><Button type="submit" variant="editorial" size="sm" disabled={add.isPending}>{add.isPending ? 'Saving…' : 'Share with my circle'}</Button><Button type="button" variant="ghost" size="sm" onClick={() => { setOpen(false); setError(''); }}>Cancel</Button></div>
   <p className="form-note">Shared with women who have you in their Direct Circle, shown with your first name.</p>
  </form>}
  {picks.isPending ? <p role="status" className="form-note">Loading picks…</p> : picks.isError ? <p role="alert" className="form-note form-error">Picks couldn’t be loaded. <Button variant="ghost" size="sm" onClick={() => void picks.refetch()}>Try again</Button></p> : <>
    {ownerOnly && !picks.data.mine.length && <p className="form-note">No picks shared yet.</p>}
{!ownerOnly && (picks.data.circle.length ? <ScrollPanel label="Picks from your circle" className="picks-grid">{picks.data.circle.map(p => <PickItem key={p.id} p={p} provenance={`Recommended by ${p.recommender} · in your Direct Circle`} />)}</ScrollPanel> : <p className="form-note">No picks from your circle yet.</p>)}
    {picks.data.mine.length > 0 && <><h3 className="picks-sub">Your picks</h3><ScrollPanel label="Your picks" className="picks-grid">{picks.data.mine.map(p => <PickItem key={p.id} p={p} provenance="Shared by you"><Button size="sm" variant="ghost" aria-label={`Delete pick ${p.title}`} disabled={remove.isPending} onClick={() => remove.mutate(p.id)}><Trash2 /></Button></PickItem>)}</ScrollPanel></>}
  </>}
 </section>;
}
