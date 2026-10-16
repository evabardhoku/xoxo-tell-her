import { Link } from '@tanstack/react-router';
import type { RippleIdentity } from '@/lib/ripple-identity';
import { AnonymousAvatar, MemberAvatar } from '@/components/avatars';
/** Named: safe first name + Open Avatar. Anonymous: a per-Ripple masked visual only, never linked to anyone. */
export function RippleAuthor({ identity, showAnonymous = false }: { identity: Partial<RippleIdentity>; showAnonymous?: boolean }) {
 const id = identity.author_visibility === 'named' ? identity.profile_id : null;
 if (identity.author_visibility !== 'named' || !identity.first_name) return showAnonymous ? <div className="ripple-author ripple-author--anonymous">{identity.anonymous_avatar ? <span className="member-initial avatar-frame" aria-hidden><AnonymousAvatar avatar={identity.anonymous_avatar} size={34} /></span> : null}<span className="form-note">Anonymous</span></div> : null;
 return <div className="ripple-author"><MemberAvatar id={id} name={identity.first_name} hasPhoto={identity.has_avatar} size={34} />{id ? <Link to="/profile/$memberId" params={{ memberId: id }} className="member-link">{identity.first_name}</Link> : <span>{identity.first_name}</span>}<span className="form-note">· Posted openly</span></div>;
}
