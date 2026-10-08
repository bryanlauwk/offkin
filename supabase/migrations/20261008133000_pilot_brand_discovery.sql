-- SOURCE ONLY. This migration does not activate either campaign or issue tokens.
-- Applying it, enabling discovery/generation, deployment, and protected QA each
-- need separate authorization. Revoke the QA invite immediately after its test.
-- Five buyer seats retain 25 image / 30 generation-text attempts. The separate
-- one-seat QA allocation has 5 image / 6 generation-text attempts and expires
-- 24 hours after issuance. Discovery reserves a distinct 1 search / 2 reads per
-- invite, upfront, including failed, interrupted, or uncertain dispatches.
-- Never apply this source migration as part of a test or source-only review.

alter table public.pilot_campaigns
  drop constraint pilot_campaigns_singleton_key,
  drop constraint pilot_campaigns_seats_issued_check,
  drop constraint pilot_campaigns_image_attempts_reserved_check,
  drop constraint pilot_campaigns_text_dispatches_reserved_check,
  add column campaign_kind text not null default 'buyer'
    check (campaign_kind in ('buyer', 'qa')),
  add column brand_researches_reserved integer not null default 0,
  add column brand_searches_reserved integer not null default 0,
  add column brand_reads_reserved integer not null default 0,
  add constraint pilot_campaign_kind_unique unique (campaign_kind),
  add constraint pilot_campaign_id_kind_unique unique (id, campaign_kind),
  add constraint pilot_campaign_seat_cap check
    (seats_issued between 0 and case when campaign_kind = 'qa' then 1 else 5 end),
  add constraint pilot_campaign_image_cap check
    (image_attempts_reserved between 0 and case when campaign_kind = 'qa' then 5 else 25 end),
  add constraint pilot_campaign_text_cap check
    (text_dispatches_reserved between 0 and case when campaign_kind = 'qa' then 6 else 30 end),
  add constraint pilot_campaign_brand_cap check (
    brand_researches_reserved between 0 and case when campaign_kind = 'qa' then 1 else 5 end
    and brand_searches_reserved = brand_researches_reserved
    and brand_reads_reserved = 2 * brand_researches_reserved
  );

alter table public.pilot_invites
  drop constraint pilot_invite_lifetime,
  add column campaign_kind text not null default 'buyer',
  add constraint pilot_invite_campaign_kind foreign key (campaign_id, campaign_kind)
    references public.pilot_campaigns(id, campaign_kind) on delete restrict,
  add constraint pilot_invite_lifetime check
    (expires_at = created_at + case when campaign_kind = 'qa' then interval '24 hours' else interval '336 hours' end);

create or replace function public.enforce_pilot_invite_lifetime()
returns trigger language plpgsql security invoker set search_path = pg_catalog as $$
declare
  v_campaign public.pilot_campaigns%rowtype;
begin
  if tg_op = 'DELETE' then
    raise exception 'Pilot invite audit rows cannot be deleted' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id or new.campaign_id is distinct from old.campaign_id
      or new.campaign_kind is distinct from old.campaign_kind
      or new.token_digest is distinct from old.token_digest or new.created_at is distinct from old.created_at
      or new.expires_at is distinct from old.expires_at
      or new.image_attempts_reserved < old.image_attempts_reserved
      or new.planner_attempts_reserved < old.planner_attempts_reserved
      or new.text_dispatches_reserved < old.text_dispatches_reserved
      or (old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at) then
      raise exception 'Pilot identity, lifetime, revocation, and spent budget are immutable' using errcode = '23514';
    end if;
    return new;
  end if;
  select * into v_campaign from public.pilot_campaigns where id = new.campaign_id for update;
  if not found or v_campaign.seats_issued >= (case when v_campaign.campaign_kind = 'qa' then 1 else 5 end) then
    raise exception 'The lifetime seats for this pilot allocation have been issued' using errcode = '23514';
  end if;
  -- Issuance starts the clock, rather than first redemption. Backdating is not needed.
  new.created_at := clock_timestamp();
  new.campaign_kind := v_campaign.campaign_kind;
  new.expires_at := new.created_at + case when v_campaign.campaign_kind = 'qa' then interval '24 hours' else interval '336 hours' end;
  if new.image_attempts_reserved <> 0 or new.planner_attempts_reserved <> 0 or new.text_dispatches_reserved <> 0 then
    raise exception 'New pilot invite budgets must start unused' using errcode = '23514';
  end if;
  update public.pilot_campaigns set seats_issued = seats_issued + 1 where id = new.campaign_id;
  return new;
end;
$$;

create or replace function public.enforce_pilot_campaign_lifetime()
returns trigger language plpgsql security invoker set search_path = pg_catalog as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'The lifetime pilot campaign cannot be deleted' using errcode = '23514';
  end if;
  if new.id is distinct from old.id or new.created_at is distinct from old.created_at
    or new.singleton is distinct from old.singleton or new.campaign_kind is distinct from old.campaign_kind or new.seats_issued < old.seats_issued
    or new.image_attempts_reserved < old.image_attempts_reserved
    or new.text_dispatches_reserved < old.text_dispatches_reserved
    or new.brand_researches_reserved < old.brand_researches_reserved
    or new.brand_searches_reserved < old.brand_searches_reserved
    or new.brand_reads_reserved < old.brand_reads_reserved then
    raise exception 'Pilot campaign identity and spent budget are immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.get_pilot_invite_access(token_digest text)
returns jsonb language plpgsql stable security invoker set search_path = pg_catalog as $$
declare
  v_invite public.pilot_invites%rowtype;
  v_campaign public.pilot_campaigns%rowtype;
