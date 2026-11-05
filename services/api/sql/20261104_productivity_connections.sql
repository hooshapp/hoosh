-- Additive researcher view. Event/reminder titles are intentionally excluded.
begin;
create or replace view public.legacy_swift_connection_records with(security_invoker=true) as
select p.user_id,p.participant_name,p.contact_email,e.occurred_at,e.event_name,
 e.properties->>'provider' as provider,
 e.properties->>'status' as permission_status,
 e.properties->>'granted' as permission_granted,
 e.properties->>'recorded_day' as recorded_day,
 e.properties->>'timezone' as timezone
from public.legacy_swift_events e
join public.legacy_swift_participants p using(user_id)
where not p.is_test and e.event_name in (
 'productivity_connection_requested','productivity_permission_result',
 'productivity_permission_error','productivity_connection_status','productivity_connection_skipped');
revoke all on public.legacy_swift_connection_records from public,anon,authenticated;
grant select on public.legacy_swift_connection_records to service_role;
commit;
