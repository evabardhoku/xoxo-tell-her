import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { memberAvatar } from '@/lib/member.functions';
import type { RippleIdentity } from '@/lib/ripple-identity';
export function RippleAuthor({ identity }: { identity: Partial<RippleIdentity> }) {
 const id = identity.author_visibility === 'named' ? identity.profile_id : null;
 const avatar = useQuery({ queryKey: ['member-avatar', id], enabled: Boolean(id && identity.has_avatar), queryFn: () => id ? memberAvatar({ data: { id } }) : Promise.resolve({ url: null }), staleTime: 240000 });
 if (identity.author_visibility !== 'named' || !identity.first_name) return null;
 return <div className="ripple-author"><span className="member-initial" aria-hidden>{avatar.data?.url ? <img className="h-full w-full rounded-full object-cover" src={avatar.data.url} alt="" /> : identity.first_name.slice(0, 1)}</span>{id ? <Link to="/profile/$memberId" params={{ memberId: id }} className="member-link">{identity.first_name}</Link> : <span>{identity.first_name}</span>}<span className="form-note">· Posted openly</span></div>;
}
