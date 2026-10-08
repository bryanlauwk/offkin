-- RUN ONLY through pilot-db-verify.py in its explicitly marked disposable DB.
-- Requires BOTH ordered source migrations: 20261008070000_pilot_invite_budget.sql
-- then 20261008133000_pilot_brand_discovery.sql. Original-only execution is no
-- longer supported by this fixture. It exercises BUYER generation regression;
-- QA issuance/activation and discovery RPC concurrency need separate fixtures.
-- Single-transaction functional/role checks, NOT concurrency evidence.
-- Synthetic digests have no known bearer preimage; no provider is ever contacted.
-- Test activation, owner-only clock fixtures, invites and mock results all ROLLBACK.
begin;
set local statement_timeout = '15s';
create schema pilot_verify;
grant usage on schema pilot_verify to anon, authenticated, service_role;

create function pilot_verify.assert_true(ok boolean, label text) returns void
language plpgsql security invoker set search_path = pg_catalog as $$
begin
  if ok is distinct from true then raise exception 'FAIL: %', label; end if;
end;
$$;
create function pilot_verify.expect_state(command text, expected text, label text) returns void
language plpgsql security invoker set search_path = pg_catalog as $$
declare actual text;
begin
  begin
    execute command;
  exception when others then
    get stacked diagnostics actual = returned_sqlstate;
  end;
  perform pilot_verify.assert_true(actual is not distinct from expected, label || ' SQLSTATE=' || coalesce(actual, 'no error'));
end;
$$;
create function pilot_verify.new_invite(n integer) returns uuid
language plpgsql security invoker set search_path = pg_catalog as $$
declare result uuid;
begin
  insert into public.pilot_invites(campaign_id, token_digest)
    select id, lpad(to_hex(n), 64, '0') from public.pilot_campaigns where campaign_kind='buyer' returning id into result;
  return result;
end;
$$;
create function pilot_verify.reserve(n integer, label text, stage text,
  world uuid default null, physical uuid default null, previous uuid default null, kind text default 'asset')
returns jsonb language sql security invoker set search_path = pg_catalog as $$
  select public.reserve_pilot_operation(lpad(to_hex(n),64,'0'), label,
    md5(label) || md5(label), kind, stage, world, physical, previous);
$$;
create function pilot_verify.asset(n integer, label text, stage text,
  world uuid default null, physical uuid default null, previous uuid default null)
returns uuid language plpgsql security invoker set search_path = pg_catalog as $$
declare r jsonb; op uuid; result uuid := gen_random_uuid(); owner_id uuid;
begin
  r := pilot_verify.reserve(n,label,stage,world,physical,previous);
  perform pilot_verify.assert_true(r->>'status' = 'reserved', label || ' reserved');
  op := (r->>'operation_id')::uuid; owner_id := (r->>'invite_id')::uuid;
  perform pilot_verify.assert_true((public.claim_pilot_dispatch(op,'text')->>'allowed')::boolean, label || ' text');
  perform pilot_verify.assert_true((public.claim_pilot_dispatch(op,'image')->>'allowed')::boolean, label || ' image');
  insert into public.brick_concepts(id,cache_key,brand,title,story,image_path,prompt_version,pilot_invite_id)
    values(result,result::text,'fixture','fixture','fixture','never-uploaded/fixture.png','fixture',owner_id);
  perform pilot_verify.assert_true((public.finish_pilot_operation(op,result,null,null)->>'ok')::boolean, label || ' finish');
  return result;
end;
$$;

-- Fresh migration must be disabled and empty before any fixture activation.
select pilot_verify.assert_true((select count(*) = 2 and count(*) filter (where campaign_kind='buyer') = 1
  and count(*) filter (where campaign_kind='qa') = 1 and bool_and(not enabled) and sum(seats_issued) = 0
  and sum(image_attempts_reserved) = 0 and sum(text_dispatches_reserved) = 0 from public.pilot_campaigns), 'inactive migration');
