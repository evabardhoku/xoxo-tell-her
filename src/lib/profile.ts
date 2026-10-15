import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

export const attestationText = 'I identify as a woman and understand TellHer is a women centered community.';
export const profileSchema = z.object({
 first_name: z.string().trim().min(1, 'First name is required.').max(80),
 last_name: z.string().trim().min(1, 'Last name is required.').max(80),
 city: z.string().trim().max(100).transform(value => value || null),
 country: z.string().trim().max(100).transform(value => value || null),
 bio: z.string().trim().max(1000).transform(value => value || null),
 woman_attested: z.literal(true, { errorMap: () => ({ message: 'Please confirm the community self-attestation.' }) }),
});
export const emailSchema = z.string().trim().email('Enter a valid email address.').max(255);
export const profileQuery = {
 queryKey: ['private-profile'],
 queryFn: async () => {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error('Please sign in again.');
  const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, city, country, bio, avatar_path, woman_attested_at').eq('id', auth.user.id).single();
  if (error) throw error;
  return data;
 },
};
export type PrivateProfile = Awaited<ReturnType<typeof profileQuery.queryFn>>;