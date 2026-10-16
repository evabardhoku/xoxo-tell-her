import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from '@/hooks/account';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

export const noteTopics = ['Work', 'Study', 'Housing & Moving', 'Travel', 'Health & Care', 'Money', 'Services', 'Everyday Life'] as const;
type ShelfItem = { kind: string; id: string; title: string; body: string; category: string; location: string | null; created_at: string };

export const shelfQuery = (id: string) => ({
 queryKey: ['trust-shelf', id],
 queryFn: async () => {
  const { data, error } = await supabase.rpc('tellher_member_shelf', { _id: id });
  if (error) throw error;
  const rows = (data ?? []) as ShelfItem[];
  return { notes: rows.filter(r => r.kind === 'note'), picks: rows.filter(r => r.kind === 'pick') };
 },
});

/** Trust Shelf: intentionally non-anonymous notes and picks on a member profile. Editable only by the author. */
export function TrustShelf({ memberId, firstName, editable = false }: { memberId: string; firstName: string; editable?: boolean }) {
 const { user } = useAccount();
 const shelf = useQuery({ ...shelfQuery(memberId), enabled: Boolean(user) });
 const qc = useQueryClient(); const refresh = () => qc.invalidateQueries({ queryKey: ['trust-shelf', memberId] });
 const [editing, setEditing] = useState<ShelfItem | 'new' | null>(null);
 const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from('trust_notes').delete().eq('id', id); if (error) throw error; }, onSuccess: refresh });
 if (shelf.isPending) return <p role="status" className="form-note">Loading Trust Shelf…</p>;
 if (shelf.isError) return <p role="alert" className="form-note form-error">The Trust Shelf couldn’t be loaded.</p>;
 const { notes, picks } = shelf.data;
 return <section className="trust-shelf" aria-labelledby="shelf-title">
  <div className="picks-head"><div><div className="eyebrow">TRUST SHELF</div><h2 id="shelf-title">{editable ? 'What you know, under your name' : `What ${firstName} knows`}</h2><p className="form-note">Notes and picks shared deliberately with a real name. Never taken from anonymous questions, replies or Wingwoman.</p></div>{editable && !editing && <Button size="sm" variant="outline" onClick={() => setEditing('new')}><Plus />Write a Trust Note</Button>}</div>
  {editable && editing && <NoteForm note={editing === 'new' ? null : editing} authorId={user!.id} onDone={() => { setEditing(null); refresh(); }} onCancel={() => setEditing(null)} />}
  <h3 className="picks-sub">Trust Notes</h3>
  {notes.length ? <ul className="shelf-list">{notes.map(n => <li key={n.id} className="shelf-note">
   <div className="question-meta"><span className="question-category">{n.category}</span>{n.location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{n.location}</span>}</div>
   <h4>{n.title}</h4><p>{n.body}</p>
   {editable && <div className="pick-foot"><span /><span className="flex gap-1"><Button size="sm" variant="ghost" aria-label={`Edit note ${n.title}`} onClick={() => setEditing(n)}><Pencil /></Button><Button size="sm" variant="ghost" aria-label={`Delete note ${n.title}`} disabled={remove.isPending} onClick={() => remove.mutate(n.id)}><Trash2 /></Button></span></div>}
  </li>)}</ul> : <p className="form-note">{editable ? 'No notes yet. Share something you learned the hard way.' : 'No Trust Notes yet.'}</p>}
  {(picks.length > 0 || editable) && <><h3 className="picks-sub">Trusted Picks</h3>
   {picks.length ? <ul className="pick-list">{picks.map(p => <li key={p.id} className="pick-item"><div className="question-meta"><span className="question-category">{p.category}</span>{p.location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{p.location}</span>}</div><strong className="pick-title">{p.title}</strong><p className="pick-note">{p.body}</p></li>)}</ul> : <p className="form-note">Add picks from MyCircle. They show here only to women who trust you.</p>}</>}
 </section>;
}

function NoteForm({ note, authorId, onDone, onCancel }: { note: ShelfItem | null; authorId: string; onDone: () => void; onCancel: () => void }) {
 const [topic, setTopic] = useState(note?.category ?? ''); const [error, setError] = useState('');
 const save = useMutation({
  mutationFn: async (v: { title: string; body: string; location: string | null }) => {
   const row = { ...v, topic };
   const { error } = note ? await supabase.from('trust_notes').update(row).eq('id', note.id) : await supabase.from('trust_notes').insert({ ...row, author_id: authorId });
   if (error) throw new Error('That note couldn’t be saved. Check the fields and try again.');
  }, onSuccess: onDone, onError: e => setError(e.message),
 });
 const submit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault(); setError(''); const f = new FormData(e.currentTarget);
  const title = String(f.get('title') ?? '').trim(), body = String(f.get('body') ?? '').trim(), location = String(f.get('location') ?? '').trim();
  if (!topic) return setError('Choose a topic.'); if (title.length < 4) return setError('Add a title of at least 4 characters.'); if (body.length < 20) return setError('Write at least 20 characters.');
  save.mutate({ title, body, location: location || null });
 };
 return <form className="pick-form" onSubmit={submit}>
  <fieldset className="field"><legend className="field-legend">Topic</legend><div className="choice-row">{noteTopics.map(c => <button type="button" key={c} className="choice-chip" aria-pressed={topic === c} onClick={() => setTopic(c)}>{c}</button>)}</div></fieldset>
  <div className="field"><label htmlFor="note-title">Title</label><Input id="note-title" name="title" maxLength={140} defaultValue={note?.title} placeholder="e.g. What I check before accepting an internship offer" /></div>
  <div className="field"><label htmlFor="note-body">Your note</label><Textarea id="note-body" name="body" maxLength={3000} defaultValue={note?.body} className="min-h-32" /></div>
  <div className="field"><label htmlFor="note-location">Location (optional)</label><Input id="note-location" name="location" maxLength={120} defaultValue={note?.location ?? ''} /></div>
  {error && <p role="alert" className="form-note form-error">{error}</p>}
  <div className="flex gap-2"><Button type="submit" variant="editorial" size="sm" disabled={save.isPending}>{save.isPending ? 'Saving…' : note ? 'Save changes' : 'Add to my Trust Shelf'}</Button><Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button></div>
  <p className="form-note">Shown on your member profile with your name, to the women your profile setting allows.</p>
 </form>;
}
