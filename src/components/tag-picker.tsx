import { useQuery } from '@tanstack/react-query';
import { AtSign, X } from 'lucide-react';
import { taggableQuery, type TaggableMember } from '@/lib/notifications';
import { memberName } from '@/lib/circle';

/** Tag picker limited to the member's accepted Direct Circle. Returns selected member ids. */
export function TagPicker({ selected, onChange, id }: { selected: string[]; onChange: (ids: string[]) => void; id: string }) {
 const { data } = useQuery(taggableQuery);
 const members = data ?? [];
 if (!members.length) return null;
 const chosen = members.filter(m => selected.includes(m.member_id));
 const available = members.filter(m => !selected.includes(m.member_id));
 return <div className="tag-picker">
  {chosen.length > 0 && <span className="tag-chosen">{chosen.map(m => <button key={m.member_id} type="button" className="tag-chip" onClick={() => onChange(selected.filter(s => s !== m.member_id))} aria-label={`Remove tag ${memberName(m)}`}><AtSign size={11} />{memberName(m)}<X size={11} /></button>)}</span>}
  {available.length > 0 && <span className="field tag-field"><label htmlFor={id}>Tag someone from your Direct Circle <span className="form-note">(optional — she’ll be notified)</span></label>
   <select id={id} className="ext-select" value="" onChange={e => { if (e.target.value) onChange([...selected, e.target.value]); }}>
    <option value="">Choose a member…</option>
    {available.map((m: TaggableMember) => <option key={m.member_id} value={m.member_id}>{memberName(m)}</option>)}
   </select></span>}
 </div>;
}
