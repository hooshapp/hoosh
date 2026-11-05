-- Uses two existing Auth identities only inside a rolled-back transaction.
-- Never requests credentials or changes auth.users / existing public.profiles.
begin;
do $$
declare a uuid; b uuid;
begin
  select id into a from auth.users order by created_at, id limit 1;
  select id into b from auth.users where id <> a order by created_at, id limit 1;
  if a is null or b is null then raise exception 'Two existing test identities are needed'; end if;
  perform set_config('swift_test.a',a::text,true);
  perform set_config('swift_test.b',b::text,true);
  perform set_config('swift_test.event',gen_random_uuid()::text,true);
end $$;
set local role authenticated;
do $$ begin
  perform set_config('request.jwt.claim.sub',current_setting('swift_test.a'),true);
  perform set_config('request.jwt.claims',json_build_object('sub',current_setting('swift_test.a'),'role','authenticated')::text,true);
end $$;
insert into public.legacy_swift_profiles(user_id,preferences,plan)
values (current_setting('swift_test.a')::uuid,'{"qa_test":true}','[{"dailyMinutes":30,"sessionMinutes":15}]')
on conflict(user_id) do update set preferences=excluded.preferences,plan=excluded.plan;
insert into public.legacy_swift_events(id,user_id,event_name,properties,occurred_at)
values(current_setting('swift_test.event')::uuid,current_setting('swift_test.a')::uuid,'session_started','{"qa_test":true}',now());
insert into public.legacy_swift_events(id,user_id,event_name,properties,occurred_at)
values(current_setting('swift_test.event')::uuid,current_setting('swift_test.a')::uuid,'session_started','{"qa_test":true}',now()) on conflict(id) do nothing;
insert into public.legacy_swift_feedback(id,user_id,rating,message,context)
values(gen_random_uuid(),current_setting('swift_test.a')::uuid,5,'Synthetic rollback-only feedback','qa');
insert into public.legacy_swift_research(id,user_id,answers)
values(gen_random_uuid(),current_setting('swift_test.a')::uuid,'{"qa_test":true}');
do $$ declare n int; begin
  select count(*) into n from public.legacy_swift_profiles where user_id=current_setting('swift_test.a')::uuid and preferences->>'qa_test'='true';
  if n<>1 then raise exception 'Own preference readback failed'; end if;
  select count(*) into n from public.legacy_swift_events where id=current_setting('swift_test.event')::uuid;
  if n<>1 then raise exception 'Idempotent event retry failed'; end if;
end $$;
do $$ begin
  perform set_config('request.jwt.claim.sub',current_setting('swift_test.b'),true);
  perform set_config('request.jwt.claims',json_build_object('sub',current_setting('swift_test.b'),'role','authenticated')::text,true);
end $$;
do $$ declare tab text; n int; begin
  foreach tab in array array['legacy_swift_profiles','legacy_swift_events','legacy_swift_feedback','legacy_swift_research'] loop
    execute format('select count(*) from public.%I where user_id=$1',tab) into n using current_setting('swift_test.a')::uuid;
    if n<>0 then raise exception 'Cross-user read allowed: %',tab; end if;
  end loop;
  update public.legacy_swift_profiles set preferences='{"tampered":true}' where user_id=current_setting('swift_test.a')::uuid;
  get diagnostics n=row_count;
  if n<>0 then raise exception 'Cross-user update allowed'; end if;
  begin
    insert into public.legacy_swift_events(id,user_id,event_name,properties,occurred_at)
    values(gen_random_uuid(),current_setting('swift_test.a')::uuid,'forged_event','{}',now());
    raise exception 'Forged owner insert allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
set local role anon;
do $$ declare tab text; begin
  foreach tab in array array['legacy_swift_profiles','legacy_swift_events','legacy_swift_feedback','legacy_swift_research'] loop
    begin
      execute format('select count(*) from public.%I',tab);
      raise exception 'Anonymous read allowed: %',tab;
    exception when insufficient_privilege then null;
    end;
  end loop;
end $$;
reset role;
rollback;
select 'PASS' as result, 'Own writes/readback; event retry; four-table cross-user isolation; forged-owner rejection; anonymous denial; all fixtures rolled back' as checks;
