do $$ declare r record; begin
for r in select p.oid::regprocedure f, p.proname n from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname='public' and p.prosecdef and p.proname in ('tellher_send_message_tagged','tellher_notify_trust','tellher_notifications','tellher_unread_notifications','tellher_mark_notifications_read','tellher_trust_notify','tellher_post_reply_tagged','tellher_like_reply','tellher_unlike_reply','tellher_reply_likes','tellher_taggable') loop
 execute format('revoke execute on function %s from public, anon', r.f);
 if r.n in ('tellher_notify_trust','tellher_trust_notify') then execute format('revoke execute on function %s from authenticated', r.f);
 else execute format('grant execute on function %s to authenticated', r.f); end if;
end loop; end $$;