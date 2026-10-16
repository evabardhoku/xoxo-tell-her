import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

export const FIELD_NOTE_MAX = 2500;
export const PERSPECTIVE_CREDIT_MIN = 3;
export const fieldNoteSchema = z.object({
 title: z.string().trim().min(4).max(140),
 body: z.string().trim().min(20).max(FIELD_NOTE_MAX),
 topic: z.enum(['Work', 'Study', 'Housing & Moving', 'Travel', 'Health & Care', 'Money', 'Services', 'Everyday Life']),
 location: z.string().trim().max(120),
});
export const needsIdentityReveal = (ripple: { is_mine: boolean; author_visibility?: string } | undefined) => Boolean(ripple?.is_mine && ripple.author_visibility !== 'named');
export const perspectiveCredit = (count: number | null | undefined) => count != null && count >= PERSPECTIVE_CREDIT_MIN ? `Shaped by ${count} perspectives` : null;
export const noteContextQuery = (ids: string[]) => ({
 queryKey: ['field-note-context', [...ids].sort().join(',')],
 enabled: ids.length > 0,
 queryFn: async () => {
  const r = await supabase.rpc('tellher_field_note_context', { _ids: ids });
  if (r.error) throw r.error;
  return r.data ?? [];
 },
});