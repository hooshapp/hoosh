begin;
do $$ declare a uuid;b uuid;begin
 select id into a from auth.users order by created_at,id limit 1;
 select id into b from auth.users where id<>a order by created_at,id limit 1;
 perform set_config('research_test.a',a::text,true);perform set_config('research_test.b',b::text,true);
 perform set_config('research_test.record',gen_random_uuid()::text,true);
end $$;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub',current_setting('research_test.a'),true);end $$;
insert into public.legacy_swift_participants(user_id,participant_name,contact_email)
values(current_setting('research_test.a')::uuid,'Named study participant','named@example.invalid')
on conflict(user_id) do update set participant_name=excluded.participant_name,contact_email=excluded.contact_email;
insert into public.legacy_swift_profiles(user_id,preferences,plan)
values(current_setting('research_test.a')::uuid,
 '{"primaryGoal":"Read more books","customQuestion":"Keep this full written answer.","selectedQuestions":["Question one"],"tinyTask":"Read two pages"}',
 '[{"localRuleID":"a","appLabel":"Instagram","dailyMinutes":60,"sessionMinutes":30}]')
on conflict(user_id) do update set preferences=excluded.preferences,plan=excluded.plan;
insert into public.legacy_swift_configuration_history(id,user_id,recorded_at,study_day,timezone,reason,snapshot)
values(current_setting('research_test.record')::uuid,current_setting('research_test.a')::uuid,'2026-11-04T12:00Z','2026-11-04','America/New_York','initial_import',
 '{"preferences":{"primaryGoal":"Read more books"},"plan":[{"appLabel":"Instagram","dailyMinutes":30,"sessionMinutes":15}],"onboardingCompleted":true}');
insert into public.legacy_swift_configuration_history(id,user_id,recorded_at,study_day,timezone,reason,snapshot)
values(gen_random_uuid(),current_setting('research_test.a')::uuid,'2026-11-04T13:00Z','2026-11-04','America/New_York','daily_limit_changed',
 '{"preferences":{"primaryGoal":"Read more books"},"plan":[{"appLabel":"Instagram","dailyMinutes":60,"sessionMinutes":30}],"onboardingCompleted":true}');
insert into public.legacy_swift_configuration_history(id,user_id,recorded_at,study_day,timezone,reason,snapshot)
select id,user_id,recorded_at,study_day,timezone,reason,snapshot from public.legacy_swift_configuration_history where id=current_setting('research_test.record')::uuid on conflict(id) do nothing;
insert into public.legacy_swift_feedback(id,user_id,rating,message,context)
values(gen_random_uuid(),current_setting('research_test.a')::uuid,4,'The intervention helped.','dashboard');
insert into public.legacy_swift_events(id,user_id,event_name,properties,occurred_at)
select gen_random_uuid(),current_setting('research_test.a')::uuid,v.name,v.properties,'2026-11-04T13:00Z'::timestamptz from(values
 ('session_started','{"session_id":"one","local_rule_id":"a","session_day":"2026-11-4","timezone":"America/New_York"}'::jsonb),
 ('session_snapshot','{"session_id":"one","local_rule_id":"a","session_day":"2026-11-4","used_minutes":"8","timezone":"America/New_York"}'::jsonb),
 ('session_ended','{"session_id":"one","local_rule_id":"a","session_day":"2026-11-4","used_minutes":"15","timezone":"America/New_York"}'::jsonb),
 ('nudge_requested','{"recorded_day":"2026-11-04","timezone":"America/New_York"}'::jsonb),
 ('app_visit_started','{"recorded_day":"2026-11-03","timezone":"America/New_York"}'::jsonb)
)v(name,properties);
do $$ declare n int;begin
 select count(*) into n from public.legacy_swift_configuration_history where user_id=current_setting('research_test.a')::uuid;
 if n<>2 then raise exception 'Configuration history/retry identity incorrect';end if;
 begin delete from public.legacy_swift_configuration_history where user_id=current_setting('research_test.a')::uuid;
 raise exception 'Client could delete configuration history';exception when insufficient_privilege then null;end;
end $$;
do $$ begin perform set_config('request.jwt.claim.sub',current_setting('research_test.b'),true);end $$;
do $$ declare n int;view_name text;begin
 select count(*) into n from public.legacy_swift_configuration_history where user_id=current_setting('research_test.a')::uuid;
 if n<>0 then raise exception 'Cross-user questionnaire history leak';end if;
 foreach view_name in array array['legacy_swift_enrollment_records','legacy_swift_questionnaires','legacy_swift_app_plans','legacy_swift_feedback_records','legacy_swift_settings_changes','legacy_swift_daily_research','legacy_swift_session_records','legacy_swift_intervention_records'] loop
  begin execute format('select * from public.%I',view_name);raise exception 'Research view exposed to participants';exception when insufficient_privilege then null;end;
 end loop;
end $$;
reset role;
do $$ declare r record;n int;begin
 select * into r from public.legacy_swift_enrollment_records where user_id=current_setting('research_test.a')::uuid;
 if not found then raise exception 'Expected researcher row missing';end if;
 if r.participant_name<>'Named study participant' or r.study_status not like 'Enrolled:%' then raise exception 'Missing named enrollment status';end if;
 select * into r from public.legacy_swift_questionnaires where user_id=current_setting('research_test.a')::uuid;
 if not found then raise exception 'Expected researcher row missing';end if;
 if r.custom_question<>'Keep this full written answer.' then raise exception 'Questionnaire text lost';end if;
 select * into r from public.legacy_swift_app_plans where user_id=current_setting('research_test.a')::uuid;
 if not found then raise exception 'Expected researcher row missing';end if;
 if r.app_name<>'Instagram' or r.daily_allowance_minutes<>60 or r.session_length_minutes<>30 then raise exception 'Named app plan incorrect';end if;
 select count(*) into n from public.legacy_swift_feedback_records where user_id=current_setting('research_test.a')::uuid and rating=4 and message='The intervention helped.';
 if n<>1 then raise exception 'Named dashboard feedback missing';end if;
 select count(*) into n from public.legacy_swift_settings_changes where user_id=current_setting('research_test.a')::uuid;
 if n<>2 then raise exception 'Settings versions lost';end if;
 select * into r from public.legacy_swift_daily_research where user_id=current_setting('research_test.a')::uuid and study_day='2026-11-04'::date;
 if not found then raise exception 'Expected researcher row missing';end if;
 if r.selected_app_minutes_observed<>15 or r.sessions_started<>1 or r.sessions_ended<>1 or r.nudge_requests<>1 then raise exception 'Daily selected-app observations incorrect';end if;
 if r.historical_pre_enrollment_minutes is not null then raise exception 'Invented historical baseline';end if;
 select * into r from public.legacy_swift_session_records where user_id=current_setting('research_test.a')::uuid;
 if not found or r.app_name<>'Instagram' or r.usage_minutes_observed<>15 then raise exception 'Named session details incorrect';end if;
 select count(*) into n from public.legacy_swift_intervention_records where user_id=current_setting('research_test.a')::uuid;
 if n<>1 then raise exception 'Intervention detail category missing';end if;
 select * into r from public.legacy_swift_daily_research where user_id=current_setting('research_test.a')::uuid and study_day='2026-11-03'::date;
 if not found then raise exception 'Expected researcher row missing';end if;
 if r.selected_app_minutes_observed is not null then raise exception 'Missing usage represented as zero';end if;
end $$;
rollback;
select 'PASS' as result,'Named enrollment; complete questionnaires; app labels/limits; feedback; immutable configuration history; private researcher views; normalized local days; no invented baseline or zero values' as checks;
