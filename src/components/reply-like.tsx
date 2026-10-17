import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { replyLikesQuery } from '@/lib/notifications';
import { errorText } from '@/lib/askher';

/** Checked anonymous counts only; never reads or reveals the women who liked. */
export function ReplyLike({ reply, questionId }: { reply: { id: string; is_mine: boolean }; questionId: string }) {
 const qc = useQueryClient();
 const query = replyLikesQuery(questionId);
 const likes = useQuery(query);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const state = likes.data?.[reply.id];
 const toggle = async () => {
  if (!state || busy || reply.is_mine) return;
  setBusy(true); setError('');
  try {
   const result = await supabase.rpc(state.mine ? 'tellher_unlike_reply' : 'tellher_like_reply', { _reply: reply.id });
   if (result.error) throw result.error;
   await qc.invalidateQueries({ queryKey: query.queryKey });
  } catch (e) { setError(errorText(e)); }
  finally { setBusy(false); }
 };
 return <div className="perspective-like-row">
  {likes.isError ? <p className="form-note form-error" role="alert">Likes could not be loaded. <Button variant="link" size="sm" onClick={() => void likes.refetch()}>Retry</Button></p>
   : reply.is_mine ? <span className="perspective-own-likes" aria-label={`${state?.likes ?? 0} likes`}><Heart size={16} /><span>{state?.likes ?? 0}</span></span>
   : <Button type="button" variant="ghost" className="perspective-like" aria-label={state?.mine ? 'Unlike perspective' : 'Like perspective'} aria-pressed={state?.mine ?? false} disabled={busy || !state} onClick={() => void toggle()}><Heart size={16} /><span>{state?.likes ?? 0}</span></Button>}
  {error && <p role="alert" className="form-note form-error">{error}</p>}
 </div>;
}