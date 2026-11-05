begin;
insert into public.legacy_swift_participants(user_id,participant_name,contact_email) values
 ('00000000-0000-4000-8000-000000000001','Connection QA','connection@example.invalid');
insert into public.legacy_swift_events(id,user_id,occurred_at,event_name,properties) values
 (gen_random_uuid(),'00000000-0000-4000-8000-000000000001',now(),'productivity_connection_requested','{"provider":"calendar"}'),
 (gen_random_uuid(),'00000000-0000-4000-8000-000000000001',now(),'productivity_permission_result','{"provider":"calendar","granted":"false"}'),
 (gen_random_uuid(),'00000000-0000-4000-8000-000000000001',now(),'productivity_connection_status','{"provider":"reminders","status":"authorized"}');
do $$ begin
 if (select count(*) from public.legacy_swift_connection_records) <> 3 then raise exception 'Missing connection events'; end if;
 if not exists(select 1 from public.legacy_swift_connection_records where provider='calendar' and permission_granted='false') then raise exception 'Denied must not look connected'; end if;
 if not exists(select 1 from public.legacy_swift_connection_records where provider='reminders' and permission_status='authorized') then raise exception 'Missing granted status'; end if;
 if has_table_privilege('authenticated','public.legacy_swift_connection_records','select') or has_table_privilege('anon','public.legacy_swift_connection_records','select') then raise exception 'Researcher view exposed'; end if;
 if not has_table_privilege('service_role','public.legacy_swift_connection_records','select') then raise exception 'Researcher read missing'; end if;
end $$;
rollback;
select 'PASS: named calendar/reminder connection records, denied/granted distinction and researcher-only access' as result;
