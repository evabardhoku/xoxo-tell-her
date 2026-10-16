/** Gentle progressive discovery: only accounts created on/after this date are eased in; older (incl. all demo) accounts see everything. */
export const NEW_ACCOUNT_SINCE = '2026-10-16T00:00:00Z';
export const isNewAccount = (createdAt: string | null | undefined) => Boolean(createdAt) && new Date(createdAt!).getTime() >= new Date(NEW_ACCOUNT_SINCE).getTime();

export type DiscoverySignals = { wingwoman: number; ripples: number; ripplesWithReplies: number; direct: number; extended: number; notes: number; picks: number; conversations: number; profileFilled: boolean };
export type DiscoveryItem = { key: string; label: string; to: string; search?: Record<string, string>; done: boolean };

export function discoveryItems(s: DiscoverySignals): DiscoveryItem[] {
 return [
  { key: 'wingwoman', label: 'Talk something through with Wingwoman', to: '/wingwoman', done: s.wingwoman > 0 },
  { key: 'profile', label: 'Tell women what you’re known for', to: '/profile', done: s.profileFilled },
  { key: 'direct', label: 'Add your first trusted woman', to: '/circle', done: s.direct > 0 },
  { key: 'ripple', label: 'Ask other women anonymously', to: '/ripple', done: s.ripples > 0 },
  { key: 'map', label: 'See perspectives emerge', to: '/askher', search: { view: 'ripples' }, done: s.ripplesWithReplies > 0 },
  { key: 'extended', label: 'Reach your Extended Circle', to: '/circle', search: { view: 'extended' }, done: s.extended > 0 },
  { key: 'note', label: 'Share a Field Note', to: '/profile', done: s.notes > 0 },
  { key: 'pick', label: 'Recommend a Pick', to: '/circle', done: s.picks > 0 },
  { key: 'between-us', label: 'Start a private conversation', to: '/circle', search: { view: 'messages' }, done: s.conversations > 0 },
 ];
}

/** A newcomer is a new account that hasn't started a Ripple or added anyone yet. */
export const isNewcomer = (isNew: boolean, s: Pick<DiscoverySignals, 'ripples' | 'direct'>) => isNew && s.ripples === 0 && s.direct === 0;
