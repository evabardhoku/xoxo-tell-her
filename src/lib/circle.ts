import { supabase } from '@/integrations/supabase/client';

export type CircleEntry = { connection_id: string; kind: 'direct' | 'outgoing' | 'incoming'; first_name: string; last_initial: string; city: string | null; created_at: string; member_id: string };

export const circleQuery = {
 queryKey: ['my-circle'],
 queryFn: async () => {
  const [entries, reach] = await Promise.all([supabase.rpc('tellher_my_circle'), supabase.rpc('tellher_extended_reach_count')]);
  if (entries.error) throw entries.error;
  if (reach.error) throw reach.error;
  return { entries: (entries.data ?? []) as CircleEntry[], extendedCount: reach.data ?? 0 };
 },
};

export const memberName = (m: { first_name: string; last_initial: string }) => `${m.first_name} ${m.last_initial ? `${m.last_initial}.` : ''}`.trim();