select pilot_verify.assert_true((select count(*) = 0 from public.pilot_invites), 'no issued invites');
select pilot_verify.assert_true((select count(*) = 3 and bool_and(relrowsecurity) from pg_class
  where oid in ('public.pilot_campaigns'::regclass,'public.pilot_invites'::regclass,'public.pilot_operations'::regclass)), 'RLS enabled');

-- Real SET ROLE checks. Each denied statement must produce 42501, not merely zero rows.
savepoint role_anon;
set local role anon;
do $test$
declare target text; command text;
begin
  perform pilot_verify.assert_true(current_user = 'anon', 'actual anon role');
  foreach target in array array['pilot_campaigns','pilot_invites','pilot_operations'] loop
    perform pilot_verify.expect_state('select * from public.' || target, '42501', target || ' select');
    perform pilot_verify.expect_state('insert into public.' || target || ' default values', '42501', target || ' insert');
    perform pilot_verify.expect_state('delete from public.' || target, '42501', target || ' delete');
    perform pilot_verify.expect_state('update public.' || target || ' set id=id', '42501', target || ' update');
    perform pilot_verify.expect_state('truncate public.' || target, '42501', target || ' truncate');
  end loop;
  foreach command in array array[
    $$select public.get_pilot_invite_access(repeat('0',64))$$,
    $$select public.get_pilot_operation(repeat('0',64),repeat('0',64))$$,
    $$select public.reserve_pilot_operation(repeat('0',64),'fixture0',repeat('0',64),'asset','world')$$,
    $$select public.claim_pilot_dispatch(null,'text')$$,
    $$select public.finish_pilot_operation(null,null,null,null)$$
  ] loop perform pilot_verify.expect_state(command,'42501','anon RPC'); end loop;
end;
$test$;
rollback to role_anon;
savepoint role_authenticated;
set local role authenticated;
do $test$
declare target text; command text;
begin
  perform pilot_verify.assert_true(current_user = 'authenticated', 'actual authenticated role');
  foreach target in array array['pilot_campaigns','pilot_invites','pilot_operations'] loop
    perform pilot_verify.expect_state('select * from public.' || target,'42501',target || ' select');
    perform pilot_verify.expect_state('insert into public.' || target || ' default values','42501',target || ' insert');
    perform pilot_verify.expect_state('delete from public.' || target,'42501',target || ' delete');
    perform pilot_verify.expect_state('update public.' || target || ' set id=id','42501',target || ' update');
    perform pilot_verify.expect_state('truncate public.' || target,'42501',target || ' truncate');
  end loop;
  foreach command in array array[
    $$select public.get_pilot_invite_access(repeat('0',64))$$,
    $$select public.get_pilot_operation(repeat('0',64),repeat('0',64))$$,
    $$select public.reserve_pilot_operation(repeat('0',64),'fixture0',repeat('0',64),'asset','world')$$,
    $$select public.claim_pilot_dispatch(null,'text')$$,
    $$select public.finish_pilot_operation(null,null,null,null)$$
  ] loop perform pilot_verify.expect_state(command,'42501','authenticated RPC'); end loop;
end;
$test$;
rollback to role_authenticated;

savepoint seat_lifetime;
set local role service_role;
do $test$
declare n integer; invited uuid;
begin
  perform pilot_verify.assert_true(current_user = 'service_role','actual service role');
  for n in 1..5 loop invited := pilot_verify.new_invite(n); end loop;
  perform pilot_verify.assert_true((select seats_issued = 5 from public.pilot_campaigns where campaign_kind='buyer'),'fifth seat allowed');
  perform pilot_verify.expect_state('select pilot_verify.new_invite(6)','23514','sixth seat denied');
  perform pilot_verify.assert_true((select bool_and(expires_at-created_at = interval '336 hours') from public.pilot_invites),'14 day issuance expiry');
  perform pilot_verify.expect_state('update public.pilot_invites set expires_at=expires_at+interval ''1 hour''','23514','cannot extend invite');
  update public.pilot_invites set revoked_at=clock_timestamp() where id=invited;
  perform pilot_verify.expect_state('update public.pilot_invites set revoked_at=null where revoked_at is not null','23514','cannot un-revoke');
  perform pilot_verify.expect_state('delete from public.pilot_invites','42501','cannot delete issued seat');
  perform pilot_verify.expect_state('select pilot_verify.new_invite(6)','23514','revocation does not recycle seat');
  perform pilot_verify.expect_state('update public.pilot_campaigns set enabled=true where campaign_kind=''buyer''','23514','expiry required to activate');
