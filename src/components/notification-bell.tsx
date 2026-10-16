import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './ui/dropdown-menu';
import { notificationsQuery, unreadQuery, notificationTarget, notificationTitle } from '@/lib/notifications';
import { relativeTime } from '@/lib/askher';

/** Header bell: unread badge + a calm list of recent notifications. Opening marks all read. */
export function NotificationBell() {
 const qc = useQueryClient();
 const unread = useQuery(unreadQuery);
 const list = useQuery(notificationsQuery);
 const open = (isOpen: boolean) => {
  if (!isOpen || !unread.data) return;
  void supabase.rpc('tellher_mark_notifications_read').then(() => {
   qc.invalidateQueries({ queryKey: unreadQuery.queryKey });
   qc.invalidateQueries({ queryKey: notificationsQuery.queryKey });
  });
 };
 return <DropdownMenu onOpenChange={open}>
  <DropdownMenuTrigger className="avatar-link bell-link" aria-label={unread.data ? `Notifications — ${unread.data} unread` : 'Notifications'}>
   <Bell size={17} />{unread.data ? <span className="bell-badge" aria-hidden="true">{unread.data > 9 ? '9+' : unread.data}</span> : null}
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="bell-panel">
   <p className="bell-title">Notifications</p>
   {!list.data?.length ? <p className="form-note bell-empty">Nothing new yet.</p>
    : <ul className="bell-list">{list.data.map(n => <li key={n.id} className={n.read ? '' : 'is-unread'}>
      {notificationTarget(n) ? <Link to={notificationTarget(n)!.to as '/askher'} search={notificationTarget(n)!.search as never} className="bell-item"><strong>{notificationTitle(n.title)}</strong><em>{relativeTime(n.created_at)}</em></Link>
       : <span className="bell-item"><strong>{notificationTitle(n.title)}</strong><em>{relativeTime(n.created_at)}</em></span>}
     </li>)}</ul>}
  </DropdownMenuContent>
 </DropdownMenu>;
}
