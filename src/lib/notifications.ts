import { supabase } from '@/integrations/supabase/client';

export type Notification = { id: string; kind: string; title: string; body: string; link: string | null; read: boolean; created_at: string };

export const notificationsQuery = {
 queryKey: ['notifications'],
 queryFn: async () => { const { data, error } = await supabase.rpc('tellher_notifications'); if (error) throw error; return (data ?? []) as Notification[]; },
 refetchInterval: 30000,
};

export const unreadQuery = {
 queryKey: ['notifications-unread'],
 queryFn: async () => { const { data, error } = await supabase.rpc('tellher_unread_notifications'); if (error) throw error; return data ?? 0; },
 refetchInterval: 30000,
};

export type TaggableMember = { member_id: string; first_name: string; last_initial: string };
/** Only the viewer's accepted Direct Circle — no emails, no extended members. */
export const taggableQuery = {
 queryKey: ['taggable'],
 queryFn: async () => { const { data, error } = await supabase.rpc('tellher_taggable'); if (error) throw error; return (data ?? []) as TaggableMember[]; },
};

export type ReplyLikes = Record<string, { likes: number; mine: boolean }>;
export const replyLikesQuery = (questionId: string) => ({
 queryKey: ['reply-likes', questionId],
 queryFn: async () => {
  const { data, error } = await supabase.rpc('tellher_reply_likes', { _q: questionId });
  if (error) throw error;
  const out: ReplyLikes = {};
  for (const r of data ?? []) out[r.reply_id] = { likes: r.likes, mine: r.mine };
  return out;
 },
});
