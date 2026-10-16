import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from '@/hooks/account';
import { feedQuery } from '@/lib/askher';
import { FIELD_NOTE_MAX, fieldNoteSchema, needsIdentityReveal } from '@/lib/field-notes';
import { FieldNoteContext } from './field-note-context';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from './ui/alert-dialog';
import { Button } from './ui/button';
import { ScrollPanel } from './scroll-panel';
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

/** Internal shelf, presented as two distinct knowledge types. */
export function TrustShelf({ memberId, firstName, editable = false }: { memberId: string; firstName: string; editable?: boolean }) {
 const { user } = useAccount();
 const shelf = useQuery({ ...shelfQuery(memberId), enabled: Boolean(user) });
 const qc = useQueryClient();
 const refresh = () => { for (const key of ['trust-shelf', 'field-note-context', 'ripple-field-notes', 'search', 'discovery']) qc.invalidateQueries({ queryKey: [key] }); };
 const [editing, setEditing] = useState<ShelfItem | 'new' | null>(null);
 const [topic, setTopic] = useState(''); const [tab, setTab] = useState<'notes' | 'picks'>('notes'); const [place, setPlace] = useState('');
 const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from('trust_notes').delete().eq('id', id); if (error) throw error; }, onSuccess: refresh });
 if (shelf.isPending) return <p role="status" className="form-note">Loading what’s shared…</p>;
 if (shelf.isError) return <p role="alert" className="form-note form-error">Field Notes and Picks couldn’t be loaded.</p>;
 const all = shelf.data; const loc = place.trim().toLowerCase();
 const keep = (r: ShelfItem) => (!topic || r.category === topic) && (!loc || (r.location ?? '').toLowerCase().includes(loc));
 const notes = all.notes.filter(keep), picks = all.picks.filter(keep);
 const topicsHere = Array.from(new Set([...all.notes, ...all.picks].map(r => r.category)));
 return <section className="trust-shelf" aria-label={`Shared by ${firstName}`}>
  <div className="picks-head"><h2>{editable ? 'Shared by you' : `Shared by ${firstName}`}</h2>{editable && !editing && <Button size="sm" variant="outline" onClick={() => { setTab('notes'); setEditing('new'); }}><Plus />Write a Field Note</Button>}</div>
  {editable && editing && user && <NoteForm key={editing === 'new' ? 'new' : editing.id} note={editing === 'new' ? null : editing} authorId={user.id} onDone={() => { setEditing(null); refresh(); }} onCancel={() => setEditing(null)} />}
  <div className="ripple-tabs" role="tablist" aria-label="Shared knowledge"><Button type="button" variant="ghost" role="tab" className="ripple-tab" aria-selected={tab === 'notes'} data-active={tab === 'notes'} onClick={() => setTab('notes')}>Field Notes</Button><Button type="button" variant="ghost" role="tab" className="ripple-tab" aria-selected={tab === 'picks'} data-active={tab === 'picks'} onClick={() => setTab('picks')}>Picks</Button></div>
  {all.notes.length + all.picks.length > 1 && <div className="shelf-filters" role="search" aria-label="Filter shared knowledge">
   <div className="field"><label htmlFor={`shelf-topic-${memberId}`}>Topic</label><select id={`shelf-topic-${memberId}`} className="ext-select" value={topic} onChange={e => setTopic(e.target.value)}><option value="">All topics</option>{topicsHere.map(t => <option key={t}>{t}</option>)}</select></div>
   <div className="field"><label htmlFor={`shelf-loc-${memberId}`}>Location</label><Input id={`shelf-loc-${memberId}`} value={place} onChange={e => setPlace(e.target.value)} placeholder="e.g. Rome" /></div>
  </div>}
  {tab === 'notes' && (notes.length ? <ScrollPanel label="Field Notes" className="shelf-list">{notes.map(n => <li key={n.id} className="shelf-note">
   <div className="question-meta"><span className="question-category">{n.category}</span>{n.location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{n.location}</span>}</div>
   <h4>{n.title}</h4><p>{n.body}</p><FieldNoteContext id={n.id} />
   {editable && <div className="pick-foot"><span /><span className="flex gap-1"><Button size="sm" variant="ghost" aria-label={`Edit note ${n.title}`} onClick={() => setEditing(n)}><Pencil /></Button><Button size="sm" variant="ghost" aria-label={`Delete note ${n.title}`} disabled={remove.isPending} onClick={() => remove.mutate(n.id)}><Trash2 /></Button></span></div>}
  </li>)}</ScrollPanel> : <p className="form-note">{topic || loc ? 'No Field Notes match these filters.' : editable ? 'No Field Notes yet. What did your experience teach you?' : 'No Field Notes shared yet.'}</p>)}
  {remove.isError && <p className="form-note form-error" role="alert">This Field Note couldn’t be deleted. Please try again.</p>}
  {tab === 'picks' && (picks.length ? <ScrollPanel label="Picks" className="pick-list">{picks.map(p => <li key={p.id} className="pick-item"><div className="question-meta"><span className="question-category">{p.category}</span>{p.location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{p.location}</span>}</div><strong className="pick-title">{p.title}</strong><p className="pick-note">{p.body}</p></li>)}</ScrollPanel> : <p className="form-note">{topic || loc ? 'No Picks match these filters.' : editable ? 'Share a Pick in Circle. It appears here for women who trust you.' : 'No Picks shared with you yet.'}</p>)}
 </section>;
}