end;
$test$;
rollback to seat_lifetime;

-- Kill, campaign-expiry and revocation checks all hit both reserve and dispatch.
savepoint gates;
set local role service_role;
do $test$
declare r jsonb; op uuid; invite uuid;
begin
  invite := pilot_verify.new_invite(1);
  perform pilot_verify.assert_true(public.get_pilot_invite_access(lpad('1',64,'0'))->>'reason'='pilot_disabled','inactive credential denied');
  perform pilot_verify.assert_true(pilot_verify.reserve(1,'gate_world','world')->>'reason'='pilot_disabled','disabled reserve');
  update public.pilot_campaigns set enabled=true,expires_at=clock_timestamp()+interval '30 days' where campaign_kind='buyer';
  r := pilot_verify.reserve(1,'gate_world','world'); op := (r->>'operation_id')::uuid;
  update public.pilot_campaigns set enabled=false where campaign_kind='buyer';
  perform pilot_verify.assert_true(public.claim_pilot_dispatch(op,'text')->>'reason'='pilot_disabled','kill blocks dispatch');
  perform pilot_verify.assert_true(pilot_verify.reserve(1,'gate_again','world')->>'reason'='pilot_disabled','kill blocks reserve');
  update public.pilot_campaigns set enabled=true,expires_at=clock_timestamp()-interval '1 hour' where campaign_kind='buyer';
  perform pilot_verify.assert_true(public.get_pilot_invite_access(lpad('1',64,'0'))->>'reason'='pilot_expired','campaign expiry access');
  perform pilot_verify.assert_true(public.claim_pilot_dispatch(op,'text')->>'reason'='pilot_expired','campaign expiry dispatch');
  perform pilot_verify.assert_true(pilot_verify.reserve(1,'gate_again','world')->>'reason'='pilot_expired','campaign expiry reserve');
  update public.pilot_campaigns set expires_at=clock_timestamp()+interval '30 days' where campaign_kind='buyer';
  update public.pilot_invites set revoked_at=clock_timestamp() where id=invite;
  perform pilot_verify.assert_true(public.get_pilot_invite_access(lpad('1',64,'0'))->>'reason'='invite_revoked','revoked access');
  perform pilot_verify.assert_true(public.claim_pilot_dispatch(op,'text')->>'reason'='invite_revoked','revoked dispatch');
  perform pilot_verify.assert_true(pilot_verify.reserve(1,'gate_again','world')->>'reason'='invite_revoked','revoked reserve');
  perform pilot_verify.assert_true((select image_attempts_reserved=1 and text_dispatches_reserved=1 from public.pilot_invites),'gates do not refund or double charge');
end;
$test$;
rollback to gates;

-- Owner-only simulated elapsed time. Never disable this trigger in an application DB.
savepoint invite_expiry;
set local role service_role;
select pilot_verify.new_invite(1);
update public.pilot_campaigns set enabled=true,expires_at=clock_timestamp()+interval '30 days' where campaign_kind='buyer';
select pilot_verify.reserve(1,'expiry_world','world');
reset role;
alter table public.pilot_invites disable trigger enforce_pilot_invite_lifetime;
update public.pilot_invites set created_at=statement_timestamp()-interval '337 hours',expires_at=statement_timestamp()-interval '1 hour';
alter table public.pilot_invites enable trigger enforce_pilot_invite_lifetime;
set local role service_role;
select pilot_verify.assert_true(public.get_pilot_invite_access(lpad('1',64,'0'))->>'reason'='invite_expired','expired access');
select pilot_verify.assert_true(pilot_verify.reserve(1,'expiry_again','world')->>'reason'='invite_expired','expired reserve');
select pilot_verify.assert_true(public.claim_pilot_dispatch((select id from public.pilot_operations),'text')->>'reason'='invite_expired','expired dispatch');
rollback to invite_expiry;

