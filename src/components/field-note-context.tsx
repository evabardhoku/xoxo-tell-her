import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { noteContextQuery, perspectiveCredit } from '@/lib/field-notes';

export function FieldNoteContext({ id }: { id: string }) {
 const context = useQuery(noteContextQuery([id]));
 const c = context.data?.[0];
 if (!c) return null;
 const credit = perspectiveCredit(c.perspective_count);
 return <div className="field-note-context">
  <Link to="/askher/$id" params={{ id: c.question_id }} className="member-link">Written after a Ripple about {c.category.toLowerCase()}</Link>
  {c.identity_revealed && <span className="form-note">The writer chose to connect her identity to this originally anonymous Ripple.</span>}
  {credit && <span className="form-note">{credit}</span>}
 </div>;
}