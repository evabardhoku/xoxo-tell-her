import { supabase } from '@/integrations/supabase/client';

export type ProfileDiscussion = { id: string; category: string; body: string; audience_scope: string; created_at: string; reply_count: number };

export const memberRipplesQuery = (memberId: string) => ({
 queryKey: ['member-ripples', memberId],
 queryFn: async () => {
  const { data, error } = await supabase.rpc('tellher_member_ripples', { _member: memberId });
  if (error) throw error;
  return data ?? [];
 },
});

export const myStarsQuery = {
 queryKey: ['private-my-stars'],
 queryFn: async () => {
  const { data, error } = await supabase.rpc('tellher_my_stars');
  if (error) throw error;
  return data ?? [];
 },
};