savepoint uncertain;
set local role service_role;
do $test$
declare r jsonb; op uuid;
begin
  perform pilot_verify.new_invite(1);
  update public.pilot_campaigns set enabled=true,expires_at=clock_timestamp()+interval '30 days' where campaign_kind='buyer';
  perform pilot_verify.assert_true(public.get_pilot_operation(lpad('1',64,'0'),repeat('f',64))->>'status'='not_found','read-only recovery miss');
  perform pilot_verify.assert_true((select count(*)=0 from public.pilot_operations),'lookup did not reserve');
  r:=pilot_verify.reserve(1,'unknown_world','world'); op:=(r->>'operation_id')::uuid;
  perform pilot_verify.assert_true(public.claim_pilot_dispatch(op,'image')->>'reason'='invalid_dispatch_order','image cannot precede text');
  perform pilot_verify.assert_true(pilot_verify.reserve(1,'unknown_world','world')->>'status'='in_progress','matching duplicate pending');
  perform pilot_verify.assert_true((public.get_pilot_invite_access(lpad('1',64,'0'))->>'blocked_attempt')::boolean,'pending attempt is blocked');
  perform pilot_verify.assert_true(public.get_pilot_operation(lpad('1',64,'0'),md5('unknown_world')||md5('unknown_world'))->>'status'='in_progress','lookup pending without reservation');
  perform pilot_verify.assert_true(public.reserve_pilot_operation(lpad('1',64,'0'),'unknown_world',repeat('f',64),'asset','world')->>'reason'='idempotency_conflict','changed payload same key');
  perform pilot_verify.assert_true(public.reserve_pilot_operation(lpad('1',64,'0'),'other_key',md5('unknown_world')||md5('unknown_world'),'asset','world')->>'status'='in_progress','new key same content');
  perform pilot_verify.assert_true((public.claim_pilot_dispatch(op,'text')->>'allowed')::boolean,'first text claim');
  perform pilot_verify.assert_true(public.claim_pilot_dispatch(op,'text')->>'reason'='dispatch_already_claimed','unknown text outcome cannot retry claim');
  perform pilot_verify.assert_true((public.finish_pilot_operation(op,null,'provider_outcome_unknown',null)->>'ok')::boolean,'record unknown');
  perform pilot_verify.assert_true(pilot_verify.reserve(1,'unknown_world','world')->>'status'='failed','failed duplicate consumed');
  perform pilot_verify.assert_true(public.get_pilot_operation(lpad('1',64,'0'),md5('unknown_world')||md5('unknown_world'))->>'status'='failed','lookup failed without refund');
  perform pilot_verify.assert_true(pilot_verify.reserve(1,'new_world_key','world')->>'reason'='stage_consumed','new content cannot buy a retry');
  perform pilot_verify.assert_true(public.claim_pilot_dispatch(op,'image')->>'reason'='operation_terminal','failed operation cannot continue');
  perform pilot_verify.assert_true((select image_attempts_reserved=1 and text_dispatches_reserved=1 from public.pilot_campaigns where campaign_kind='buyer'),'unknown conservatively consumes full pipeline');
  perform pilot_verify.expect_state('update public.pilot_operations set text_dispatched_at=null','23514','cannot rewind claim');
  perform pilot_verify.expect_state('update public.pilot_invites set image_attempts_reserved=0,text_dispatches_reserved=0','23514','cannot refund invite');
  perform pilot_verify.expect_state('update public.pilot_campaigns set image_attempts_reserved=0,text_dispatches_reserved=0 where campaign_kind=''buyer''','23514','cannot refund campaign');
end;
$test$;
rollback to uncertain;

