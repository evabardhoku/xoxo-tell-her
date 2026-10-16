import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/**
 * Short-lived avatar link for a member profile. Visibility is decided first by the
 * viewer-checked tellher_member_profile function (as the caller); only then is the
 * private storage path read and signed server-side. The path itself is never returned.
 */
export const memberAvatar = createServerFn({ method: 'POST' })
 .middleware([requireSupabaseAuth])
 .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
 .handler(async ({ data, context }) => {
  const { data: rows, error } = await context.supabase.rpc('tellher_member_profile', { _id: data.id });
  if (error || !rows?.[0]?.has_avatar) return { url: null as string | null };
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: p } = await supabaseAdmin.from('profiles').select('avatar_path').eq('id', data.id).single();
  if (!p?.avatar_path) return { url: null };
  const { data: signed } = await supabaseAdmin.storage.from('avatars').createSignedUrl(p.avatar_path, 300);
  return { url: signed?.signedUrl ?? null };
 });
