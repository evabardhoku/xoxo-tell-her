import { supabase } from '@/integrations/supabase/client';
export const membershipQuery = { queryKey: ['membership-access'], queryFn: async () => {
 const { data, error } = await supabase.rpc('tellher_member_ready'); if (error) throw error; return data === true;
}, staleTime: 0 };
export async function requireMembership(client: { rpc: (name: 'tellher_member_ready') => PromiseLike<{ data: unknown; error: unknown }> }) {
 const { data, error } = await client.rpc('tellher_member_ready');
 if (error || data !== true) throw new Error('Confirm your email, complete your profile and redeem an invitation before entering TellHer.');
}