-- Simulated save/finish uncertainty: owned cached result reconciles without a claim.
savepoint saved_asset_recovery;
set local role service_role;
do $test$
declare owner1 uuid; owner2 uuid; foreign_result uuid:=gen_random_uuid(); saved_result uuid:=gen_random_uuid();
  alternate_result uuid:=gen_random_uuid(); r jsonb; op uuid; fp text:=md5('recover_world')||md5('recover_world');
begin
  owner1:=pilot_verify.new_invite(1); owner2:=pilot_verify.new_invite(2);
  update public.pilot_campaigns set enabled=true,expires_at=clock_timestamp()+interval '30 days' where campaign_kind='buyer';
  r:=pilot_verify.reserve(1,'recover_world','world'); op:=(r->>'operation_id')::uuid;
  perform pilot_verify.assert_true((public.claim_pilot_dispatch(op,'text')->>'allowed')::boolean,'recovery original text claim');
  perform pilot_verify.assert_true((public.claim_pilot_dispatch(op,'image')->>'allowed')::boolean,'recovery original image claim');
  insert into public.brick_concepts(id,cache_key,brand,title,story,image_path,prompt_version,pilot_invite_id) values
    (foreign_result,foreign_result::text,'fixture','fixture','fixture','never-uploaded/fixture.png','fixture',owner2),
    (saved_result,saved_result::text,'fixture','fixture','fixture','never-uploaded/fixture.png','fixture',owner1),
    (alternate_result,alternate_result::text,'fixture','fixture','fixture','never-uploaded/fixture.png','fixture',owner1);
  perform pilot_verify.assert_true(public.finish_pilot_operation(op,foreign_result,null,null)->>'reason'='result_owner_mismatch','cannot adopt foreign saved row');
  perform pilot_verify.assert_true(public.get_pilot_operation(lpad('1',64,'0'),fp)->>'status'='in_progress','unfinished owned row remains recoverable');
  perform pilot_verify.assert_true(public.get_pilot_operation(lpad('2',64,'0'),fp)->>'status'='not_found','lookup cannot cross invite ownership');
  perform pilot_verify.assert_true((public.finish_pilot_operation(op,saved_result,null,null)->>'ok')::boolean,'reconcile saved owned row');
  perform pilot_verify.assert_true((public.finish_pilot_operation(op,saved_result,null,null)->>'ok')::boolean,'identical asset finish idempotent');
  perform pilot_verify.assert_true(public.finish_pilot_operation(op,alternate_result,null,null)->>'reason'='operation_terminal','cannot replace completed asset');
  r:=public.get_pilot_operation(lpad('1',64,'0'),fp);
  perform pilot_verify.assert_true(r->>'status'='completed' and (r->>'result_id')::uuid=saved_result,'read-only saved asset replay');
  perform pilot_verify.assert_true(public.claim_pilot_dispatch(op,'image')->>'reason'='operation_terminal','recovery never grants another dispatch');
  perform pilot_verify.assert_true(not (public.get_pilot_invite_access(lpad('1',64,'0'))->>'blocked_attempt')::boolean,'reconciled operation clears blocked indicator');
  perform pilot_verify.assert_true((select image_attempts_reserved=1 and text_dispatches_reserved=1 from public.pilot_campaigns where campaign_kind='buyer'),'reconciliation charges zero additional liability');
end;
$test$;
rollback to saved_asset_recovery;

