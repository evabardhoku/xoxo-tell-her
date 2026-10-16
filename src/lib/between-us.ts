import { supabase } from '@/integrations/supabase/client';

export type InboxRow = { conversation_id: string; member_id: string; first_name: string; last_initial: string; has_avatar: boolean; last_body: string | null; last_at: string; last_mine: boolean | null; unread: boolean; can_message: boolean; blocked_by_me: boolean };
export type DirectMessage = { id: string; sender_id: string; body: string; created_at: string };

export const inboxQuery = {
 queryKey: ['between-us-inbox'],
 queryFn: async () => { const { data, error } = await supabase.rpc('tellher_inbox'); if (error) throw error; return (data ?? []) as InboxRow[]; },
};
/** Messages are readable only by participants (RLS); a foreign conversation id simply returns nothing. */
export const messagesQuery = (id: string) => ({
 queryKey: ['between-us-messages', id],
 queryFn: async () => { const { data, error } = await supabase.from('messages').select('id, sender_id, body, created_at').eq('conversation_id', id).order('created_at').limit(500); if (error) throw error; return (data ?? []) as DirectMessage[]; },
});
export const canMessageQuery = (memberId: string) => ({
 queryKey: ['can-message', memberId],
 queryFn: async () => { const { data, error } = await supabase.rpc('tellher_can_message', { _member: memberId }); if (error) throw error; return Boolean(data); },
});
