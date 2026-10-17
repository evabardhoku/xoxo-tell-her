import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { circleQuery } from '@/lib/circle';
import { Button } from '@/components/ui/button';

export function ProfileConnection({ memberId }: { memberId: string }) {
 const qc = useQueryClient();
 const circle = useQuery(circleQuery);
 const connection = circle.data?.entries.find(e => e.member_id === memberId);
 const refresh = () => { for (const key of ['my-circle', 'member-profile', 'extended-circle', 'direct-details', 'can-message', 'taggable', 'circle-picks']) void qc.invalidateQueries({ queryKey: [key] }); };
 const send = useMutation({ mutationFn: async () => { const { error } = await supabase.rpc('tellher_send_trust', { _recipient: memberId }); if (error) throw error; }, onSuccess: refresh });
 const respond = useMutation({ mutationFn: async (tier: 'direct' | 'extended' | 'decline') => {
  if (!connection) throw new Error('Request unavailable');
  const { error } = await supabase.rpc('tellher_respond_trust_tier', { _id: connection.connection_id, _circle: tier }); if (error) throw error;
 }, onSuccess: refresh });
 const error = send.error || respond.error;
 return <div className="profile-connection">
  {circle.isError ? <p role="alert" className="form-note form-error">Connection status could not be loaded.</p>
   : connection?.kind === 'direct' || connection?.kind === 'extended' ? <span className="status-label"><Check size={14} />Connected · {connection.kind === 'direct' ? 'Direct Circle' : 'Extended Circle'}</span>
   : connection?.kind === 'outgoing' ? <><span role="status" className="status-label">Connection request sent</span><Link to="/circle" search={{ view: 'requests' }} className="member-link">View request</Link></>
   : connection?.kind === 'incoming' ? <><p className="form-note">She sent you a connection request.</p><div className="connection-choices"><Button size="sm" variant="editorial" disabled={respond.isPending} onClick={() => respond.mutate('direct')}><Check />Accept Direct</Button><Button size="sm" variant="outline" disabled={respond.isPending} onClick={() => respond.mutate('extended')}>Accept Extended</Button><Button size="sm" variant="ghost" disabled={respond.isPending} onClick={() => respond.mutate('decline')}>Decline</Button></div></>
   : <Button variant="editorial" size="sm" disabled={circle.isPending || send.isPending} onClick={() => send.mutate()}><UserPlus />{send.isPending ? 'Sending…' : 'Send connection request'}</Button>}
  {error && <p role="alert" className="form-note form-error">{error.message || 'The request could not be completed.'}</p>}
 </div>;
}