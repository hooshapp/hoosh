-- Named researcher categories and immutable settings/questionnaire history.
-- No auth-provider changes. Run once after the two earlier pilot migrations.
begin;
create table public.legacy_swift_configuration_history (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  recorded_at timestamptz not null,
  received_at timestamptz not null default now(),
  study_day text not null check (study_day ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  timezone text not null check (length(timezone) between 1 and 100),
  reason text not null check (length(reason) between 1 and 100),
  snapshot jsonb not null check (jsonb_typeof(snapshot)='object' and octet_length(snapshot::text)<=131072)
);
create index legacy_swift_configuration_user_time on public.legacy_swift_configuration_history(user_id,recorded_at);
alter table public.legacy_swift_configuration_history enable row level security;
revoke all on public.legacy_swift_configuration_history from public,anon,authenticated;
grant select,insert on public.legacy_swift_configuration_history to authenticated;
grant select on public.legacy_swift_configuration_history to service_role;
create policy swift_configuration_read on public.legacy_swift_configuration_history for select to authenticated using((select auth.uid())=user_id);
create policy swift_configuration_write on public.legacy_swift_configuration_history for insert to authenticated with check((select auth.uid())=user_id);

create view public.legacy_swift_enrollment_records with(security_invoker=true) as
select p.user_id,p.participant_name,p.contact_email,p.joined_at,
       'Enrolled: name and email recorded'::text as study_status,
       'Participant-provided contact; no email-confirmation step'::text as contact_source,
       p.telemetry_gap_detected,pr.updated_at as last_preferences_sync
from public.legacy_swift_participants p left join public.legacy_swift_profiles pr using(user_id)
where not p.is_test;

create view public.legacy_swift_questionnaires with(security_invoker=true) as
select p.user_id,p.participant_name,p.contact_email,pr.updated_at,
 pr.preferences->>'focusGoal' as focus_goal,pr.preferences->>'primaryGoal' as primary_goal,
 pr.preferences->>'focusFeeling' as desired_feeling,pr.preferences->>'tinyTask' as replacement_activity,
 pr.preferences->>'scrollTemptation' as scrolling_trigger,pr.preferences->>'scrollCost' as perceived_cost,
 pr.preferences->>'accountabilityAnchor' as accountability_anchor,
 pr.preferences->'selectedQuestions' as selected_questions,pr.preferences->>'customQuestion' as custom_question,
 pr.preferences->>'aiFrictionStyle' as friction_style,pr.preferences->>'aiTone' as tone,
 pr.preferences->>'persuasionStyle' as persuasion_style,pr.preferences as all_saved_answers
from public.legacy_swift_participants p join public.legacy_swift_profiles pr using(user_id) where not p.is_test;

create view public.legacy_swift_app_plans with(security_invoker=true) as
select p.user_id,p.participant_name,p.contact_email,pr.updated_at,
 a.value->>'localRuleID' as local_rule_id,
 coalesce(nullif(a.value->>'appLabel',''),'Unlabelled selected app') as app_name,
 'Participant-entered study label'::text as app_name_source,
 case when a.value->>'dailyMinutes' ~ '^[0-9]{1,3}$' then (a.value->>'dailyMinutes')::integer else null end as daily_allowance_minutes,
 case when a.value->>'sessionMinutes' ~ '^[0-9]{1,3}$' then (a.value->>'sessionMinutes')::integer else null end as session_length_minutes
from public.legacy_swift_participants p join public.legacy_swift_profiles pr using(user_id)
cross join lateral jsonb_array_elements(pr.plan) a(value) where not p.is_test;

create view public.legacy_swift_feedback_records with(security_invoker=true) as
select p.user_id,p.participant_name,p.contact_email,f.id as feedback_id,f.created_at,
 f.rating,f.message,f.context
from public.legacy_swift_participants p join public.legacy_swift_feedback f using(user_id) where not p.is_test;

create view public.legacy_swift_settings_changes with(security_invoker=true) as
select p.user_id,p.participant_name,p.contact_email,h.id as change_id,
 h.recorded_at,h.received_at,h.study_day,h.timezone,h.reason,
 h.snapshot->>'onboardingCompleted' as onboarding_completed,
 h.snapshot->'preferences' as questionnaire_answers,h.snapshot->'plan' as app_plan
from public.legacy_swift_participants p join public.legacy_swift_configuration_history h using(user_id) where not p.is_test;

-- Dated activity by local observed day. Absence stays NULL, never invented as zero.
create view public.legacy_swift_daily_research with(security_invoker=true) as
with zones as (
 select distinct on (e.user_id) e.user_id,
   coalesce((select z.name from pg_timezone_names z where z.name=e.properties->>'timezone' limit 1),'UTC') as timezone
 from public.legacy_swift_events e order by e.user_id,e.occurred_at desc
), activity as (
 select e.user_id,
   coalesce(nullif(e.properties->>'session_day',''),nullif(e.properties->>'recorded_day',''),to_char(e.occurred_at at time zone 'UTC','YYYY-MM-DD')) as day_key,
   min(e.occurred_at) as first_event_at,max(e.occurred_at) as last_event_at,
   count(*) filter(where e.event_name='session_started') as sessions_started,
   count(*) filter(where e.event_name='session_ended') as sessions_ended,
   count(*) filter(where e.event_name='nudge_requested') as nudge_requests,
   count(*) filter(where e.event_name='shield_quit_chosen') as shield_quit_choices,
   count(*) filter(where e.event_name='shield_continue_chosen') as shield_continue_choices,
   count(*) filter(where e.event_name='nudge_end_session') as nudge_end_choices
 from public.legacy_swift_events e group by e.user_id,day_key
), normalized as (
 select user_id,to_date(day_key,'YYYY-MM-DD') as study_day,
   min(first_event_at) as first_event_at,max(last_event_at) as last_event_at,
   sum(sessions_started) as sessions_started,sum(sessions_ended) as sessions_ended,
   sum(nudge_requests) as nudge_requests,sum(shield_quit_choices) as shield_quit_choices,
   sum(shield_continue_choices) as shield_continue_choices,sum(nudge_end_choices) as nudge_end_choices
 from activity group by user_id,to_date(day_key,'YYYY-MM-DD')
), usage as (
 select user_id,to_date(study_day,'YYYY-MM-DD') as study_day,sum(selected_app_usage_minutes) as minutes
 from public.legacy_swift_daily_progress where study_day ~ '^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}$'
 group by user_id,to_date(study_day,'YYYY-MM-DD')
), dates as (
 select user_id,study_day from normalized union select user_id,study_day from usage
)
select p.user_id,p.participant_name,p.contact_email,d.study_day,
 'Automatically observed selected-app usage; minute resolution'::text as data_source,
 case when d.study_day=(now() at time zone coalesce(z.timezone,'UTC'))::date then 'Ongoing day; latest received observations'
 else 'Past day; received observations only' end as coverage_status,
 u.minutes as selected_app_minutes_observed,
 null::integer as historical_pre_enrollment_minutes,
 'Pre-enrollment history unavailable; no manual totals collected'::text as baseline_status,
 a.first_event_at,a.last_event_at,a.sessions_started,a.sessions_ended,a.nudge_requests,
 a.shield_quit_choices,a.shield_continue_choices,a.nudge_end_choices,p.telemetry_gap_detected
from dates d join public.legacy_swift_participants p using(user_id)
left join normalized a using(user_id,study_day) left join usage u using(user_id,study_day)
left join zones z on z.user_id=p.user_id
where not p.is_test;

create view public.legacy_swift_session_records with(security_invoker=true) as
with sessions as (
 select e.user_id,e.properties->>'session_id' as session_id,
 max(e.properties->>'local_rule_id') as local_rule_id,
 min(e.occurred_at) filter(where e.event_name='session_started') as started_at,
 max(e.occurred_at) filter(where e.event_name in ('session_ended','session_expired')) as ended_at,
 max(case when e.properties->>'used_minutes' ~ '^[0-9]{1,3}$' then least(240,(e.properties->>'used_minutes')::integer) else null end) as usage_minutes_observed,
 max(case when e.properties->>'duration_minutes' ~ '^[0-9]{1,3}$' then (e.properties->>'duration_minutes')::integer else null end) as planned_session_minutes,
 bool_or(e.properties->>'extra'='true') as is_extra_time,
 count(*) filter(where e.event_name='nudge_requested') as nudge_requests
 from public.legacy_swift_events e where nullif(e.properties->>'session_id','') is not null
 group by e.user_id,e.properties->>'session_id'
)
select p.user_id,p.participant_name,p.contact_email,s.session_id,s.local_rule_id,
 coalesce(labels.label,'Unlabelled selected app') as app_name,
 s.started_at,s.ended_at,s.planned_session_minutes,s.usage_minutes_observed,s.is_extra_time,s.nudge_requests
from sessions s join public.legacy_swift_participants p using(user_id)
left join lateral (
 select label from (
  select a.value->>'appLabel' as label,pr.updated_at as saved_at
  from public.legacy_swift_profiles pr cross join lateral jsonb_array_elements(pr.plan) a(value)
  where pr.user_id=s.user_id and a.value->>'localRuleID'=s.local_rule_id
  union all
  select a.value->>'appLabel',h.recorded_at from public.legacy_swift_configuration_history h
  cross join lateral jsonb_array_elements(case when jsonb_typeof(h.snapshot->'plan')='array' then h.snapshot->'plan' else '[]'::jsonb end) a(value)
  where h.user_id=s.user_id and a.value->>'localRuleID'=s.local_rule_id
 ) named where nullif(label,'') is not null order by saved_at desc limit 1
) labels on true where not p.is_test;

create view public.legacy_swift_intervention_records with(security_invoker=true) as
select p.user_id,p.participant_name,p.contact_email,e.id as event_id,e.occurred_at,
 e.event_name as recorded_action,
 coalesce(s.app_name,labels.app_name,'Unlabelled selected app') as app_name,
 e.properties->>'session_id' as session_id,e.properties as recorded_details
from public.legacy_swift_events e join public.legacy_swift_participants p using(user_id)
left join public.legacy_swift_session_records s on s.user_id=e.user_id and s.session_id=e.properties->>'session_id'
left join public.legacy_swift_app_plans labels on labels.user_id=e.user_id and labels.local_rule_id=e.properties->>'local_rule_id'
where not p.is_test and e.event_name in ('nudge_requested','shield_quit_chosen','shield_continue_chosen','nudge_end_session');

revoke all on public.legacy_swift_enrollment_records,public.legacy_swift_questionnaires,
 public.legacy_swift_app_plans,public.legacy_swift_feedback_records,public.legacy_swift_settings_changes,
 public.legacy_swift_daily_research,public.legacy_swift_session_records,public.legacy_swift_intervention_records from public,anon,authenticated;
grant select on public.legacy_swift_profiles,public.legacy_swift_feedback,
 public.legacy_swift_enrollment_records,public.legacy_swift_questionnaires,
 public.legacy_swift_app_plans,public.legacy_swift_feedback_records,public.legacy_swift_settings_changes,
 public.legacy_swift_daily_research,public.legacy_swift_session_records,public.legacy_swift_intervention_records to service_role;
commit;