begin
  if token_digest is null or token_digest !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('ready', false, 'reason', 'invite_invalid');
  end if;
  select i.* into v_invite from public.pilot_invites i where i.token_digest = $1;
  if not found then return jsonb_build_object('ready', false, 'reason', 'invite_invalid'); end if;
  select c.* into v_campaign from public.pilot_campaigns c where c.id = v_invite.campaign_id;
  if not found or not v_campaign.enabled then return jsonb_build_object('ready', false, 'reason', 'pilot_disabled'); end if;
  if v_campaign.expires_at is null or v_campaign.expires_at <= statement_timestamp() then
    return jsonb_build_object('ready', false, 'reason', 'pilot_expired');
  end if;
  if v_invite.revoked_at is not null then return jsonb_build_object('ready', false, 'reason', 'invite_revoked'); end if;
  if v_invite.expires_at <= statement_timestamp() then return jsonb_build_object('ready', false, 'reason', 'invite_expired'); end if;
  return jsonb_build_object('ready', true, 'reason', null, 'invite_id', v_invite.id,
    'campaign_id', v_campaign.id, 'campaign_kind', v_campaign.campaign_kind, 'expires_at', least(v_invite.expires_at, v_campaign.expires_at),
    'blocked_attempt', exists (select 1 from public.pilot_operations o
      where o.invite_id = v_invite.id and o.status in ('reserved', 'failed')),
    'blocked_kind', (select o.operation_kind from public.pilot_operations o
      where o.invite_id = v_invite.id and o.status in ('reserved', 'failed')
      order by o.created_at, o.id limit 1),
    'remaining', jsonb_build_object('image_attempts', 5 - v_invite.image_attempts_reserved,
      'planner_attempts', 1 - v_invite.planner_attempts_reserved,
      'text_dispatches', 6 - v_invite.text_dispatches_reserved,
      'campaign_image_attempts', (case when v_campaign.campaign_kind = 'qa' then 5 else 25 end) - v_campaign.image_attempts_reserved,
      'campaign_text_dispatches', (case when v_campaign.campaign_kind = 'qa' then 6 else 30 end) - v_campaign.text_dispatches_reserved));
end;
$$;

create or replace function public.reserve_pilot_operation(
  token_digest text, operation_key text, request_fingerprint text, operation_kind text,
  stage text default null, source_world_id uuid default null,
  source_physical_id uuid default null, previous_asset_id uuid default null
)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare
  v_invite public.pilot_invites%rowtype;
  v_campaign public.pilot_campaigns%rowtype;
  v_existing public.pilot_operations%rowtype;
  v_operation_id uuid;
  v_image_cost integer;
  v_planner_cost integer;
begin
  if token_digest is null or token_digest !~ '^[0-9a-f]{64}$'
    or operation_key is null or operation_key !~ '^[A-Za-z0-9:_-]{8,128}$'
    or request_fingerprint is null or request_fingerprint !~ '^[0-9a-f]{64}$'
    or operation_kind is null or operation_kind not in ('asset', 'planner') then
    return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'invalid_operation');
  end if;
  select i.* into v_invite from public.pilot_invites i where i.token_digest = $1;
  if not found then return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'invite_invalid'); end if;
  -- Shared lock order in reserve/claim is campaign -> invite -> operation.
  -- This serializes global and per-invite liability across all edge instances.
  select c.* into v_campaign from public.pilot_campaigns c where c.id = v_invite.campaign_id for update;
  select i.* into v_invite from public.pilot_invites i where i.id = v_invite.id for update;
  if not v_campaign.enabled then return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'pilot_disabled'); end if;
  if v_campaign.expires_at is null or v_campaign.expires_at <= clock_timestamp() then
    return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'pilot_expired');
  end if;
  if v_invite.revoked_at is not null then return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'invite_revoked'); end if;
  if v_invite.expires_at <= clock_timestamp() then return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'invite_expired'); end if;

  select o.* into v_existing from public.pilot_operations o
    where o.invite_id = v_invite.id and o.operation_key = $2;
  if found and v_existing.request_fingerprint <> $3 then
    return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'idempotency_conflict');
  end if;
  -- Canonical content deduplication is separate from the untrusted browser key.
  select o.* into v_existing from public.pilot_operations o
    where o.invite_id = v_invite.id and o.request_fingerprint = $3;
  if found then
    if v_existing.operation_kind is distinct from $4 or v_existing.stage is distinct from $5
      or v_existing.source_world_id is distinct from $6 or v_existing.source_physical_id is distinct from $7
      or v_existing.previous_asset_id is distinct from $8 then
      return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'idempotency_conflict');
    end if;
    return jsonb_build_object('allowed', false,
      'status', case when v_existing.status = 'reserved' then 'in_progress' else v_existing.status end,
      'reason', case when v_existing.status = 'failed' then 'attempt_consumed' else null end,
      'operation_id', v_existing.id, 'result_id', v_existing.result_id,
      'response_payload', v_existing.response_payload, 'invite_id', v_invite.id);
  end if;

  if ($4 = 'planner' and ($5 is not null or $6 is null or $7 is null or $8 is not null))
    or ($4 = 'asset' and ($5 is null or $5 not in ('world', 'physical', 'details', 'packaging')))
    or ($4 = 'asset' and $5 = 'world' and ($6 is not null or $7 is not null or $8 is not null))
    or ($4 = 'asset' and $5 = 'physical' and ($6 is null or $7 is not null or $8 is not null))
    or ($4 = 'asset' and $5 in ('details', 'packaging') and ($6 is null or $7 is null)) then
    return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'invalid_lineage');
  end if;
  if $6 is not null and not exists (
    select 1 from public.pilot_operations o join public.brick_concepts b on b.id = o.result_id
    where o.invite_id = v_invite.id and b.pilot_invite_id = v_invite.id
      and o.operation_kind = 'asset' and o.stage = 'world' and o.previous_asset_id is null
      and o.status = 'completed' and o.result_id = $6
  ) then return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'invalid_lineage'); end if;
  if $7 is not null and not exists (
    select 1 from public.pilot_operations o join public.brick_concepts b on b.id = o.result_id
    where o.invite_id = v_invite.id and b.pilot_invite_id = v_invite.id
      and o.operation_kind = 'asset' and o.stage = 'physical' and o.previous_asset_id is null
      and o.status = 'completed' and o.result_id = $7 and o.source_world_id = $6
  ) then return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'invalid_lineage'); end if;

  if $4 = 'planner' or $8 is not null then
    if (select count(*) from public.pilot_operations o
        join public.brick_concepts b on b.id = o.result_id
        where o.invite_id = v_invite.id and b.pilot_invite_id = v_invite.id
          and o.operation_kind = 'asset' and o.previous_asset_id is null and o.status = 'completed') <> 4 then
      return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'baseline_incomplete');
    end if;
  end if;
  if $8 is not null and not exists (
    select 1 from public.pilot_operations o join public.brick_concepts b on b.id = o.result_id
    where o.invite_id = v_invite.id and b.pilot_invite_id = v_invite.id
      and o.operation_kind = 'asset' and o.stage = $5 and o.stage in ('details', 'packaging')
      and o.previous_asset_id is null and o.status = 'completed' and o.result_id = $8
      and o.source_world_id = $6 and o.source_physical_id = $7
  ) then return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'invalid_lineage'); end if;

  if $4 = 'planner' and exists (select 1 from public.pilot_operations o where o.invite_id = v_invite.id and o.operation_kind = 'planner') then
    return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'planner_consumed');
  end if;
  if $4 = 'asset' and $8 is null and exists (
    select 1 from public.pilot_operations o where o.invite_id = v_invite.id
      and o.operation_kind = 'asset' and o.stage = $5 and o.previous_asset_id is null
  ) then return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'stage_consumed'); end if;
  if $8 is not null and exists (
    select 1 from public.pilot_operations o where o.invite_id = v_invite.id
      and o.operation_kind = 'asset' and o.previous_asset_id is not null
  ) then return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'revision_consumed'); end if;

  v_image_cost := case when $4 = 'asset' then 1 else 0 end;
  v_planner_cost := case when $4 = 'planner' then 1 else 0 end;
  if v_invite.image_attempts_reserved + v_image_cost > 5
    or v_invite.planner_attempts_reserved + v_planner_cost > 1
    or v_invite.text_dispatches_reserved + 1 > 6 then
    return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'invite_budget_exhausted');
  end if;
  if v_campaign.image_attempts_reserved + v_image_cost > (case when v_campaign.campaign_kind = 'qa' then 5 else 25 end)
    or v_campaign.text_dispatches_reserved + 1 > (case when v_campaign.campaign_kind = 'qa' then 6 else 30 end) then
    return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'campaign_budget_exhausted');
  end if;
  -- Holding image liability even if text fails is intentional and non-refundable.
  update public.pilot_campaigns c
    set image_attempts_reserved = c.image_attempts_reserved + v_image_cost,
        text_dispatches_reserved = c.text_dispatches_reserved + 1
    where c.id = v_campaign.id;
  update public.pilot_invites i
    set image_attempts_reserved = i.image_attempts_reserved + v_image_cost,
        planner_attempts_reserved = i.planner_attempts_reserved + v_planner_cost,
        text_dispatches_reserved = i.text_dispatches_reserved + 1
    where i.id = v_invite.id;
  insert into public.pilot_operations(invite_id, campaign_id, operation_key, request_fingerprint,
    operation_kind, stage, source_world_id, source_physical_id, previous_asset_id)
    values (v_invite.id, v_campaign.id, $2, $3, $4, $5, $6, $7, $8) returning id into v_operation_id;
  return jsonb_build_object('allowed', true, 'status', 'reserved', 'reason', null,
    'operation_id', v_operation_id, 'result_id', null, 'response_payload', null, 'invite_id', v_invite.id);
