import { supabase } from '@/integrations/supabase/client';

export const categories = ['Work', 'Dating & Boundaries', 'Housing & Moving', 'Travel', 'Services', 'Everyday Life'] as const;
export const instincts = [
 { value: 'feels_okay', label: 'Feels okay' },
 { value: 'unsure', label: 'I’m unsure' },
 { value: 'feels_off', label: 'Something feels off' },
] as const;
export const reaches = [
 { value: 'circle', label: 'MyCircle', hint: 'Only women you trust directly.' },
 { value: 'extended', label: 'Extended circle', hint: 'Your circle and the women they trust. Two layers at most.' },
 { value: 'community', label: 'TellHer community', hint: 'Signed-in TellHer members.' },
] as const;
export type Reach = (typeof reaches)[number]['value'];
export const reachContext = (s: string) => (s === 'circle' ? 'Direct circle' : s === 'extended' ? '2 trust layers' : 'TellHer community');

export function reachPreview(scope: Reach, count: number | null | undefined) {
 if (scope === 'community') return 'TellHer community';
 const n = count ?? 0; const w = n === 1 ? 'woman' : 'women';
 return scope === 'circle' ? `${n} ${w} in your direct circle` : `${n} ${w} across two trust layers`;
}

export type FeedQuestion = { id: string; category: string; body: string; audience_scope: string; created_at: string; reply_count: number; is_mine: boolean; my_instinct: string | null; my_note: string | null };
export const feedQuery = {
 queryKey: ['askher-feed'],
 queryFn: async () => { const { data, error } = await supabase.rpc('tellher_feed'); if (error) throw error; return (data ?? []) as FeedQuestion[]; },
};

export function relativeTime(iso: string, now = Date.now()) {
 const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
 if (s < 60) return 'just now';
 const steps: [number, string][] = [[60, 'minute'], [3600, 'hour'], [86400, 'day'], [604800, 'week']];
 let unit = steps[0]!; for (const st of steps) if (s >= st[0]) unit = st;
 const v = Math.floor(s / unit[0]); return `${v} ${unit[1]}${v === 1 ? '' : 's'} ago`;
}
export const errorText = (e: unknown) => (e as { message?: string } | null)?.message || 'Something went wrong.';
