import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Home, MessageCircle, Users, Sparkles, UserRound, Plus, LockKeyhole, LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { Brand } from './brand';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from '@/hooks/account';

const navigation = [{ to: '/home', label: 'Home', icon: Home }, { to: '/askher', label: 'AskHer', icon: MessageCircle }, { to: '/circle', label: 'MyCircle', mobile: 'Circle', icon: Users }, { to: '/wingwoman', label: 'Wingwoman', icon: Sparkles }, { to: '/profile', label: 'Profile', icon: UserRound }] as const;
export function AppShell({ children }: { children: ReactNode }) {
 const { pathname } = useLocation(); const { user } = useAccount();
 const nav = (mobile: boolean) => navigation.filter(item => !mobile || item.to !== '/profile').map(item => <Link key={item.to} to={item.to} className="nav-link" data-active={pathname === item.to} aria-current={pathname === item.to ? 'page' : undefined}><item.icon /><span>{mobile && 'mobile' in item ? item.mobile : item.label}</span></Link>);
 return <><header className="app-header"><Brand /><nav className="desktop-nav" aria-label="Main navigation">{nav(false)}</nav><div className="app-header-actions"><Button asChild variant="editorial" className="start-ripple"><Link to="/ripple"><Plus />Start a Ripple</Link></Button><Link to="/profile" className="avatar-link" aria-label="Your profile">{user?.user_metadata?.display_name?.slice(0, 1)?.toUpperCase() || <UserRound size={17} />}</Link></div></header><main className="app-main">{children}<p className="app-footnote"><LockKeyhole size={12} />A little space. A little perspective. Always your choice.</p></main><nav className="mobile-nav" aria-label="Mobile navigation">{nav(true)}</nav></>;
}
export function SignOut() {
 const queryClient = useQueryClient(); const navigate = useNavigate();
 return <Button variant="ghost" onClick={async () => { await queryClient.cancelQueries(); queryClient.clear(); const { error } = await supabase.auth.signOut(); if (error) return; await navigate({ to: '/auth', replace: true }); }}><LogOut />Sign out</Button>;
}