import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkle, Newspaper, Users, UserRound, LockKeyhole, LogOut, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { Brand } from './brand';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from '@/hooks/account';
import { profileQuery } from '@/lib/profile';
import { ProfileEditor } from './profile-editor';
import { NotificationBell } from './notification-bell';
import { QuickExit } from './safety';

// The four primary areas (same list on desktop and mobile). `match` lists every route that belongs to the area; each hub page's segmented control keeps its sub-pages reachable.
const navigation = [
 { to: '/feed', label: 'My Feed', icon: Newspaper, match: ['/feed'] },
 { to: '/home', label: 'Sky', icon: Sparkle, match: ['/home', '/constellations', '/wingwoman', '/askher', '/my-ripples', '/ripple'] },
 { to: '/circle', label: 'My Circle', icon: Users, match: ['/circle', '/between-us', '/profile/'] },
 { to: '/profile', label: 'Profile', icon: UserRound, match: [] },
] as const;
const isIn = (pathname: string, paths: readonly string[]) => paths.some(p => p.endsWith('/') ? pathname.startsWith(p) : pathname === p || pathname.startsWith(`${p}/`));
const areaOf = (pathname: string) => pathname === '/profile' ? navigation[3] : navigation.find(i => isIn(pathname, i.match));

export function AppShell({ children }: { children: ReactNode }) {
 const { pathname } = useLocation(); const { user } = useAccount();
 const profile = useQuery({ ...profileQuery, enabled: Boolean(user) });
 if (!user || profile.isPending) return <main className="app-main"><p role="status" className="form-note">Opening your space…</p></main>;
 if (profile.isError) return <main className="app-main"><p role="alert" className="form-note form-error">Your profile could not be loaded.</p><Button variant="outline" onClick={() => profile.refetch()}>Try again</Button><SignOut /></main>;
 if (!profile.data.woman_attested_at) return <><header className="app-header"><Brand /><SignOut /></header><main className="app-main"><ProfileEditor profile={profile.data} onSaved={profile.refetch} /></main></>;
 const area = areaOf(pathname);
 const link = (item: (typeof navigation)[number]) => { const active = area === item; return <Link key={item.to} to={item.to} className="nav-link" data-active={active} aria-current={active ? 'page' : undefined}><item.icon /><span>{item.label}</span></Link>; };
 // Sensitive surfaces: Wingwoman, Ripple detail / shared space, Messages.
 const sensitive = pathname.startsWith('/wingwoman') || pathname.startsWith('/askher/') || pathname.startsWith('/between-us');
 return <><header className="app-header"><Brand /><nav className="desktop-nav" aria-label="Main navigation">{navigation.map(link)}</nav><div className="app-header-actions">
  {sensitive && <QuickExit />}
  <Link to="/search" search={{ q: '' }} className="avatar-link search-link" aria-label="Search TellHer" data-active={pathname === '/search'}><Search size={17} /></Link>
  <NotificationBell />
  <UserMenu initial={profile.data.first_name.slice(0, 1).toUpperCase()} active={pathname === '/profile'} />
 </div></header>
 <main className="app-main">{children}<p className="app-footnote"><LockKeyhole size={12} />A little space. A little perspective. Always your choice.</p></main>
 <nav className="mobile-nav" aria-label="Mobile navigation">{navigation.map(link)}</nav></>;
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

/** Secondary navigation inside a primary area (AskHer, Circle). */
export function SectionTabs({ label, children }: { label: string; children: ReactNode }) {
 return <nav className="section-tabs" aria-label={label}>{children}</nav>;
}