savepoint full_budget_lineage;
set local role service_role;
do $test$
declare n integer; w uuid; p uuid; d uuid; pack uuid; foreign_w uuid; revised uuid; r jsonb; op uuid; payload jsonb;
begin
  update public.pilot_campaigns set enabled=true,expires_at=clock_timestamp()+interval '30 days' where campaign_kind='buyer';
  for n in 1..5 loop
    perform pilot_verify.new_invite(n);
    w:=pilot_verify.asset(n,'world_'||lpad(n::text,3,'0'),'world');
    if n=1 then foreign_w:=w; end if;
    if n>1 then
      perform pilot_verify.assert_true(pilot_verify.reserve(n,'foreign_source','physical',foreign_w)->>'reason'='invalid_lineage','cross invite source denied');
    end if;
    p:=pilot_verify.asset(n,'physical_'||n,'physical',w);
    perform pilot_verify.assert_true(pilot_verify.reserve(n,'wrong_stage_source','details',p,p)->>'reason'='invalid_lineage','wrong source stage denied');
    d:=pilot_verify.asset(n,'details_'||n,'details',w,p);
    perform pilot_verify.assert_true(pilot_verify.reserve(n,'early_revision','details',w,p,d)->>'reason'='baseline_incomplete','revision needs complete baseline');
    perform pilot_verify.assert_true(pilot_verify.reserve(n,'early_planner',null,w,p,null,'planner')->>'reason'='baseline_incomplete','planner needs complete baseline');
    pack:=pilot_verify.asset(n,'packaging_'||n,'packaging',w,p);
    perform pilot_verify.assert_true(pilot_verify.reserve(n,'world_revision','world',null,null,w)->>'reason'='invalid_lineage','world revision denied');
    perform pilot_verify.assert_true(pilot_verify.reserve(n,'physical_revision','physical',w,null,p)->>'reason'='invalid_lineage','physical revision denied');
    perform pilot_verify.assert_true(pilot_verify.reserve(n,'wrong_ancestor','packaging',w,p,d)->>'reason'='invalid_lineage','revision ancestor must match stage');
    r:=pilot_verify.reserve(n,'planner_'||n,null,w,p,null,'planner'); op:=(r->>'operation_id')::uuid;
    perform pilot_verify.assert_true(r->>'status'='reserved','one planner reserved');
    perform pilot_verify.assert_true((public.claim_pilot_dispatch(op,'text')->>'allowed')::boolean,'planner text once');
    perform pilot_verify.assert_true(public.claim_pilot_dispatch(op,'image')->>'reason'='invalid_dispatch_order','planner never claims image');
    perform pilot_verify.assert_true(public.finish_pilot_operation(op,null,null,null)->>'reason'='invalid_completion','planner cannot finish without replay');
    perform pilot_verify.assert_true(public.finish_pilot_operation(op,null,null,'{"raw_token":"forbidden"}'::jsonb)->>'reason'='invalid_response_payload','unexpected payload fields denied');
    perform pilot_verify.assert_true(public.finish_pilot_operation(op,null,null,'42'::jsonb)->>'reason'='invalid_response_payload','scalar replay safely denied');
    perform pilot_verify.assert_true(public.finish_pilot_operation(op,null,null,'[]'::jsonb)->>'reason'='invalid_response_payload','array replay safely denied');
    perform pilot_verify.assert_true(public.finish_pilot_operation(op,null,null,jsonb_build_object('clarification',repeat('x',48001)))->>'reason'='invalid_response_payload','oversized replay denied');
    payload:=jsonb_build_object('clarification','Choose details or packaging.');
    perform pilot_verify.assert_true((public.finish_pilot_operation(op,null,null,payload)->>'ok')::boolean,'planner completion');
    perform pilot_verify.assert_true((public.finish_pilot_operation(op,null,null,payload)->>'ok')::boolean,'same planner finish idempotent');
    perform pilot_verify.assert_true(public.finish_pilot_operation(op,null,null,'{"clarification":"changed"}'::jsonb)->>'reason'='operation_terminal','cannot replace planner payload');
    r:=pilot_verify.reserve(n,'planner_'||n,null,w,p,null,'planner');
    perform pilot_verify.assert_true(r->>'status'='completed' and r->'response_payload'=payload and (r->>'allowed')::boolean=false,'free saved planner replay');
    perform pilot_verify.assert_true(public.get_pilot_operation(lpad(to_hex(n),64,'0'),md5('planner_'||n)||md5('planner_'||n))->'response_payload'=payload,'read-only planner replay');
    perform pilot_verify.assert_true(pilot_verify.reserve(n,'another_planner',null,w,p,null,'planner')->>'reason'='planner_consumed','second planner denied');
    if n%2=1 then revised:=pilot_verify.asset(n,'revision_'||n,'details',w,p,d);
    else revised:=pilot_verify.asset(n,'revision_'||n,'packaging',w,p,pack); end if;
    perform pilot_verify.assert_true(pilot_verify.reserve(n,'another_revision','details',w,p,d)->>'reason'='revision_consumed','sixth image denied');
    perform pilot_verify.assert_true((public.get_pilot_invite_access(lpad(to_hex(n),64,'0'))->>'ready')::boolean,'exhausted invite remains authenticated');
    perform pilot_verify.assert_true((select image_attempts_reserved=5 and planner_attempts_reserved=1 and text_dispatches_reserved=6
      from public.pilot_invites where token_digest=lpad(to_hex(n),64,'0')),'per-invite 5 image / 6 text ceiling');
  end loop;
  perform pilot_verify.assert_true((select image_attempts_reserved=25 and text_dispatches_reserved=30 from public.pilot_campaigns where campaign_kind='buyer'),'global exact 25 / 30 ceiling');
  perform pilot_verify.assert_true((select count(*)=30 from public.pilot_operations),'exact operation conservation');
  perform pilot_verify.expect_state('update public.pilot_campaigns set image_attempts_reserved=26 where campaign_kind=''buyer''','23514','26th image constraint');
  perform pilot_verify.expect_state('update public.pilot_campaigns set text_dispatches_reserved=31 where campaign_kind=''buyer''','23514','31st text constraint');
  perform pilot_verify.expect_state('update public.pilot_invites set image_attempts_reserved=6,text_dispatches_reserved=7','23514','sixth image/seventh text constraint');
  perform pilot_verify.expect_state('update public.pilot_invites set planner_attempts_reserved=2','23514','second planner constraint');
