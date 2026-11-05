-- Run only against a test database with two dedicated Auth users. Rollback-only.
begin;
do $$ declare a uuid; b uuid; begin
  select id into a from auth.users order by created_at,id limit 1;
  select id into b from auth.users where id<>a order by created_at,id limit 1;
  if a is null or b is null then raise exception 'Two test identities are required'; end if;
  perform set_config('study_test.a',a::text,true);
  perform set_config('study_test.b',b::text,true);
end $$;
set local role authenticated;
do $$ begin
  perform set_config('request.jwt.claim.sub',current_setting('study_test.a'),true);
  perform set_config('request.jwt.claims',json_build_object('sub',current_setting('study_test.a'),'role','authenticated','is_anonymous',true)::text,true);
end $$;
insert into public.legacy_swift_participants(user_id,participant_name,contact_email,telemetry_gap_detected)
values(current_setting('study_test.a')::uuid,'Synthetic participant','qa@example.invalid',false)
on conflict(user_id) do update set user_id=excluded.user_id,participant_name=excluded.participant_name,contact_email=excluded.contact_email,telemetry_gap_detected=excluded.telemetry_gap_detected;
do $$ declare n int; begin
 select count(*) into n from public.legacy_swift_participants where participant_name='Synthetic participant' and contact_email='qa@example.invalid';
 if n<>1 then raise exception 'Own enrollment readback failed'; end if;
 begin
  update public.legacy_swift_participants set is_test=true where user_id=current_setting('study_test.a')::uuid;
  raise exception 'Participant changed researcher-only QA flag';
 exception when insufficient_privilege then null;
 end;
 begin
  perform * from public.legacy_swift_progress;
  raise exception 'Participant accessed private researcher view';
 exception when insufficient_privilege then null;
 end;
end $$;
insert into public.legacy_swift_events(id,user_id,event_name,properties,occurred_at)
select gen_random_uuid(),current_setting('study_test.a')::uuid,v.name,v.properties,'2026-11-04T12:00:00Z'::timestamptz from (values
 ('session_started','{"session_id":"test-1","session_day":"2026-11-4","extra":"false"}'::jsonb),
 ('session_checkpoint','{"session_id":"test-1","session_day":"2026-11-4","used_minutes":"8"}'::jsonb),
 ('session_snapshot','{"session_id":"test-1","session_day":"2026-11-4","used_minutes":"8"}'::jsonb),
 ('session_snapshot','{"session_id":"test-1","session_day":"2026-11-4","used_minutes":"15"}'::jsonb),
 ('session_ended','{"session_id":"test-1","session_day":"2026-11-4","used_minutes":"30"}'::jsonb),
 ('session_started','{"session_id":"test-2","session_day":"2026-11-4","extra":"false"}'::jsonb),
 ('session_checkpoint','{"session_id":"test-2","session_day":"2026-11-4","used_minutes":"4"}'::jsonb),
 ('session_started','{"session_id":"test-3","session_day":"2026-11-3","extra":"true"}'::jsonb),
 ('session_expired','{"session_id":"test-3","session_day":"2026-11-3","used_minutes":"2"}'::jsonb),
 ('nudge_requested','{}'::jsonb),('nudge_requested','{}'::jsonb),
 ('shield_continue_chosen','{}'::jsonb),('shield_continue_chosen','{}'::jsonb),
 ('shield_quit_chosen','{}'::jsonb),('nudge_end_session','{}'::jsonb),
 ('app_visit_started','{"visit_id":"visit-1"}'::jsonb),
 ('app_visit_started','{"visit_id":"visit-2"}'::jsonb),
 ('app_visit_ended','{"visit_id":"visit-1","foreground_seconds":"12"}'::jsonb),
 ('app_visit_ended','{"visit_id":"visit-1","foreground_seconds":"12"}'::jsonb),
 ('app_visit_ended','{"visit_id":"visit-2","foreground_seconds":"5"}'::jsonb)
) as v(name,properties);
do $$ begin
 perform set_config('request.jwt.claim.sub',current_setting('study_test.b'),true);
end $$;
do $$ declare n int; begin
 select count(*) into n from public.legacy_swift_participants where user_id=current_setting('study_test.a')::uuid;
 if n<>0 then raise exception 'Cross-user participant read allowed'; end if;
 begin
  insert into public.legacy_swift_participants(user_id,participant_name,contact_email)
  values(current_setting('study_test.a')::uuid,'Forged participant','forged@example.invalid') on conflict(user_id) do update set participant_name=excluded.participant_name;
  raise exception 'Cross-user participant upsert allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
do $$ declare r record; n int; begin
 select * into r from public.legacy_swift_progress where user_id=current_setting('study_test.a')::uuid;
 if r.selected_app_usage_minutes<>36 then raise exception 'Usage checkpoints were double-counted'; end if;
 if r.sessions_started<>3 or r.sessions_ended<>1 or r.extra_sessions<>1 then raise exception 'Session counts incorrect'; end if;
 if r.nudges_requested<>2 or r.shield_continue_choices<>2 or r.shield_quit_choices<>1 or r.nudge_end_choices<>1 then raise exception 'Intervention counts incorrect'; end if;
 if r.disconnect_visits<>2 or r.observed_disconnect_foreground_seconds<>17 then raise exception 'Foreground visits double-counted'; end if;
 select selected_app_usage_minutes into n from public.legacy_swift_daily_progress where user_id=current_setting('study_test.a')::uuid and study_day='2026-11-4';
 if n<>34 then raise exception 'Daily progression incorrect'; end if;
 update public.legacy_swift_participants set is_test=true where user_id=current_setting('study_test.a')::uuid;
 select count(*) into n from public.legacy_swift_progress where user_id=current_setting('study_test.a')::uuid;
 if n<>0 then raise exception 'QA participant appeared in study totals'; end if;
end $$;
set local role anon;
do $$ begin
 begin
  perform * from public.legacy_swift_participants;
  raise exception 'Unauthenticated participant data access allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
rollback;
select 'PASS' as result,'Enrollment ownership; anonymous-auth own-row access; private admin view; checkpoint/visit deduplication; daily usage; intervention counts; QA exclusion; no retained fixtures' as checks;
