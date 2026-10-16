import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/** Permanently delete the caller's own account. Profile-linked rows cascade, so private ownership of anonymous Ripples is removed with it. */
export const deleteMyAccount = createServerFn({ method: 'POST' })
 .middleware([requireSupabaseAuth])
 .inputValidator((d: unknown) => z.object({ confirm: z.literal('DELETE') }).parse(d))
 .handler(async ({ context }) => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: files } = await supabaseAdmin.storage.from('avatars').list(context.userId);
  if (files?.length) await supabaseAdmin.storage.from('avatars').remove(files.map(f => `${context.userId}/${f.name}`));
  const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
  if (error) { console.error(error); throw new Error('Your account could not be deleted. Please try again.'); }
  return { ok: true };
 });