end;
$test$;
rollback to full_budget_lineage;

-- Counter fault/high-water fixtures test the explicit budget guards independently
-- of the stricter stage indexes. These are artificial liability, not actual calls.
savepoint budget_guards;
set local role service_role;
do $test$
declare w uuid;
begin
  perform pilot_verify.new_invite(1); perform pilot_verify.new_invite(2);
  update public.pilot_campaigns set enabled=true,expires_at=clock_timestamp()+interval '30 days',image_attempts_reserved=24,text_dispatches_reserved=29 where campaign_kind='buyer';
  w:=pilot_verify.asset(1,'last_global_image','world');
  perform pilot_verify.assert_true(pilot_verify.reserve(2,'past_global_image','world')->>'reason'='campaign_budget_exhausted','global high water denial');
  perform pilot_verify.assert_true((select count(*)=1 from public.pilot_operations),'denied global request has no operation');
end;
$test$;
rollback to budget_guards;
savepoint per_invite_guard;
set local role service_role;
do $test$
declare w uuid;
begin
  perform pilot_verify.new_invite(1);
  update public.pilot_campaigns set enabled=true,expires_at=clock_timestamp()+interval '30 days',image_attempts_reserved=4,text_dispatches_reserved=5 where campaign_kind='buyer';
  update public.pilot_invites set image_attempts_reserved=4,planner_attempts_reserved=1,text_dispatches_reserved=5;
  w:=pilot_verify.asset(1,'last_invite_image','world');
  perform pilot_verify.assert_true(pilot_verify.reserve(1,'past_invite_image','physical',w)->>'reason'='invite_budget_exhausted','per-invite high water denial');
end;
$test$;
rollback to per_invite_guard;

select pilot_verify.assert_true((select count(*)=1 and bool_and(not enabled and expires_at is null
  and seats_issued=0 and image_attempts_reserved=0 and text_dispatches_reserved=0
  and brand_researches_reserved=0 and brand_searches_reserved=0 and brand_reads_reserved=0)
  from public.pilot_campaigns where campaign_kind='qa'), 'QA allocation untouched');
select pilot_verify.assert_true((select count(*)=0 from public.pilot_invites where campaign_kind='qa'), 'no QA fixtures issued');

rollback;
select 'PASS: sequential fixtures rolled back; this is not concurrency evidence';
