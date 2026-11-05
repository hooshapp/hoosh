-- Research pilot enrollment; existing app email confirmation/auth remains unchanged.
-- Run once after 20261104_legacy_swift_pilot.sql, using the project SQL editor.
begin;
create table public.legacy_swift_participants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  participant_name text not null check (length(trim(participant_name)) between 1 and 100),
  contact_email text not null check (length(contact_email) <= 254 and contact_email ~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$'),
  joined_at timestamptz not null default now(),
  telemetry_gap_detected boolean not null default false,
  is_test boolean not null default false
);
alter table public.legacy_swift_participants enable row level security;
revoke all on public.legacy_swift_participants from public, anon, authenticated;
grant select on public.legacy_swift_participants to authenticated;
grant insert (user_id, participant_name, contact_email, telemetry_gap_detected), update (user_id, participant_name, contact_email, telemetry_gap_detected) on public.legacy_swift_participants to authenticated;
create policy swift_participant_owner on public.legacy_swift_participants for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Admin-only views. One session's cumulative checkpoints/expiry/end are MAXed,
-- never SUMmed, so snapshots and retries cannot multiply usage minutes.
create view public.legacy_swift_progress with (security_invoker = true) as
with samples as (
  select user_id, properties->>'session_id' as session_id,
    max(case when properties->>'used_minutes' ~ '^[0-9]{1,3}$'
      then least(240,(properties->>'used_minutes')::integer) else 0 end) as minutes
  from public.legacy_swift_events
  where event_name in ('session_checkpoint','session_snapshot','session_ended','session_expired')
    and nullif(properties->>'session_id','') is not null
  group by user_id, properties->>'session_id'
), usage_totals as (
  select user_id,sum(minutes) as selected_app_usage_minutes from samples group by user_id
), visits as (
  select user_id,properties->>'visit_id' as visit_id,
    max(case when properties->>'foreground_seconds' ~ '^[0-9]{1,5}$'
      then least(86400,(properties->>'foreground_seconds')::integer) else 0 end) as seconds
  from public.legacy_swift_events where event_name='app_visit_ended'
  group by user_id,properties->>'visit_id'
), visit_totals as (
  select user_id,sum(seconds) as observed_disconnect_foreground_seconds from visits group by user_id
), activity as (
  select user_id,min(occurred_at) as first_activity_at,max(occurred_at) as last_activity_at,
    count(*) filter (where event_name='session_started') as sessions_started,
    count(*) filter (where event_name='session_ended') as sessions_ended,
    count(*) filter (where event_name='session_started' and properties->>'extra'='true') as extra_sessions,
    count(*) filter (where event_name='nudge_requested') as nudges_requested,
    count(*) filter (where event_name='shield_quit_chosen') as shield_quit_choices,
    count(*) filter (where event_name='shield_continue_chosen') as shield_continue_choices,
    count(*) filter (where event_name='nudge_end_session') as nudge_end_choices,
    count(*) filter (where event_name='app_visit_started') as disconnect_visits
  from public.legacy_swift_events group by user_id
)
select p.user_id,p.participant_name,p.contact_email,p.joined_at,p.telemetry_gap_detected,
  a.first_activity_at,a.last_activity_at,
  coalesce(u.selected_app_usage_minutes,0) as selected_app_usage_minutes,
  coalesce(v.observed_disconnect_foreground_seconds,0) as observed_disconnect_foreground_seconds,
  coalesce(a.sessions_started,0) as sessions_started,coalesce(a.sessions_ended,0) as sessions_ended,
  coalesce(a.extra_sessions,0) as extra_sessions,coalesce(a.nudges_requested,0) as nudges_requested,
  coalesce(a.shield_quit_choices,0) as shield_quit_choices,coalesce(a.shield_continue_choices,0) as shield_continue_choices,
  coalesce(a.nudge_end_choices,0) as nudge_end_choices,coalesce(a.disconnect_visits,0) as disconnect_visits
from public.legacy_swift_participants p
left join activity a using(user_id) left join usage_totals u using(user_id) left join visit_totals v using(user_id)
where not p.is_test;

create view public.legacy_swift_daily_progress with (security_invoker = true) as
with samples as (
  select e.user_id,e.properties->>'session_id' as session_id,e.properties->>'session_day' as study_day,
    max(case when e.properties->>'used_minutes' ~ '^[0-9]{1,3}$'
      then least(240,(e.properties->>'used_minutes')::integer) else 0 end) as minutes
  from public.legacy_swift_events e join public.legacy_swift_participants p using(user_id)
  where not p.is_test and e.event_name in ('session_checkpoint','session_snapshot','session_ended','session_expired')
    and nullif(e.properties->>'session_id','') is not null
  group by e.user_id,e.properties->>'session_id',e.properties->>'session_day'
)
select user_id,study_day,sum(minutes) as selected_app_usage_minutes from samples group by user_id,study_day;
revoke all on public.legacy_swift_progress,public.legacy_swift_daily_progress from public,anon,authenticated;
grant select on public.legacy_swift_participants,public.legacy_swift_events,public.legacy_swift_progress,public.legacy_swift_daily_progress to service_role;
commit;