end;
$$;

-- No buyer data is rewritten. The additional QA allocation starts disabled and
-- unissued; the existing buyer allocation retains its enabled/expiry state.
insert into public.pilot_campaigns (campaign_kind, enabled) values ('qa', false);

-- This is a minimal database guard, not a substitute for the edge contract,
-- public-URL validation, direct-source extraction, or network SSRF protection.
create function public.valid_pilot_brand_payload(payload jsonb, query_kind text)
returns boolean language plpgsql immutable security invoker set search_path = pg_catalog as $$
declare
  v_candidate jsonb;
  v_evidence jsonb;
  v_candidate_ids uuid[] := '{}'::uuid[];
  v_source_count integer := 0;
begin
  if $1 is null or jsonb_typeof($1) <> 'object' or octet_length($1::text) > 32000 then return false; end if;
  if not ($1 ?& array['version', 'queryKind', 'exactName', 'candidates', 'response'])
    or $1 - 'version' - 'queryKind' - 'exactName' - 'candidates' - 'response' <> '{}'::jsonb
    or $1 ->> 'version' is distinct from 'offkin-brand-research-v1'
    or $1 ->> 'queryKind' is distinct from $2
    or jsonb_typeof($1 -> 'exactName') not in ('string', 'null')
    or (jsonb_typeof($1 -> 'exactName') = 'string' and length($1 ->> 'exactName') not between 1 and 120)
    or ($2 = 'name' and jsonb_typeof($1 -> 'exactName') is distinct from 'string')
    or jsonb_typeof($1 -> 'candidates') <> 'array'
    or jsonb_typeof($1 -> 'response') <> 'object' then return false; end if;
  if jsonb_array_length($1 -> 'candidates') > 5 then return false; end if;
  for v_candidate in select value from jsonb_array_elements($1 -> 'candidates') loop
    if jsonb_typeof(v_candidate) <> 'object' then return false; end if;
    if not (v_candidate ?& array['id', 'url', 'title', 'excerpt', 'source'])
      or v_candidate - 'id' - 'url' - 'title' - 'excerpt' - 'source' <> '{}'::jsonb
      or jsonb_typeof(v_candidate -> 'id') <> 'string'
      or (v_candidate ->> 'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or jsonb_typeof(v_candidate -> 'url') <> 'string' or length(v_candidate ->> 'url') not between 1 and 300
      or jsonb_typeof(v_candidate -> 'title') <> 'string' or length(v_candidate ->> 'title') > 160
      or jsonb_typeof(v_candidate -> 'excerpt') <> 'string' or length(v_candidate ->> 'excerpt') > 1200
      or jsonb_typeof(v_candidate -> 'source') not in ('object', 'null') then return false; end if;
    if (v_candidate ->> 'id')::uuid = any(v_candidate_ids) then return false; end if;
    v_candidate_ids := array_append(v_candidate_ids, (v_candidate ->> 'id')::uuid);
    if jsonb_typeof(v_candidate -> 'source') = 'object' then v_source_count := v_source_count + 1; end if;
  end loop;
  if v_source_count > 2 then return false; end if;
  if $1 #>> '{response,contractVersion}' is distinct from 'offkin-brand-discovery-v1'
    or jsonb_typeof($1 #> '{response,researchId}') is distinct from 'string'
    or ($1 #>> '{response,researchId}') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or coalesce($1 #>> '{response,status}', '') not in ('choose', 'needs-context', 'ready', 'unavailable')
    or jsonb_typeof($1 #> '{response,evidence}') is distinct from 'array'
    or jsonb_typeof($1 #> '{response,candidates}') is distinct from 'array'
    or jsonb_typeof($1 #> '{response,message}') is distinct from 'string'
    or length($1 #>> '{response,message}') not between 1 and 320 then return false; end if;
  if jsonb_array_length($1 #> '{response,evidence}') > 2
    or jsonb_array_length($1 #> '{response,candidates}') > 5 then return false; end if;
  for v_evidence in select value from jsonb_array_elements($1 #> '{response,evidence}') loop
    if jsonb_typeof(v_evidence) <> 'object' then return false; end if;
    if jsonb_typeof(v_evidence -> 'url') is distinct from 'string' or length(v_evidence ->> 'url') not between 1 and 300
      or jsonb_typeof(v_evidence -> 'title') is distinct from 'string' or length(v_evidence ->> 'title') > 160
      or jsonb_typeof(v_evidence -> 'excerpt') is distinct from 'string' or length(v_evidence ->> 'excerpt') not between 1 and 1200
      then return false; end if;
  end loop;
  if $1 #>> '{response,status}' = 'ready' then
    if jsonb_typeof($1 -> 'exactName') is distinct from 'string'
      or $1 #>> '{response,brand}' is distinct from $1 ->> 'exactName'
      or jsonb_typeof($1 #> '{response,website}') is distinct from 'string'
      or length($1 #>> '{response,website}') not between 1 and 300
      or not exists (
        select 1 from jsonb_array_elements($1 -> 'candidates') c
        where jsonb_typeof(c -> 'source') = 'object'
          and c #>> '{source,url}' = $1 #>> '{response,website}'
          and exists (select 1 from jsonb_array_elements($1 #> '{response,evidence}') e
            where e.value = c -> 'source')
      ) then return false; end if;
  end if;
  return true;
end;
$$;

create table public.pilot_brand_research (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null unique,
  campaign_id uuid not null,
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  query_kind text not null check (query_kind in ('name', 'url')),
  status text not null default 'reserved' check (status in ('reserved', 'reading', 'completed')),
  version integer not null default 0 check (version >= 0),
  payload jsonb,
  search_claimed_at timestamptz,
  read_claims integer not null default 0 check (read_claims between 0 and 2),
  read_candidate_ids uuid[] not null default '{}'::uuid[],
  active_candidate_id uuid,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  foreign key (invite_id, campaign_id) references public.pilot_invites(id, campaign_id) on delete restrict,
  unique (invite_id, request_fingerprint),
  constraint pilot_brand_payload_bound check
    (payload is null or public.valid_pilot_brand_payload(payload, query_kind)),
  constraint pilot_brand_payload_owner check
    (payload is null or lower(payload #>> '{response,researchId}') = id::text),
  constraint pilot_brand_search_order check (search_claimed_at is null or query_kind = 'name'),
  constraint pilot_brand_claim_count check (
    read_claims = cardinality(read_candidate_ids)
    and array_position(read_candidate_ids, null) is null
    and (read_claims < 2 or read_candidate_ids[1] <> read_candidate_ids[2])
  ),
  constraint pilot_brand_state_shape check (
    (status = 'reserved' and payload is null and active_candidate_id is null and read_claims = 0)
    or (status = 'completed' and payload is not null and active_candidate_id is null)
    or (status = 'reading' and payload is not null and active_candidate_id is not null
      and active_candidate_id = read_candidate_ids[read_claims])
  )
);

alter table public.pilot_brand_research enable row level security;
revoke all on table public.pilot_brand_research from public, anon, authenticated, service_role;
-- No policies and no DELETE/TRUNCATE grants. Research and liability are lifetime.
grant select, insert, update on table public.pilot_brand_research to service_role;

create function public.enforce_pilot_brand_research_lifetime()
returns trigger language plpgsql security invoker set search_path = pg_catalog as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Pilot brand research audit rows cannot be deleted' using errcode = '23514';
  end if;
  if new.id is distinct from old.id or new.invite_id is distinct from old.invite_id
    or new.campaign_id is distinct from old.campaign_id
    or new.request_fingerprint is distinct from old.request_fingerprint
    or new.query_kind is distinct from old.query_kind or new.created_at is distinct from old.created_at
    or new.version <> old.version + 1
    or new.read_claims < old.read_claims or new.read_claims > old.read_claims + 1
    or (old.read_claims > 0 and new.read_candidate_ids[1:old.read_claims] is distinct from old.read_candidate_ids)
    or (old.search_claimed_at is not null and new.search_claimed_at is distinct from old.search_claimed_at)
    or (old.payload #>> '{response,status}' = 'ready' and new is distinct from old)
    or (old.query_kind = 'name' and old.payload is not null
      and (new.payload ->> 'exactName') is distinct from (old.payload ->> 'exactName'))
    or not ((old.status = 'reserved' and new.status in ('reserved', 'completed'))
      or (old.status = 'completed' and new.status in ('completed', 'reading'))
      or (old.status = 'reading' and new.status = 'completed')) then
    raise exception 'Pilot research identity, claims, and ready results are immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger enforce_pilot_brand_research_lifetime before update or delete on public.pilot_brand_research
  for each row execute function public.enforce_pilot_brand_research_lifetime();

-- Recovery is read-only, requires exactly one selector, and rechecks the same
-- active invitation gate used by generation. A UUID alone grants no access.
create function public.get_pilot_brand_research(
  token_digest text, research_id uuid default null, request_fingerprint text default null
)
returns jsonb language plpgsql stable security invoker set search_path = pg_catalog as $$
declare
  v_access jsonb;
  v_research public.pilot_brand_research%rowtype;
begin
  if ($2 is null) = ($3 is null) or ($3 is not null and $3 !~ '^[0-9a-f]{64}$') then
    return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'invalid_research');
  end if;
  v_access := public.get_pilot_invite_access($1);
  if coalesce((v_access ->> 'ready')::boolean, false) is not true then
    return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', v_access ->> 'reason');
  end if;
  select r.* into v_research from public.pilot_brand_research r
    where r.invite_id = (v_access ->> 'invite_id')::uuid
      and (($2 is not null and r.id = $2) or ($3 is not null and r.request_fingerprint = $3));
  if not found then
    return jsonb_build_object('allowed', false, 'status', 'not_found', 'reason', null,
      'research_id', null, 'version', null, 'payload', null);
  end if;
  return jsonb_build_object('allowed', false, 'status', v_research.status, 'reason', null,
    'research_id', v_research.id, 'version', v_research.version,
    'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind,
    'payload', v_research.payload);
end;
$$;

create function public.reserve_pilot_brand_research(
  token_digest text, request_fingerprint text, query_kind text
)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare
  v_invite public.pilot_invites%rowtype;
  v_campaign public.pilot_campaigns%rowtype;
  v_research public.pilot_brand_research%rowtype;
begin
  if $1 is null or $1 !~ '^[0-9a-f]{64}$' or $2 is null or $2 !~ '^[0-9a-f]{64}$'
    or $3 is null or $3 not in ('name', 'url') then
    return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'invalid_research');
  end if;
  select i.* into v_invite from public.pilot_invites i where i.token_digest = $1;
  if not found then return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'invite_invalid'); end if;
  -- Always lock campaign -> invite -> research. Never lock a research row first.
  select c.* into v_campaign from public.pilot_campaigns c where c.id = v_invite.campaign_id for update;
  select i.* into v_invite from public.pilot_invites i where i.id = v_invite.id for update;
  if not v_campaign.enabled then return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'pilot_disabled'); end if;
  if v_campaign.expires_at is null or v_campaign.expires_at <= clock_timestamp() then
    return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'pilot_expired');
  end if;
  if v_invite.revoked_at is not null then return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'invite_revoked'); end if;
  if v_invite.expires_at <= clock_timestamp() then return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'invite_expired'); end if;
  select r.* into v_research from public.pilot_brand_research r where r.invite_id = v_invite.id for update;
  if found then
    if v_research.request_fingerprint is distinct from $2 or v_research.query_kind is distinct from $3 then
      return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'research_consumed');
    end if;
    -- Replay is never a dispatch grant, including a still-reserved first attempt.
    return jsonb_build_object('allowed', false, 'ok', true, 'status', v_research.status, 'reason', null,
    'research_id', v_research.id, 'version', v_research.version,
    'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind,
    'payload', v_research.payload);
  end if;
  if v_campaign.brand_researches_reserved + 1 > (case when v_campaign.campaign_kind = 'qa' then 1 else 5 end)
    or v_campaign.brand_searches_reserved + 1 > (case when v_campaign.campaign_kind = 'qa' then 1 else 5 end)
    or v_campaign.brand_reads_reserved + 2 > (case when v_campaign.campaign_kind = 'qa' then 2 else 10 end) then
    return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'campaign_research_exhausted');
  end if;
  -- Reserve the maximum research liability before any provider call. A URL-only
  -- request also holds one search slot; unused or failed slots are not refunded.
  update public.pilot_campaigns c
    set brand_researches_reserved = c.brand_researches_reserved + 1,
        brand_searches_reserved = c.brand_searches_reserved + 1,
        brand_reads_reserved = c.brand_reads_reserved + 2 where c.id = v_campaign.id;
  insert into public.pilot_brand_research(invite_id, campaign_id, request_fingerprint, query_kind)
    values (v_invite.id, v_campaign.id, $2, $3) returning * into v_research;
  return jsonb_build_object('allowed', true, 'ok', true, 'status', v_research.status, 'reason', null,
    'research_id', v_research.id, 'version', v_research.version,
    'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind,
    'payload', v_research.payload);
end;
$$;

create function public.claim_pilot_brand_dispatch(
  token_digest text, research_id uuid, expected_version integer, dispatch_kind text, candidate_id uuid default null
)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare
  v_invite public.pilot_invites%rowtype;
  v_campaign public.pilot_campaigns%rowtype;
  v_research public.pilot_brand_research%rowtype;
  v_candidate jsonb;
begin
  if $1 is null or $1 !~ '^[0-9a-f]{64}$' or $2 is null or $3 is null or $3 < 0
    or $4 is null or $4 not in ('search', 'read') then
    return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'invalid_dispatch');
  end if;
  select i.* into v_invite from public.pilot_invites i where i.token_digest = $1;
  if not found then return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'invite_invalid'); end if;
  -- Always lock campaign -> invite -> research. Never lock a research row first.
  select c.* into v_campaign from public.pilot_campaigns c where c.id = v_invite.campaign_id for update;
  select i.* into v_invite from public.pilot_invites i where i.id = v_invite.id for update;
  if not v_campaign.enabled then return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'pilot_disabled'); end if;
  if v_campaign.expires_at is null or v_campaign.expires_at <= clock_timestamp() then
    return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'pilot_expired');
  end if;
  if v_invite.revoked_at is not null then return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'invite_revoked'); end if;
  if v_invite.expires_at <= clock_timestamp() then return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'invite_expired'); end if;
  select r.* into v_research from public.pilot_brand_research r
    where r.id = $2 and r.invite_id = v_invite.id for update;
  if not found then return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'research_invalid'); end if;
  if v_research.version <> $3 then
    return jsonb_build_object('allowed', false, 'ok', false, 'status', v_research.status, 'reason', 'version_conflict',
    'research_id', v_research.id, 'version', v_research.version,
    'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind,
    'payload', v_research.payload);
  end if;
  if $4 = 'search' then
    if $5 is not null or v_research.query_kind <> 'name' or v_research.status <> 'reserved'
      or v_research.search_claimed_at is not null then
      return jsonb_build_object('allowed', false, 'ok', false, 'status', v_research.status, 'reason', 'dispatch_already_claimed',
    'research_id', v_research.id, 'version', v_research.version,
    'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind,
    'payload', v_research.payload);
    end if;
    -- This acknowledged write-ahead CAS permits exactly ONE search dispatch.
    -- A lost acknowledgement is consumed, not a lease and not retry permission.
    update public.pilot_brand_research r
      set search_claimed_at = clock_timestamp(), version = r.version + 1, updated_at = clock_timestamp()
      where r.id = $2 and r.invite_id = v_invite.id and r.version = $3
        and r.status = 'reserved' and r.search_claimed_at is null and r.query_kind = 'name'
      returning r.* into v_research;
  else
    if $5 is null or v_research.status <> 'completed'
      or v_research.payload #>> '{response,status}' = 'ready' or v_research.read_claims >= 2
      or $5 = any(v_research.read_candidate_ids) then
      return jsonb_build_object('allowed', false, 'ok', false, 'status', v_research.status, 'reason', 'dispatch_already_claimed',
    'research_id', v_research.id, 'version', v_research.version,
    'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind,
    'payload', v_research.payload);
    end if;
    -- The edge may read only this stored candidate's URL, never a client URL.
    select value into v_candidate from jsonb_array_elements(v_research.payload -> 'candidates')
      where (value ->> 'id')::uuid = $5;
    if not found or jsonb_typeof(v_candidate -> 'source') is distinct from 'null' then
      return jsonb_build_object('allowed', false, 'ok', false, 'status', v_research.status, 'reason', 'candidate_unavailable',
    'research_id', v_research.id, 'version', v_research.version,
    'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind,
    'payload', v_research.payload);
    end if;
    update public.pilot_brand_research r
      set status = 'reading', active_candidate_id = $5,
          read_claims = r.read_claims + 1, read_candidate_ids = array_append(r.read_candidate_ids, $5),
          version = r.version + 1, updated_at = clock_timestamp()
      where r.id = $2 and r.invite_id = v_invite.id and r.version = $3
        and r.status = 'completed' and r.read_claims < 2 and not ($5 = any(r.read_candidate_ids))
      returning r.* into v_research;
  end if;
  if not found then
    return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'dispatch_already_claimed');
  end if;
  return jsonb_build_object('allowed', true, 'ok', true, 'status', v_research.status, 'reason', null,
    'research_id', v_research.id, 'version', v_research.version,
    'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind,
    'payload', v_research.payload);
