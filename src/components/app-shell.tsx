import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Home, MessageCircle, Users, Sparkles, UserRound, Plus, LockKeyhole, LogOut, Search, Mail } from 'lucide-react';
import type { ReactNode } from 'react';
import { Brand } from './brand';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from '@/hooks/account';
import { profileQuery } from '@/lib/profile';
import { ProfileEditor } from './profile-editor';

// Four primary areas; Between Us, Search and Profile are header utilities. `match` lists sub-areas that live under each one (My Ripples and the composer under AskHer).
const navigation = [
 { to: '/home', label: 'The Current', mobile: 'Current', icon: Home, match: ['/home'] },
 { to: '/askher', label: 'AskHer', icon: MessageCircle, match: ['/askher', '/my-ripples', '/ripple', '/constellations'] },
 { to: '/circle', label: 'Circle', icon: Users, match: ['/circle'] },
 { to: '/wingwoman', label: 'Wingwoman', icon: Sparkles, match: ['/wingwoman'] },
] as const;
const mobileOrder = ['/home', '/askher', '/wingwoman', '/circle'];
const isIn = (pathname: string, paths: readonly string[]) => paths.some(p => pathname === p || pathname.startsWith(`${p}/`));

export function AppShell({ children }: { children: ReactNode }) {
 const { pathname } = useLocation(); const { user } = useAccount();
 const profile = useQuery({ ...profileQuery, enabled: Boolean(user) });
 if (!user || profile.isPending) return <main className="app-main"><p role="status" className="form-note">Opening your space…</p></main>;
 if (profile.isError) return <main className="app-main"><p role="alert" className="form-note form-error">Your profile could not be loaded.</p><Button variant="outline" onClick={() => profile.refetch()}>Try again</Button><SignOut /></main>;
 if (!profile.data.woman_attested_at) return <><header className="app-header"><Brand /><SignOut /></header><main className="app-main"><ProfileEditor profile={profile.data} onSaved={profile.refetch} /></main></>;
 const link = (item: (typeof navigation)[number], mobile: boolean) => { const active = isIn(pathname, item.match); return <Link key={item.to} to={item.to} className="nav-link" data-active={active} aria-current={active ? 'page' : undefined}><item.icon /><span>{mobile && 'mobile' in item ? item.mobile : item.label}</span></Link>; };
 const desktop = navigation.map(i => link(i, false));
 const mobile = mobileOrder.map(to => navigation.find(i => i.to === to)!).map(i => link(i, true));
 return <><header className="app-header"><Brand /><nav className="desktop-nav" aria-label="Main navigation">{desktop}</nav><div className="app-header-actions">
  <Link to="/search" search={{ q: '' }} className="avatar-link search-link" aria-label="Search TellHer" data-active={pathname === '/search'}><Search size={17} /></Link>
  <Link to="/between-us" className="avatar-link inbox-link" aria-label="Between Us — private conversations" data-active={isIn(pathname, ['/between-us'])}><Mail size={17} /></Link>
  <Button asChild variant="editorial" className="start-ripple"><Link to="/ripple"><Plus />Start a Trust Ripple</Link></Button>
  <UserMenu initial={profile.data.first_name.slice(0, 1).toUpperCase()} active={pathname === '/profile'} />
 </div></header><main className="app-main">{children}<p className="app-footnote"><LockKeyhole size={12} />A little space. A little perspective. Always your choice.</p></main><nav className="mobile-nav" aria-label="Mobile navigation">{mobile}</nav></>;
}

function UserMenu({ initial, active }: { initial: string; active: boolean }) {
 const signOut = useSignOut();
 return <DropdownMenu><DropdownMenuTrigger className="avatar-link" aria-label="Your account menu" data-active={active}>{initial || <UserRound size={17} />}</DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-48">
   <DropdownMenuItem asChild><Link to="/profile"><UserRound />Profile &amp; settings</Link></DropdownMenuItem>
   <DropdownMenuSeparator />
   <DropdownMenuItem onSelect={() => { void signOut(); }}><LogOut />Sign out</DropdownMenuItem>
  </DropdownMenuContent></DropdownMenu>;
}

function useSignOut() {
 const queryClient = useQueryClient(); const navigate = useNavigate();
 return async () => { await queryClient.cancelQueries(); queryClient.clear(); const { error } = await supabase.auth.signOut(); if (error) return; await navigate({ to: '/auth', replace: true }); };
}
export function SignOut() {
 const signOut = useSignOut();
 return <Button variant="ghost" onClick={() => { void signOut(); }}><LogOut />Sign out</Button>;
}

/** Shared AskHer sub-navigation: Ripples · My Ripples · Constellations, with Start a Ripple as the one primary action. */
export function AskHerTabs() {
 return <div className="section-bar"><nav className="section-tabs" aria-label="AskHer sections"><Link to="/askher" activeOptions={{ exact: true, includeSearch: false }}>Ripples</Link><Link to="/my-ripples" activeOptions={{ includeSearch: false }}>My Ripples</Link><Link to="/constellations">Constellations</Link></nav></div>;
}

/** Secondary navigation inside a primary area (AskHer, Circle). */
export function SectionTabs({ label, children }: { label: string; children: ReactNode }) {
 return <nav className="section-tabs" aria-label={label}>{children}</nav>;
}
