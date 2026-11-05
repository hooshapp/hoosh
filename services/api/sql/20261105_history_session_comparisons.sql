begin;

-- Research-only comparison of Disconnect session observations already in Supabase.
-- Apple's private DeviceActivityReport totals are a separate, on-device measure.
create or replace view public.legacy_swift_history_session_comparisons
with (security_invoker = true) as
with zones as (
  select distinct on (e.user_id) e.user_id, z.name as timezone
  from public.legacy_swift_events e
  join pg_timezone_names z on z.name = e.properties->>'timezone'
  order by e.user_id, e.occurred_at desc, e.id desc
), observations as (
  select e.user_id, d.study_day, e.properties->>'session_id' as session_id,
    max(case when e.properties->>'used_minutes' ~ '^[0-9]{1,3}$'
      then least(240, (e.properties->>'used_minutes')::integer) end) as minutes
  from public.legacy_swift_events e
  join public.legacy_swift_daily_research d on d.user_id = e.user_id
    and e.properties->>'session_day' in (to_char(d.study_day, 'YYYY-MM-DD'), to_char(d.study_day, 'YYYY-FMMM-FMDD'))
  where e.event_name in ('session_checkpoint','session_snapshot','session_ended','session_expired')
    and nullif(e.properties->>'session_id','') is not null
  group by e.user_id, d.study_day, e.properties->>'session_id'
), daily as (
  select user_id, study_day, sum(minutes) as minutes
  from observations where minutes is not null group by user_id, study_day
), windows as (
  select p.user_id, p.participant_name, p.contact_email, p.telemetry_gap_detected,
    k.period, z.timezone, t.today, w.current_start,
    (w.current_start - k.step)::date as previous_start
  from public.legacy_swift_participants p
  join zones z using (user_id)
  cross join (values ('week',interval '1 week'), ('month',interval '1 month')) k(period,step)
  cross join lateral (select (now() at time zone z.timezone)::date as today) t
  cross join lateral (select date_trunc(k.period, t.today::timestamp)::date as current_start) w
  where not p.is_test
), totals as (
  select w.*, least(w.today - w.current_start, w.current_start - w.previous_start) as required_days,
    m.paired_days, m.before_minutes, m.after_minutes
  from windows w
  cross join lateral (
    select count(*) as paired_days, sum(b.minutes) as before_minutes, sum(a.minutes) as after_minutes
    from generate_series(0, least(w.today - w.current_start, w.current_start - w.previous_start) - 1) as g(day_offset)
    join daily b on b.user_id = w.user_id and b.study_day = w.previous_start + g.day_offset
    join daily a on a.user_id = w.user_id and a.study_day = w.current_start + g.day_offset
  ) m
), eligible as (
  select *, paired_days > 0 and paired_days = required_days and not telemetry_gap_detected as comparable
  from totals
), metrics as (
  select *, case when comparable and before_minutes > 0
    then 100 * (before_minutes - after_minutes) / before_minutes end as reduction_percent,
    case when comparable then greatest(0, before_minutes - after_minutes) end as reclaimed_minutes
  from eligible
)
select user_id, participant_name, contact_email, period, timezone,
  today as as_of_local_date, previous_start, current_start, required_days, paired_days, telemetry_gap_detected,
  'Disconnect session checkpoints only; weeks start Monday'::text as data_source,
  case when comparable then before_minutes end as before_observed_minutes,
  case when comparable then after_minutes end as after_observed_minutes,
  reduction_percent,
  case when reduction_percent is not null then round(greatest(0, least(100, reduction_percent)) / 10)::integer end as reduction_circles,
  reclaimed_minutes as reclaimed_observed_minutes,
  case when paired_days >= 3 and reclaimed_minutes > 0
    then reclaimed_minutes * 365 / paired_days end as projected_year_observed_minutes
from metrics;

revoke all on public.legacy_swift_history_session_comparisons from public, anon, authenticated;
grant select on public.legacy_swift_history_session_comparisons to service_role;
commit;
