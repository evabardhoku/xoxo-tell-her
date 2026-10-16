import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FieldNoteContext } from './field-note-context';

export function RippleFieldNotes({ id }: { id: string }) {
 const notes = useQuery({ queryKey: ['ripple-field-notes', id], queryFn: async () => {
  const r = await supabase.rpc('tellher_ripple_field_notes', { _q: id });
  if (r.error) throw r.error;
  return r.data ?? [];
 } });
 if (!notes.data?.length) return null;
 return <section className="trust-shelf ripple-field-notes" aria-label="Field Notes written after this conversation">
  <h2>Field Notes written after this conversation</h2>
  <ul className="shelf-list">{notes.data.map(n => <li key={n.id} className="shelf-note">
   <span className="question-category">{n.category}</span><h4>{n.title}</h4><p>{n.body}</p>
   <Link to="/profile/$memberId" params={{ memberId: n.member_id }} className="member-link">Shared by {n.first_name}</Link>
   <FieldNoteContext id={n.id} />
  </li>)}</ul>
 </section>;
}