end;
$$;

create function public.save_pilot_brand_research(
  token_digest text, research_id uuid, expected_version integer, payload jsonb
)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare
  v_invite public.pilot_invites%rowtype;
  v_campaign public.pilot_campaigns%rowtype;
  v_research public.pilot_brand_research%rowtype;
  v_candidate jsonb;
  v_previous jsonb;
begin
  if $1 is null or $1 !~ '^[0-9a-f]{64}$' or $2 is null or $3 is null or $3 < 0 then
    return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'invalid_research');
  end if;
  select i.* into v_invite from public.pilot_invites i where i.token_digest = $1;
  if not found then return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'invite_invalid'); end if;
  -- Always lock campaign -> invite -> research. Never lock a research row first.
  select c.* into v_campaign from public.pilot_campaigns c where c.id = v_invite.campaign_id for update;
  select i.* into v_invite from public.pilot_invites i where i.id = v_invite.id for update;
  if not v_campaign.enabled then return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'pilot_disabled'); end if;
  if v_campaign.expires_at is null or v_campaign.expires_at <= clock_timestamp() then
    return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'pilot_expired');
  end if;
  if v_invite.revoked_at is not null then return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'invite_revoked'); end if;
  if v_invite.expires_at <= clock_timestamp() then return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'invite_expired'); end if;
  select r.* into v_research from public.pilot_brand_research r
    where r.id = $2 and r.invite_id = v_invite.id for update;
  if not found then return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'research_invalid'); end if;
  if not public.valid_pilot_brand_payload($4, v_research.query_kind)
    or lower($4 #>> '{response,researchId}') is distinct from v_research.id::text then
    return jsonb_build_object('allowed', false, 'ok', false, 'status', v_research.status, 'reason', 'invalid_payload',
    'research_id', v_research.id, 'version', v_research.version,
    'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind,
    'payload', v_research.payload);
  end if;
  if v_research.payload #>> '{response,status}' = 'ready' then
    if v_research.payload is not distinct from $4 and v_research.status = 'completed' then
      -- An identical ready replay is an acknowledgement, not a state mutation.
      return jsonb_build_object('allowed', false, 'ok', true, 'status', v_research.status, 'reason', null,
    'research_id', v_research.id, 'version', v_research.version,
    'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind,
    'payload', v_research.payload);
    end if;
    return jsonb_build_object('allowed', false, 'ok', false, 'status', v_research.status, 'reason', 'research_terminal',
    'research_id', v_research.id, 'version', v_research.version,
    'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind,
    'payload', v_research.payload);
  end if;
  if v_research.version <> $3 then
    return jsonb_build_object('allowed', false, 'ok', false, 'status', v_research.status, 'reason', 'version_conflict',
    'research_id', v_research.id, 'version', v_research.version,
    'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind,
    'payload', v_research.payload);
  end if;
  if v_research.payload is not null then
    if v_research.query_kind = 'name' and ($4 ->> 'exactName') is distinct from (v_research.payload ->> 'exactName') then
      return jsonb_build_object('allowed', false, 'ok', false, 'status', v_research.status, 'reason', 'name_conflict',
        'research_id', v_research.id, 'version', v_research.version,
        'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind,
        'payload', v_research.payload);
    end if;
    -- Freeze the cached search/direct-URL candidate identity after first save.
    -- Only a claimed active candidate can gain a source; cached evidence cannot
    -- be replaced during a free clarification or under a reused candidate ID.
    if jsonb_array_length($4 -> 'candidates') <> jsonb_array_length(v_research.payload -> 'candidates') then
      return jsonb_build_object('allowed', false, 'ok', false, 'status', v_research.status, 'reason', 'candidate_conflict',
    'research_id', v_research.id, 'version', v_research.version,
    'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind,
    'payload', v_research.payload);
    end if;
    for v_candidate in select value from jsonb_array_elements($4 -> 'candidates') loop
      select value into v_previous from jsonb_array_elements(v_research.payload -> 'candidates')
        where (value ->> 'id')::uuid = (v_candidate ->> 'id')::uuid;
      if not found or (v_previous - 'source') is distinct from (v_candidate - 'source') then
        return jsonb_build_object('allowed', false, 'ok', false, 'status', v_research.status, 'reason', 'candidate_conflict',
    'research_id', v_research.id, 'version', v_research.version,
    'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind,
    'payload', v_research.payload);
      end if;
      if (v_previous -> 'source') is distinct from (v_candidate -> 'source') and (
        v_research.status <> 'reading'
        or (v_candidate ->> 'id')::uuid is distinct from v_research.active_candidate_id
        or jsonb_typeof(v_previous -> 'source') is distinct from 'null'
      ) then
        return jsonb_build_object('allowed', false, 'ok', false, 'status', v_research.status, 'reason', 'source_conflict',
    'research_id', v_research.id, 'version', v_research.version,
    'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind,
    'payload', v_research.payload);
      end if;
    end loop;
  elsif exists (select 1 from jsonb_array_elements($4 -> 'candidates') c where jsonb_typeof(c -> 'source') <> 'null') then
    -- Initial candidate storage cannot smuggle already-read sources around CAS.
    return jsonb_build_object('allowed', false, 'ok', false, 'status', v_research.status, 'reason', 'source_without_claim',
    'research_id', v_research.id, 'version', v_research.version,
    'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind,
    'payload', v_research.payload);
  end if;
  update public.pilot_brand_research r
    set status = 'completed', payload = $4, active_candidate_id = null,
        version = r.version + 1, updated_at = clock_timestamp()
    where r.id = $2 and r.invite_id = v_invite.id and r.version = $3
    returning r.* into v_research;
  if not found then
    return jsonb_build_object('allowed', false, 'ok', false, 'status', 'denied', 'reason', 'version_conflict');
  end if;
  return jsonb_build_object('allowed', false, 'ok', true, 'status', v_research.status, 'reason', null,
    'research_id', v_research.id, 'version', v_research.version,
    'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind,
    'payload', v_research.payload);
end;
$$;

-- All existing generation authentication/claim/finish RPC grants remain intact.
-- These research routines and their payload/trigger helpers are server-only.
revoke all on function public.valid_pilot_brand_payload(jsonb, text) from public, anon, authenticated;
revoke all on function public.enforce_pilot_brand_research_lifetime() from public, anon, authenticated;
revoke all on function public.get_pilot_brand_research(text, uuid, text) from public, anon, authenticated;
revoke all on function public.reserve_pilot_brand_research(text, text, text) from public, anon, authenticated;
revoke all on function public.claim_pilot_brand_dispatch(text, uuid, integer, text, uuid) from public, anon, authenticated;
revoke all on function public.save_pilot_brand_research(text, uuid, integer, jsonb) from public, anon, authenticated;
grant execute on function public.valid_pilot_brand_payload(jsonb, text) to service_role;
grant execute on function public.enforce_pilot_brand_research_lifetime() to service_role;
grant execute on function public.get_pilot_brand_research(text, uuid, text) to service_role;
grant execute on function public.reserve_pilot_brand_research(text, text, text) to service_role;
grant execute on function public.claim_pilot_brand_dispatch(text, uuid, integer, text, uuid) to service_role;
grant execute on function public.save_pilot_brand_research(text, uuid, integer, jsonb) to service_role;

-- BEGIN scoped pilot effective-ACL guard
-- Apply BOTH ordered source migrations in one transaction; this guard must pass
-- before commit. Public schema defaults may grant sandbox_exec SELECT/INSERT,
-- and its BYPASSRLS means RLS alone cannot protect these newly created tables.
-- Repair only that role's grants on the four NEW pilot tables and, if present,
-- the exact fourteen NEW pilot routines below. Never touch brick_concepts,
-- global/default privileges, role memberships, or any other existing object.
-- Owners, actual superusers and built-in pg_* administrative roles retain their
-- inherent cluster authority. Any other unexpected effective recipient aborts
-- the transaction instead of broadening the repair's scope to make it pass.
do $pilot_acl$
declare
  v_tables oid[] := array[
    'public.pilot_campaigns'::regclass::oid,
    'public.pilot_invites'::regclass::oid,
    'public.pilot_operations'::regclass::oid,
    'public.pilot_brand_research'::regclass::oid
  ];
  v_functions oid[] := array[
    'public.enforce_pilot_invite_lifetime()'::regprocedure::oid,
    'public.enforce_pilot_campaign_lifetime()'::regprocedure::oid,
    'public.enforce_pilot_operation_lifetime()'::regprocedure::oid,
    'public.get_pilot_invite_access(text)'::regprocedure::oid,
    'public.get_pilot_operation(text,text)'::regprocedure::oid,
    'public.reserve_pilot_operation(text,text,text,text,text,uuid,uuid,uuid)'::regprocedure::oid,
    'public.claim_pilot_dispatch(uuid,text)'::regprocedure::oid,
    'public.finish_pilot_operation(uuid,uuid,text,jsonb)'::regprocedure::oid,
    'public.valid_pilot_brand_payload(jsonb,text)'::regprocedure::oid,
    'public.enforce_pilot_brand_research_lifetime()'::regprocedure::oid,
    'public.get_pilot_brand_research(text,uuid,text)'::regprocedure::oid,
    'public.reserve_pilot_brand_research(text,text,text)'::regprocedure::oid,
    'public.claim_pilot_brand_dispatch(text,uuid,integer,text,uuid)'::regprocedure::oid,
    'public.save_pilot_brand_research(text,uuid,integer,jsonb)'::regprocedure::oid
  ];
  v_sandbox oid;
  v_service oid;
  v_object oid;
  v_owner oid;
  v_schema text;
  v_name text;
  v_acl aclitem[];
  v_unexpected text;
begin
  select oid into v_sandbox from pg_catalog.pg_roles where rolname = 'sandbox_exec';
  select oid into strict v_service from pg_catalog.pg_roles where rolname = 'service_role';
  foreach v_object in array v_tables loop
    select c.relowner, n.nspname, c.relname into strict v_owner, v_schema, v_name
      from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where c.oid = v_object and c.relkind = 'r' and c.relrowsecurity;
    if v_sandbox is not null then
      execute pg_catalog.format('REVOKE ALL ON TABLE %I.%I FROM sandbox_exec', v_schema, v_name);
    end if;
    select c.relacl into v_acl from pg_catalog.pg_class c where c.oid = v_object;
    if exists (
      select 1 from pg_catalog.aclexplode(coalesce(v_acl, pg_catalog.acldefault('r', v_owner))) a
      where a.grantee not in (v_owner, v_service)
        or (a.grantee = v_service and (a.is_grantable or a.privilege_type not in ('SELECT', 'INSERT', 'UPDATE')))
    ) or exists (
      select 1 from pg_catalog.pg_attribute c
        cross join lateral pg_catalog.aclexplode(c.attacl) a
      where c.attrelid = v_object and c.attnum > 0 and not c.attisdropped
        and (a.grantee not in (v_owner, v_service)
          or (a.grantee = v_service and (a.is_grantable or a.privilege_type not in ('SELECT', 'INSERT', 'UPDATE'))))
    ) then
      raise exception 'Unexpected direct or column ACL on pilot table %', v_object::regclass using errcode = '42501';
    end if;
    if not (pg_catalog.has_table_privilege(v_service, v_object, 'SELECT')
      and pg_catalog.has_table_privilege(v_service, v_object, 'INSERT')
      and pg_catalog.has_table_privilege(v_service, v_object, 'UPDATE')) then
      raise exception 'Missing service-only pilot table privileges on %', v_object::regclass using errcode = '42501';
    end if;
    if exists (
      select 1 from pg_catalog.aclexplode(pg_catalog.acldefault('r', v_owner)) a
      where (a.privilege_type not in ('SELECT', 'INSERT', 'UPDATE')
          and pg_catalog.has_table_privilege(v_service, v_object, a.privilege_type))
        or pg_catalog.has_table_privilege(v_service, v_object, a.privilege_type || ' WITH GRANT OPTION')
    ) or exists (
      select 1 from pg_catalog.unnest(array['SELECT', 'INSERT', 'UPDATE', 'REFERENCES']) as p(privilege_type)
      where (p.privilege_type = 'REFERENCES'
          and pg_catalog.has_any_column_privilege(v_service, v_object, p.privilege_type))
        or pg_catalog.has_any_column_privilege(v_service, v_object, p.privilege_type || ' WITH GRANT OPTION')
    ) then
      raise exception 'Unexpected effective service-role pilot table privileges on %', v_object::regclass using errcode = '42501';
    end if;
    -- Enumerating acldefault privilege names includes version-specific rights
    -- such as MAINTAIN without assuming a particular PostgreSQL major version.
    select r.rolname into v_unexpected from pg_catalog.pg_roles r
      where r.oid not in (v_owner, v_service) and not r.rolsuper and r.rolname !~ '^pg_'
        and (exists (
          select 1 from pg_catalog.aclexplode(pg_catalog.acldefault('r', v_owner)) a
          where pg_catalog.has_table_privilege(r.oid, v_object, a.privilege_type)
        ) or pg_catalog.has_any_column_privilege(r.oid, v_object, 'SELECT,INSERT,UPDATE,REFERENCES'))
      order by r.rolname limit 1;
    if v_unexpected is not null then
      raise exception 'Unexpected effective pilot table access for role % on %', v_unexpected, v_object::regclass using errcode = '42501';
    end if;
  end loop;

  foreach v_object in array v_functions loop
    select p.proowner, n.nspname, p.proname, p.proacl into strict v_owner, v_schema, v_name, v_acl
      from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      where p.oid = v_object and p.prokind = 'f';
    -- The observed defaults do not grant sandbox_exec function access. Revoke
    -- only if an actual grant on one of these exact NEW routines is implicated.
    if v_sandbox is not null and exists (
      select 1 from pg_catalog.aclexplode(coalesce(v_acl, pg_catalog.acldefault('f', v_owner))) a
      where a.grantee = v_sandbox
    ) then
      execute pg_catalog.format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM sandbox_exec',
        v_schema, v_name, pg_catalog.pg_get_function_identity_arguments(v_object));
    end if;
    select p.proacl into v_acl from pg_catalog.pg_proc p where p.oid = v_object;
    if exists (
      select 1 from pg_catalog.aclexplode(coalesce(v_acl, pg_catalog.acldefault('f', v_owner))) a
      where a.grantee not in (v_owner, v_service)
        or (a.grantee = v_service and (a.is_grantable or a.privilege_type <> 'EXECUTE'))
    ) or not pg_catalog.has_function_privilege(v_service, v_object, 'EXECUTE')
      or pg_catalog.has_function_privilege(v_service, v_object, 'EXECUTE WITH GRANT OPTION') then
      raise exception 'Unexpected direct ACL on pilot routine %', v_object::regprocedure using errcode = '42501';
    end if;
    select r.rolname into v_unexpected from pg_catalog.pg_roles r
      where r.oid not in (v_owner, v_service) and not r.rolsuper and r.rolname !~ '^pg_'
        and pg_catalog.has_function_privilege(r.oid, v_object, 'EXECUTE')
      order by r.rolname limit 1;
    if v_unexpected is not null then
      raise exception 'Unexpected effective pilot routine access for role % on %', v_unexpected, v_object::regprocedure using errcode = '42501';
    end if;
  end loop;
end;
$pilot_acl$;
-- END scoped pilot effective-ACL guard
