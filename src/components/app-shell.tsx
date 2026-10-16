import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Home, MessageCircle, Users, Sparkles, UserRound, Plus, LockKeyhole, LogOut, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { Brand } from './brand';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from '@/hooks/account';
import { profileQuery } from '@/lib/profile';
import { ProfileEditor } from './profile-editor';

const navigation = [{ to: '/home', label: 'Home', icon: Home }, { to: '/askher', label: 'AskHer', icon: MessageCircle }, { to: '/circle', label: 'MyCircle', mobile: 'Circle', icon: Users }, { to: '/wingwoman', label: 'Wingwoman', icon: Sparkles }, { to: '/profile', label: 'Profile', icon: UserRound }] as const;
export function AppShell({ children }: { children: ReactNode }) {
 const { pathname } = useLocation(); const { user } = useAccount();
 const profile = useQuery({ ...profileQuery, enabled: Boolean(user) });
 if (!user || profile.isPending) return <main className="app-main"><p role="status" className="form-note">Opening your space…</p></main>;
 if (profile.isError) return <main className="app-main"><p role="alert" className="form-note form-error">Your profile could not be loaded.</p><Button variant="outline" onClick={() => profile.refetch()}>Try again</Button><SignOut /></main>;
 if (!profile.data.woman_attested_at) return <><header className="app-header"><Brand /><SignOut /></header><main className="app-main"><ProfileEditor profile={profile.data} onSaved={profile.refetch} /></main></>;
 const nav = (mobile: boolean) => navigation.filter(item => !mobile || item.to !== '/profile').map(item => <Link key={item.to} to={item.to} className="nav-link" data-active={pathname === item.to} aria-current={pathname === item.to ? 'page' : undefined}><item.icon /><span>{mobile && 'mobile' in item ? item.mobile : item.label}</span></Link>);
 return <><header className="app-header"><Brand /><nav className="desktop-nav" aria-label="Main navigation">{nav(false)}</nav><div className="app-header-actions"><Link to="/search" search={{ q: '' }} className="avatar-link search-link" aria-label="Search TellHer" data-active={pathname === '/search'}><Search size={17} /></Link><Button asChild variant="editorial" className="start-ripple"><Link to="/ripple"><Plus />Start a Ripple</Link></Button><Link to="/profile" className="avatar-link" aria-label="Your profile">{profile.data.first_name.slice(0, 1).toUpperCase() || <UserRound size={17} />}</Link></div></header><main className="app-main">{children}<p className="app-footnote"><LockKeyhole size={12} />A little space. A little perspective. Always your choice.</p></main><nav className="mobile-nav" aria-label="Mobile navigation">{nav(true)}</nav></>;
}
export function SignOut() {
 const queryClient = useQueryClient(); const navigate = useNavigate();
 return <Button variant="ghost" onClick={async () => { await queryClient.cancelQueries(); queryClient.clear(); const { error } = await supabase.auth.signOut(); if (error) return; await navigate({ to: '/auth', replace: true }); }}><LogOut />Sign out</Button>;
}