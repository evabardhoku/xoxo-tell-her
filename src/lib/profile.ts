import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

export const attestationText = 'I identify as a woman and understand TellHer is a women centered community.';
/** Comma-separated input → up to 8 distinct items of 1–40 characters. */
export const tagList = z.string().transform(v => [...new Set(v.split(',').map(t => t.trim()).filter(Boolean))]).pipe(z.array(z.string().max(40, 'Keep each item under 40 characters.')).max(8, 'Up to 8 items per list.'));
export const discoverabilityOptions = [
 { value: 'direct', label: 'Direct Circle only', hint: 'Only women you trust can open your profile.' },
 { value: 'extended', label: 'Direct + Extended Circle', hint: 'Also women trusted by the women you trust.' },
 { value: 'community', label: 'All TellHer women', hint: 'Any signed-in TellHer member.' },
] as const;
export const profileSchema = z.object({
 first_name: z.string().trim().min(1, 'First name is required.').max(80),
 last_name: z.string().trim().min(1, 'Last name is required.').max(80),
 city: z.string().trim().max(100).transform(value => value || null),
 country: z.string().trim().max(100).transform(value => value || null),
 bio: z.string().trim().max(1000).transform(value => value || null),
 occupation: z.string().trim().max(120).transform(value => value || null),
 languages: tagList, known_for: tagList, ask_me_about: tagList,
 discoverability: z.enum(['direct', 'extended', 'community']),
 woman_attested: z.literal(true, { errorMap: () => ({ message: 'Please confirm the community self-attestation.' }) }),
});
export const emailSchema = z.string().trim().email('Enter a valid email address.').max(255);
export const profileQuery = {
 queryKey: ['private-profile'],
 queryFn: async () => {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error('Please sign in again.');
  const { data, error } = await supabase.from('profiles').select('id, created_at, first_name, last_name, city, country, bio, avatar_path, woman_attested_at, languages, occupation, known_for, ask_me_about, discoverability, open_avatar_type, open_avatar_config, anonymous_style_config').eq('id', auth.user.id).single();
  if (error) throw error;
  return data;
 },
};
export type PrivateProfile = Awaited<ReturnType<typeof profileQuery.queryFn>>;