import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { canMessageQuery } from '@/lib/between-us';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { ArrowLeft, LockKeyhole, Mail, MapPin } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { pageHead } from '@/lib/metadata';
import { memberAvatar } from '@/lib/member.functions';
import { TrustShelf } from '@/components/trust-shelf';

const memberQuery = (id: string) => ({
 queryKey: ['member-profile', id],
 queryFn: async () => {
  if (!z.string().uuid().safeParse(id).success) return null;
  const { data, error } = await supabase.rpc('tellher_member_profile', { _id: id });
  if (error) throw error;
  return data?.[0] ?? null;
 },
});

export const Route = createFileRoute('/_authenticated/profile_/$memberId')({
 loader: ({ context, params }) => context.queryClient.ensureQueryData(memberQuery(params.memberId)),
 head: () => pageHead('Member profile', 'A TellHer member, shared only with the women she chooses.'),
 errorComponent: () => <p role="alert" className="form-note form-error">This profile could not be loaded. Please refresh.</p>,
 notFoundComponent: () => <Unavailable />,
 component: MemberProfile,
});

function Unavailable() {
 return <section className="empty-panel"><LockKeyhole /><h2>This profile isn’t shared with you.</h2><p>Members choose who can see their profile. It may be limited to her own circle.</p><Link to="/circle" className="member-link mt-4 inline-block">Back to Circle</Link></section>;
}

const context = (r: string, via: string | null) => r === 'self' ? 'This is how members see you' : r === 'direct' ? 'In your Direct Circle' : r === 'extended' ? `Extended Circle${via ? ` via ${via}` : ''}` : 'TellHer community member';

function MemberProfile() {
 const { memberId } = Route.useParams();
 const { data: m } = useSuspenseQuery(memberQuery(memberId));
 const avatar = useQuery({ queryKey: ['member-avatar', memberId], enabled: Boolean(m?.has_avatar), queryFn: () => memberAvatar({ data: { id: memberId } }), staleTime: 240000 });
 if (!m) return <><BackLink /><Unavailable /></>;
 const place = [m.city, m.country].filter(Boolean).join(', ');
 const lists = [['Known for', m.known_for], ['Ask me about', m.ask_me_about], ['Languages', m.languages]] as const;
 return <>
  <BackLink />
  <article className="member-profile">
   <header className="member-head">
    <div className="member-avatar" aria-hidden>{avatar.data?.url ? <img src={avatar.data.url} alt="" /> : m.first_name.slice(0, 1).toUpperCase()}</div>
    <div><h1>{m.first_name} {m.last_name.length === 1 ? `${m.last_name}.` : m.last_name}</h1>
     {(m.occupation || place) && <p className="form-note">{m.occupation}{m.occupation && place && ' · '}{place && <><MapPin size={12} className="inline mr-1" />{place}</>}</p>}
     <span className="trust-context" data-relation={m.relation}>{context(m.relation, m.via)}</span>
     {m.bio && <p className="member-bio">{m.bio}</p>}
     {m.known_for.length > 0 && <ul className="tag-list mt-3">{m.known_for.map(t => <li key={t}>{t}</li>)}</ul>}
     <MessageHer memberId={memberId} />{m.relation === 'extended' && <Button asChild variant="editorial" size="sm" className="mt-3"><Link to="/circle">Request a Trust Bridge</Link></Button>}</div>
   </header>
   {lists.slice(1).map(([label, items]) => items.length > 0 && <section key={label} className="member-section"><h2>{label}</h2><ul className="tag-list">{items.map(t => <li key={t}>{t}</li>)}</ul></section>)}
   {!m.bio && lists.every(([, i]) => !i.length) && <p className="form-note member-section">She hasn’t added more about herself yet.</p>}
  </article>
  <TrustShelf memberId={memberId} firstName={m.first_name} />
 </>;
}

function BackLink() { return <Link to="/circle" className="member-link mb-6 inline-flex items-center gap-2 text-sm"><ArrowLeft size={14} />Circle</Link>; }

/** Between Us is offered only when the checked database rule allows it (accepted Direct Circle, no block). */
function MessageHer({ memberId }: { memberId: string }) {
 const can = useQuery(canMessageQuery(memberId)); const navigate = useNavigate(); const [err, setErr] = useState('');
 if (!can.data) return null;
 const open = async () => { const { data, error } = await supabase.rpc('tellher_open_conversation', { _member: memberId }); if (error || !data) return setErr('This conversation couldn’t be opened.'); navigate({ to: '/between-us/$conversationId', params: { conversationId: data } }); };
 return <div className="mt-3"><Button variant="editorial" size="sm" onClick={open}><Mail />Message her</Button>{err && <p role="alert" className="form-note form-error">{err}</p>}</div>;
}
