import { useQuery } from '@tanstack/react-query';
import { profileQuery } from '@/lib/profile';
import { circleQuery } from '@/lib/circle';
import { feedQuery } from '@/lib/askher';
import { inboxQuery } from '@/lib/between-us';
import { shelfQuery } from '@/components/trust-shelf';
import { sessionsQuery } from '@/routes/_authenticated/wingwoman';
import { discoveryItems, isNewAccount, isNewcomer, type DiscoverySignals } from '@/lib/discovery';

/** Derives unlock state from the same owner-scoped queries the pages already use, so it updates with real activity. */
export function useDiscovery() {
 const profile = useQuery(profileQuery);
 const isNew = isNewAccount(profile.data?.created_at);
 const circle = useQuery(circleQuery);
 const feed = useQuery(feedQuery);
 const sessions = useQuery({ ...sessionsQuery, enabled: isNew });
 const inbox = useQuery({ ...inboxQuery, enabled: isNew });
 const shelf = useQuery({ ...shelfQuery(profile.data?.id ?? ''), enabled: isNew && Boolean(profile.data?.id) });
 const mine = (feed.data ?? []).filter(q => q.is_mine);
 const s: DiscoverySignals = {
  wingwoman: sessions.data?.length ?? 0,
  ripples: mine.length,
  ripplesWithReplies: mine.filter(q => q.reply_count > 0).length,
  direct: (circle.data?.entries ?? []).filter(e => e.kind === 'direct').length,
  extended: circle.data?.extendedCount ?? 0,
  notes: shelf.data?.notes.length ?? 0,
  picks: shelf.data?.picks.length ?? 0,
  conversations: inbox.data?.length ?? 0,
  profileFilled: Boolean(profile.data && (profile.data.known_for.length || profile.data.bio)),
 };
 const ready = profile.isSuccess && circle.isSuccess && feed.isSuccess;
 return { ready, isNew, newcomer: ready && isNewcomer(isNew, s), signals: s, items: discoveryItems(s) };
}
