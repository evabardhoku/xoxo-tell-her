import type { User } from '@supabase/supabase-js';

/** Clear private data before exposing a different account; reject stale initialization. */
export function accountLifecycle(options: {
 setUser: (user: User | null) => void;
 setReady: () => void;
 clearCache: () => void;
 refresh: (signedIn: boolean) => void;
}) {
 let active = true;
 let revision = 0;
 let identity: string | null = null;
 const apply = (user: User | null) => {
  if (identity !== (user?.id ?? null)) options.clearCache();
  identity = user?.id ?? null;
  options.setUser(user);
  options.setReady();
 };
 return {
  initial: (user: User | null) => { if (active && revision === 0) apply(user); },
  change: (event: string, user: User | null) => {
   if (!active || !['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) return;
   revision++;
   apply(event === 'SIGNED_OUT' ? null : user);
   options.refresh(event !== 'SIGNED_OUT');
  },
  dispose: () => { active = false; },
 };
}