type Values = { title: string; body: string; location: string; topic: typeof noteTopics[number] };
function NoteForm({ note, authorId, onDone, onCancel }: { note: ShelfItem | null; authorId: string; onDone: () => void; onCancel: () => void }) {
 const feed = useQuery(feedQuery);
 const original = useQuery({ queryKey: ['own-field-note-link', note?.id], enabled: Boolean(note), queryFn: async () => { if (!note) return null; const r = await supabase.from('trust_notes').select('linked_ripple_id').eq('id', note.id).eq('author_id', authorId).single(); if (r.error) throw r.error; return r.data; } });
 const [title, setTitle] = useState(note?.title ?? ''); const [body, setBody] = useState(note?.body ?? '');
 const [topic, setTopic] = useState(note?.category ?? ''); const [location, setLocation] = useState(note?.location ?? '');
 const [linkChoice, setLinkChoice] = useState<string | null>(null); const [error, setError] = useState(''); const [pending, setPending] = useState<Values | null>(null);
 const ripple = linkChoice ?? original.data?.linked_ripple_id ?? '';
 const changed = ripple !== (original.data?.linked_ripple_id ?? '');
 const save = useMutation({ mutationFn: async ({ values, confirm }: { values: Values; confirm: boolean }) => {
  const r = await supabase.rpc('tellher_save_field_note', { _id: note?.id, _title: values.title, _body: values.body, _topic: values.topic, _location: values.location, _ripple: ripple || undefined, _confirm_reveal: confirm });
  if (r.error) throw new Error(r.error.message);
 }, onSuccess: onDone, onError: e => { setPending(null); setError(e.message); } });
 const submit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault(); setError('');
  const parsed = fieldNoteSchema.safeParse({ title, body, topic, location });
  if (!parsed.success) return setError('Add a title (4–140 characters), a topic, and 20–2,500 characters about what you learned.');
  if (changed && needsIdentityReveal(feed.data?.find(q => q.id === ripple))) return setPending(parsed.data);
  save.mutate({ values: parsed.data, confirm: false });
 };
 return <><form className="pick-form" onSubmit={submit}>
  <div className="field"><label htmlFor="note-title">Title</label><Input id="note-title" maxLength={140} value={title} onChange={e => setTitle(e.target.value)} placeholder="What I wish I’d known before moving alone" /></div>
  <div className="field"><label htmlFor="note-body">What did you learn?</label><Textarea id="note-body" maxLength={FIELD_NOTE_MAX} value={body} onChange={e => setBody(e.target.value)} className="min-h-48" placeholder="Share what you learned, what surprised you, or what you’d tell another woman facing the same thing." /><span className="form-note">{body.length.toLocaleString()} / 2,500</span></div>
  <div className="field"><label htmlFor="note-topic">Topic</label><select id="note-topic" className="ext-select" value={topic} onChange={e => setTopic(e.target.value)}><option value="">Choose a topic</option>{noteTopics.map(t => <option key={t}>{t}</option>)}</select></div>
  <div className="field"><label htmlFor="note-location">Location (optional)</label><Input id="note-location" maxLength={120} value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Turin" /></div>
  <div className="field"><label htmlFor="note-ripple">Written after a Ripple (optional)</label><select id="note-ripple" className="ext-select" value={ripple} disabled={feed.isPending || Boolean(note && original.isPending)} onChange={e => setLinkChoice(e.target.value)}><option value="">No linked Ripple</option>{original.data?.linked_ripple_id && !feed.data?.some(q => q.id === original.data?.linked_ripple_id) && <option value={original.data.linked_ripple_id}>Existing linked Ripple (not currently available)</option>}{feed.data?.map(q => <option key={q.id} value={q.id}>{q.category} · {q.body.slice(0, 90)}{q.is_mine ? ' · Yours' : ''}</option>)}</select></div>
  {error && <p role="alert" className="form-note form-error">{error}</p>}
  <div className="flex gap-2 flex-wrap"><Button type="submit" variant="editorial" size="sm" disabled={save.isPending || Boolean(note && (original.isPending || original.isError))}>{save.isPending ? 'Saving…' : note ? 'Save changes' : 'Share Field Note'}</Button><Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button></div>
  <p className="form-note">Shared under your name, with the women your profile setting allows.</p>
 </form><AlertDialog open={Boolean(pending)} onOpenChange={open => { if (!open && !save.isPending) setPending(null); }}><AlertDialogContent>
  <AlertDialogTitle>This Ripple was originally anonymous.</AlertDialogTitle>
  <AlertDialogDescription>Linking this Field Note will publicly connect your identity to that Ripple.<br /><br />Once people have seen that connection, it cannot be taken back.<br /><br />Continue?</AlertDialogDescription>
  <AlertDialogFooter><AlertDialogCancel disabled={save.isPending}>Cancel</AlertDialogCancel><Button variant="editorial" disabled={save.isPending} onClick={() => { if (pending) save.mutate({ values: pending, confirm: true }); }}>{save.isPending ? 'Saving…' : 'Link and reveal my identity'}</Button></AlertDialogFooter>
 </AlertDialogContent></AlertDialog></>;
}
