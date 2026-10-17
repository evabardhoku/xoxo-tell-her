import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from '@/hooks/account';
import { ScrollPanel } from './scroll-panel';

export type ShelfItem = { kind: string; id: string; title: string; body: string; category: string; location: string | null; created_at: string };
export const shelfQuery = (id: string) => ({
 queryKey: ['trust-shelf', id],
 queryFn: async () => {
  const { data, error } = await supabase.rpc('tellher_member_shelf', { _id: id });
  if (error) throw error;
  return ((data ?? []) as ShelfItem[]).filter(r => r.kind === 'pick');
 },
});

/** Picks a member shares with women who trust her. */
export function TrustShelf({ memberId, firstName }: { memberId: string; firstName: string }) {
 const { user } = useAccount();
 const shelf = useQuery({ ...shelfQuery(memberId), enabled: Boolean(user) });
 if (shelf.isPending) return <p role="status" className="form-note">Loading picks…</p>;
 if (shelf.isError) return <p role="alert" className="form-note form-error">Picks couldn’t be loaded.</p>;
 const picks = shelf.data;
 return <section className="trust-shelf" aria-label={`Picks by ${firstName}`}>
  <h2>Picks by {firstName}</h2>
  {picks.length ? <ScrollPanel label={`Picks by ${firstName}`} className="picks-grid">{picks.map(p => <li key={p.id} className="pick-item pick-square">
   <div className="question-meta"><span className="question-category">{p.category}</span>{p.location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{p.location}</span>}</div>
   <strong className="pick-title">{p.title}</strong><p className="pick-note">{p.body}</p>
  </li>)}</ScrollPanel> : <p className="form-note">No Picks shared with you yet.</p>}
 </section>;
}
