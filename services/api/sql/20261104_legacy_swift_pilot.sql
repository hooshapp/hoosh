-- Additive legacy-iOS pilot storage. Existing profiles and disconnect_api grants
-- are intentionally untouched. Auth identities are shared with the newer app.
begin;
create table public.legacy_swift_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}' check (jsonb_typeof(preferences) = 'object' and octet_length(preferences::text) <= 32768),
  plan jsonb not null default '[]' check (jsonb_typeof(plan) = 'array' and octet_length(plan::text) <= 32768),
  updated_at timestamptz not null default now()
);
create table public.legacy_swift_events (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null check (event_name ~ '^[a-z][a-z0-9_]{0,63}$'),
  properties jsonb not null default '{}' check (jsonb_typeof(properties) = 'object' and octet_length(properties::text) <= 4096),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now()
);
create index legacy_swift_events_user_time on public.legacy_swift_events(user_id, occurred_at);
create table public.legacy_swift_feedback (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  message text not null check (length(message) <= 2000),
  context text not null check (length(context) <= 100),
  created_at timestamptz not null default now()
);
create table public.legacy_swift_research (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers) = 'object' and octet_length(answers::text) <= 32768),
  created_at timestamptz not null default now()
);
alter table public.legacy_swift_profiles enable row level security;
alter table public.legacy_swift_events enable row level security;
alter table public.legacy_swift_feedback enable row level security;
alter table public.legacy_swift_research enable row level security;
revoke all on public.legacy_swift_profiles, public.legacy_swift_events, public.legacy_swift_feedback, public.legacy_swift_research from public, anon, authenticated;
grant select, insert, update on public.legacy_swift_profiles to authenticated;
grant select, insert on public.legacy_swift_events, public.legacy_swift_feedback, public.legacy_swift_research to authenticated;
create policy swift_profile_owner on public.legacy_swift_profiles for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy swift_event_read on public.legacy_swift_events for select to authenticated using ((select auth.uid()) = user_id);
create policy swift_event_write on public.legacy_swift_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy swift_feedback_read on public.legacy_swift_feedback for select to authenticated using ((select auth.uid()) = user_id);
create policy swift_feedback_write on public.legacy_swift_feedback for insert to authenticated with check ((select auth.uid()) = user_id);
create policy swift_research_read on public.legacy_swift_research for select to authenticated using ((select auth.uid()) = user_id);
create policy swift_research_write on public.legacy_swift_research for insert to authenticated with check ((select auth.uid()) = user_id);
commit;
