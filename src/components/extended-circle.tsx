import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { memberAvatar } from '@/lib/member.functions';
import { circleQuery, type CircleEntry } from '@/lib/circle';
import { ScrollPanel } from './scroll-panel';

export type ExtendedMember = { member_id: string; first_name: string; last_initial: string; city: string | null; country: string | null; known_for: string[]; ask_me_about: string[]; has_avatar: boolean; via: string; via_id: string; bridge_pending: boolean };
type Field = 'all' | 'name' | 'location' | 'known' | 'ask';

const fields: Record<Exclude<Field, 'all'>, (m: ExtendedMember) => string[]> = {
 name: m => [m.first_name, m.last_initial],
 location: m => [m.city ?? '', m.country ?? ''],
 known: m => m.known_for,
 ask: m => m.ask_me_about,
};
export function matchesExtended(m: ExtendedMember, text: string, field: Field) {
 const q = text.trim().toLowerCase(); if (!q) return true;
 const vals = field === 'all' ? Object.values(fields).flatMap(f => f(m)) : fields[field](m);
 return vals.some(v => v.toLowerCase().includes(q));
}

export function ExtendedCircle({ direct }: { direct: CircleEntry[] }) {
 const [via, setVia] = useState(''); const [text, setText] = useState(''); const [field, setField] = useState<Field>('all');
 const qc = useQueryClient();
 const list = useQuery({ queryKey: ['extended-circle', via], queryFn: async () => { const { data, error } = await supabase.rpc('tellher_extended_circle', via ? { _via: via } : {}); if (error) throw error; return (data ?? []) as ExtendedMember[]; } });
 const bridge = useMutation({
  mutationFn: async (id: string) => { const { error } = await supabase.rpc('tellher_send_trust', { _recipient: id }); if (error) throw error; },
  onSuccess: () => { qc.invalidateQueries({ queryKey: ['extended-circle'] }); qc.invalidateQueries({ queryKey: circleQuery.queryKey }); },
 });
 const shown = useMemo(() => (list.data ?? []).filter(m => matchesExtended(m, text, field)), [list.data, text, field]);
 return <section className="circle-card extended-discovery" aria-labelledby="ext-h">
  <h2 id="ext-h">Extended Circle</h2>
  <p className="form-note">Women trusted by your Direct Circle who chose to be discoverable here. Others stay counted only, never named.</p>
  <details><summary className="form-note">Filter women</summary><div className="ext-filters">
   <div className="field"><label htmlFor="ext-q">Search</label><Input id="ext-q" value={text} onChange={e => setText(e.target.value)} placeholder="Name, city, topic…" /></div>
   <div className="field"><label htmlFor="ext-f">Search in</label><select id="ext-f" className="ext-select" value={field} onChange={e => setField(e.target.value as Field)}><option value="all">Everything</option><option value="name">Name</option><option value="location">Location</option><option value="known">Known for</option><option value="ask">Ask me about</option></select></div>
   <div className="field"><label htmlFor="ext-v">Connected through</label><select id="ext-v" className="ext-select" value={via} onChange={e => setVia(e.target.value)}><option value="">Anyone in my Direct Circle</option>{direct.map(d => <option key={d.member_id} value={d.member_id}>{d.first_name}</option>)}</select></div>
  </div></details>
  {list.isLoading ? <p role="status" className="form-note">Finding women connected through your Direct Circle…</p> : list.isError ? <p role="alert" className="form-note form-error">Extended Circle could not be loaded.</p>
   : shown.length ? <ScrollPanel label="Extended Circle" className="ext-grid">{shown.map(m => <ExtCard key={m.member_id} m={m} busy={bridge.isPending} onBridge={() => bridge.mutate(m.member_id)} />)}</ScrollPanel>
   : list.data?.length ? <p className="form-note">No one matches these filters.</p> : <p className="form-note">No one in your Extended Circle yet. <Link to="/circle" search={{ view: 'direct' }} className="member-link">Add someone you trust</Link></p>}
  {bridge.isError && <p role="alert" className="form-note form-error">{(bridge.error as { message?: string }).message || 'Request could not be sent.'}</p>}
 </section>;
}

function ExtCard({ m, busy, onBridge }: { m: ExtendedMember; busy: boolean; onBridge: () => void }) {
 const avatar = useQuery({ queryKey: ['member-avatar', m.member_id], enabled: m.has_avatar, queryFn: () => memberAvatar({ data: { id: m.member_id } }), staleTime: 240000 });
 const place = [m.city, m.country].filter(Boolean).join(', ');
 const name = `${m.first_name} ${m.last_initial ? `${m.last_initial}.` : ''}`.trim();
 return <li className="ext-card">
  <div className="ext-head"><span className="member-avatar ext-avatar" aria-hidden>{avatar.data?.url ? <img src={avatar.data.url} alt="" /> : m.first_name.slice(0, 1).toUpperCase()}</span>
   <div className="member-meta"><Link to="/profile/$memberId" params={{ memberId: m.member_id }} className="member-link"><strong>{name}</strong></Link>{place && <span><MapPin size={12} className="inline mr-1" />{place}</span>}</div></div>
  <span className="trust-context">Connected through {m.via}</span>
  {m.known_for.length > 0 && <div><span className="ext-label">Known for</span><ul className="tag-list">{m.known_for.map(t => <li key={t}>{t}</li>)}</ul></div>}
  {m.ask_me_about.length > 0 && <div><span className="ext-label">Ask me about</span><ul className="tag-list">{m.ask_me_about.map(t => <li key={t}>{t}</li>)}</ul></div>}
  {m.bridge_pending ? <span className="status-label">Connection pending</span> : <Button size="sm" variant="editorial" disabled={busy} onClick={onBridge}>Connect</Button>}
 </li>;
}
