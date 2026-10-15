import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';

export const AccountContext = createContext<{ user: User | null; ready: boolean }>({ user: null, ready: false });
export function useAccount() { return useContext(AccountContext); }