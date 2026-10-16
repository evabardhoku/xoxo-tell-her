import { supabase } from '@/integrations/supabase/client';

export const categories = ['Work', 'Dating & Boundaries', 'Housing & Moving', 'Travel', 'Services', 'Everyday Life'] as const;
export const instincts = [
 { value: 'feels_okay', label: 'Feels okay' },
 { value: 'unsure', label: 'I’m unsure' },
 { value: 'feels_off', label: 'Something feels off' },
] as const;
export const reaches = [
 { value: 'circle', label: 'MyCircle', hint: 'Only women you trust directly.' },
 { value: 'extended', label: 'Extended Circle', hint: 'Travels through your Direct Circle to the women they trust. Two layers at most.' },
 { value: 'community', label: 'TellHer community', hint: 'Signed-in TellHer members.' },
] as const;
export type Reach = (typeof reaches)[number]['value'];
export const reachContext = (s: string) => (s === 'circle' ? 'Direct circle' : s === 'extended' ? 'Extended Circle' : 'TellHer community');

const women = (n: number) => `${n} ${n === 1 ? 'woman' : 'women'}`;
/** Extended reach = Direct Circle + additional Extended Circle; counts stay separate in wording. */
export function reachPreview(scope: Reach, count: number | null | undefined, direct?: number | null) {
 if (scope === 'community') return 'TellHer community';
 const n = count ?? 0;
 if (scope === 'circle') return `${women(n)} in your Direct Circle`;
 const d = Math.min(direct ?? 0, n);
 return `Up to ${women(n)} through your trust network · ${d} Direct Circle + ${n - d} additional Extended Circle`;
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

export function filterFeed(list: FeedQuestion[], f: { kw: string; cat: string; reach: string; sort: 'newest' | 'oldest'; unanswered: boolean }) {
 const k = f.kw.trim().toLowerCase();
 return list.filter(q => (!k || q.body.toLowerCase().includes(k) || q.category.toLowerCase().includes(k)) && (!f.cat || q.category === f.cat) && (!f.reach || q.audience_scope === f.reach) && (!f.unanswered || q.reply_count === 0))
  .sort((a, b) => (f.sort === 'newest' ? -1 : 1) * (Date.parse(a.created_at) - Date.parse(b.created_at)));
}
