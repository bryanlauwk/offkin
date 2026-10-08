-- SOURCE ONLY: applying this migration, activating the campaign, and issuing bearer
-- tokens each require a separate authorized rollout. Nothing here enables generation.
-- The only token stored is a server-computed SHA-256/HMAC digest, never the bearer.
-- Reservations charge the full possible provider liability before any dispatch.
-- Failed, interrupted, uncertain, and abandoned attempts are NEVER refunded/retried.

create table public.pilot_campaigns (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  enabled boolean not null default false,
  -- Set an explicit campaign hard stop before any separately authorized activation.
  expires_at timestamptz,
  constraint pilot_campaign_activation_expiry check (not enabled or expires_at is not null),
  created_at timestamptz not null default now(),
  seats_issued integer not null default 0 check (seats_issued between 0 and 5),
  image_attempts_reserved integer not null default 0 check (image_attempts_reserved between 0 and 25),
  text_dispatches_reserved integer not null default 0 check (text_dispatches_reserved between 0 and 30)
);

create table public.pilot_invites (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.pilot_campaigns(id) on delete restrict,
  token_digest text not null unique check (token_digest ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '336 hours'),
  revoked_at timestamptz,
  image_attempts_reserved integer not null default 0 check (image_attempts_reserved between 0 and 5),
  planner_attempts_reserved integer not null default 0 check (planner_attempts_reserved between 0 and 1),
  text_dispatches_reserved integer not null default 0 check (text_dispatches_reserved between 0 and 6),
  constraint pilot_invite_lifetime check (expires_at = created_at + interval '336 hours'),
  constraint pilot_invite_text_liability check (text_dispatches_reserved = image_attempts_reserved + planner_attempts_reserved),
  unique (id, campaign_id)
);

-- Nullable ownership is deliberate: old UUID capability restores are unchanged.
-- New pilot results must persist their invite owner before finish_pilot_operation.
alter table public.brick_concepts
  add column pilot_invite_id uuid references public.pilot_invites(id) on delete restrict;
create index brick_concepts_pilot_invite_idx on public.brick_concepts(pilot_invite_id)
  where pilot_invite_id is not null;

create table public.pilot_operations (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null,
  campaign_id uuid not null,
  operation_key text not null check (operation_key ~ '^[A-Za-z0-9:_-]{8,128}$'),
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  operation_kind text not null check (operation_kind in ('asset', 'planner')),
  stage text check (stage in ('world', 'physical', 'details', 'packaging')),
  source_world_id uuid references public.brick_concepts(id) on delete restrict,
  source_physical_id uuid references public.brick_concepts(id) on delete restrict,
  previous_asset_id uuid references public.brick_concepts(id) on delete restrict,
  status text not null default 'reserved' check (status in ('reserved', 'completed', 'failed')),
  result_id uuid references public.brick_concepts(id) on delete restrict,
  -- Only the server-validated planner response may be stored for free replay.
  response_payload jsonb,
  failure_code text check (failure_code ~ '^[a-z0-9_]{1,64}$'),
  created_at timestamptz not null default now(),
  text_dispatched_at timestamptz,
  image_dispatched_at timestamptz,
  finished_at timestamptz,
  foreign key (invite_id, campaign_id) references public.pilot_invites(id, campaign_id) on delete restrict,
  unique (invite_id, operation_key),
  unique (invite_id, request_fingerprint),
  constraint pilot_operation_shape check (
    (operation_kind = 'planner' and stage is null and source_world_id is not null
      and source_physical_id is not null and previous_asset_id is null)
    or (operation_kind = 'asset' and stage is not null and (
      (stage = 'world' and source_world_id is null and source_physical_id is null and previous_asset_id is null)
      or (stage = 'physical' and source_world_id is not null and source_physical_id is null and previous_asset_id is null)
      or (stage in ('details', 'packaging') and source_world_id is not null and source_physical_id is not null)
    ))
  ),
  constraint pilot_operation_dispatch_order check (
    image_dispatched_at is null or (operation_kind = 'asset' and text_dispatched_at is not null)
  ),
  constraint pilot_operation_response_bound check (
    response_payload is null or case when jsonb_typeof(response_payload) = 'object' then (
      octet_length(response_payload::text) <= 48000
      and response_payload - 'plan' - 'clarification' = '{}'::jsonb
      and coalesce((jsonb_typeof(response_payload -> 'plan') = 'object'
        or jsonb_typeof(response_payload -> 'clarification') = 'string'), false)
    ) else false end
  ),
  constraint pilot_operation_result_shape check (
    (status = 'reserved' and result_id is null and response_payload is null and failure_code is null and finished_at is null)
    or (status = 'failed' and result_id is null and response_payload is null and failure_code is not null and finished_at is not null)
    or (status = 'completed' and failure_code is null and finished_at is not null and text_dispatched_at is not null
      and ((operation_kind = 'asset' and result_id is not null and response_payload is null and image_dispatched_at is not null)
        or (operation_kind = 'planner' and result_id is null and response_payload is not null and image_dispatched_at is null)))
  )
);

-- These count attempts, regardless of outcome. A new key cannot obtain a retry.
create unique index pilot_one_initial_stage on public.pilot_operations(invite_id, stage)
  where operation_kind = 'asset' and previous_asset_id is null;
create unique index pilot_one_revision on public.pilot_operations(invite_id)
  where operation_kind = 'asset' and previous_asset_id is not null;
create unique index pilot_one_planner on public.pilot_operations(invite_id)
  where operation_kind = 'planner';
create unique index pilot_one_result_owner on public.pilot_operations(result_id)
  where result_id is not null;

alter table public.pilot_campaigns enable row level security;
alter table public.pilot_invites enable row level security;
alter table public.pilot_operations enable row level security;
revoke all on table public.pilot_campaigns, public.pilot_invites, public.pilot_operations from public, anon, authenticated, service_role;
-- No client policies. The service key stays exclusively on the edge server.
-- No DELETE/TRUNCATE grant: revocation never recycles a lifetime seat or budget.
grant select, insert, update on table public.pilot_campaigns, public.pilot_invites, public.pilot_operations to service_role;

create function public.enforce_pilot_invite_lifetime()
returns trigger language plpgsql security invoker set search_path = pg_catalog as $$
declare
  v_campaign public.pilot_campaigns%rowtype;
begin
  if tg_op = 'DELETE' then
    raise exception 'Pilot invite audit rows cannot be deleted' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id or new.campaign_id is distinct from old.campaign_id
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
  if not found or v_campaign.seats_issued >= 5 then
    raise exception 'The five lifetime pilot seats have been issued' using errcode = '23514';
  end if;
  -- Issuance starts the clock, rather than first redemption. Backdating is not needed.
  new.created_at := clock_timestamp();
  new.expires_at := new.created_at + interval '336 hours';
  if new.image_attempts_reserved <> 0 or new.planner_attempts_reserved <> 0 or new.text_dispatches_reserved <> 0 then
    raise exception 'New pilot invite budgets must start unused' using errcode = '23514';
  end if;
  update public.pilot_campaigns set seats_issued = seats_issued + 1 where id = new.campaign_id;
  return new;
end;
$$;
create trigger enforce_pilot_invite_lifetime before insert or update or delete on public.pilot_invites
  for each row execute function public.enforce_pilot_invite_lifetime();
revoke all on function public.enforce_pilot_invite_lifetime() from public, anon, authenticated;
grant execute on function public.enforce_pilot_invite_lifetime() to service_role;

create function public.enforce_pilot_campaign_lifetime()
returns trigger language plpgsql security invoker set search_path = pg_catalog as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'The lifetime pilot campaign cannot be deleted' using errcode = '23514';
  end if;
  if new.id is distinct from old.id or new.created_at is distinct from old.created_at
    or new.singleton is distinct from old.singleton or new.seats_issued < old.seats_issued
    or new.image_attempts_reserved < old.image_attempts_reserved
    or new.text_dispatches_reserved < old.text_dispatches_reserved then
    raise exception 'Pilot campaign identity and spent budget are immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger enforce_pilot_campaign_lifetime before update or delete on public.pilot_campaigns
  for each row execute function public.enforce_pilot_campaign_lifetime();
revoke all on function public.enforce_pilot_campaign_lifetime() from public, anon, authenticated;
grant execute on function public.enforce_pilot_campaign_lifetime() to service_role;

-- Append-only audit semantics also protect against accidental service-side resets.
create function public.enforce_pilot_operation_lifetime()
returns trigger language plpgsql security invoker set search_path = pg_catalog as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Pilot operation audit rows cannot be deleted' using errcode = '23514';
  end if;
  if new.id is distinct from old.id or new.invite_id is distinct from old.invite_id
    or new.campaign_id is distinct from old.campaign_id or new.operation_key is distinct from old.operation_key
    or new.request_fingerprint is distinct from old.request_fingerprint
    or new.operation_kind is distinct from old.operation_kind or new.stage is distinct from old.stage
    or new.source_world_id is distinct from old.source_world_id or new.source_physical_id is distinct from old.source_physical_id
    or new.previous_asset_id is distinct from old.previous_asset_id or new.created_at is distinct from old.created_at
    or (old.text_dispatched_at is not null and new.text_dispatched_at is distinct from old.text_dispatched_at)
    or (old.image_dispatched_at is not null and new.image_dispatched_at is distinct from old.image_dispatched_at)
    or (old.status <> 'reserved' and new is distinct from old) then
    raise exception 'Pilot request identity, claims, and terminal outcomes are immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger enforce_pilot_operation_lifetime before update or delete on public.pilot_operations
  for each row execute function public.enforce_pilot_operation_lifetime();
revoke all on function public.enforce_pilot_operation_lifetime() from public, anon, authenticated;
grant execute on function public.enforce_pilot_operation_lifetime() to service_role;

create function public.get_pilot_invite_access(token_digest text)
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
    'campaign_id', v_campaign.id, 'expires_at', least(v_invite.expires_at, v_campaign.expires_at),
    'blocked_attempt', exists (select 1 from public.pilot_operations o
      where o.invite_id = v_invite.id and o.status in ('reserved', 'failed')),
    'blocked_kind', (select o.operation_kind from public.pilot_operations o
      where o.invite_id = v_invite.id and o.status in ('reserved', 'failed')
      order by o.created_at, o.id limit 1),
    'remaining', jsonb_build_object('image_attempts', 5 - v_invite.image_attempts_reserved,
      'planner_attempts', 1 - v_invite.planner_attempts_reserved,
      'text_dispatches', 6 - v_invite.text_dispatches_reserved,
      'campaign_image_attempts', 25 - v_campaign.image_attempts_reserved,
      'campaign_text_dispatches', 30 - v_campaign.text_dispatches_reserved));
end;
$$;

-- Recovery lookup never reserves or claims budget, even when no matching operation
-- exists. The server may use it without provider credentials or generation flags.
create function public.get_pilot_operation(token_digest text, request_fingerprint text)
returns jsonb language plpgsql stable security invoker set search_path = pg_catalog as $$
declare
  v_access jsonb;
  v_operation public.pilot_operations%rowtype;
begin
  if request_fingerprint is null or request_fingerprint !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', 'invalid_operation');
  end if;
  v_access := public.get_pilot_invite_access($1);
  if coalesce((v_access ->> 'ready')::boolean, false) is not true then
    return jsonb_build_object('allowed', false, 'status', 'denied', 'reason', v_access ->> 'reason');
  end if;
  select o.* into v_operation from public.pilot_operations o
    where o.invite_id = (v_access ->> 'invite_id')::uuid and o.request_fingerprint = $2;
  if not found then
    return jsonb_build_object('allowed', false, 'status', 'not_found', 'reason', null,
      'operation_id', null, 'result_id', null, 'response_payload', null);
  end if;
  return jsonb_build_object('allowed', false,
    'status', case when v_operation.status = 'reserved' then 'in_progress' else v_operation.status end,
    'reason', case when v_operation.status = 'failed' then 'attempt_consumed' else null end,
    'operation_id', v_operation.id, 'result_id', v_operation.result_id,
    'response_payload', v_operation.response_payload, 'invite_id', v_operation.invite_id);
end;
$$;

create function public.reserve_pilot_operation(
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
  if v_campaign.image_attempts_reserved + v_image_cost > 25 or v_campaign.text_dispatches_reserved + 1 > 30 then
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

create function public.claim_pilot_dispatch(operation_id uuid, dispatch_kind text)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare
  v_operation public.pilot_operations%rowtype;
  v_invite public.pilot_invites%rowtype;
  v_campaign public.pilot_campaigns%rowtype;
  v_claimed_id uuid;
begin
  if dispatch_kind is null or dispatch_kind not in ('text', 'image') then
    return jsonb_build_object('allowed', false, 'reason', 'invalid_dispatch');
  end if;
  select o.* into v_operation from public.pilot_operations o where o.id = $1;
  if not found then return jsonb_build_object('allowed', false, 'reason', 'operation_invalid'); end if;
  select c.* into v_campaign from public.pilot_campaigns c where c.id = v_operation.campaign_id for update;
  select i.* into v_invite from public.pilot_invites i where i.id = v_operation.invite_id for update;
  select o.* into v_operation from public.pilot_operations o where o.id = $1 for update;
  if not v_campaign.enabled then return jsonb_build_object('allowed', false, 'reason', 'pilot_disabled'); end if;
  if v_campaign.expires_at is null or v_campaign.expires_at <= clock_timestamp() then
    return jsonb_build_object('allowed', false, 'reason', 'pilot_expired');
  end if;
  if v_invite.revoked_at is not null then return jsonb_build_object('allowed', false, 'reason', 'invite_revoked'); end if;
  if v_invite.expires_at <= clock_timestamp() then return jsonb_build_object('allowed', false, 'reason', 'invite_expired'); end if;
  if v_operation.status <> 'reserved' then return jsonb_build_object('allowed', false, 'reason', 'operation_terminal'); end if;
  if $2 = 'image' and (v_operation.operation_kind <> 'asset' or v_operation.text_dispatched_at is null) then
    return jsonb_build_object('allowed', false, 'reason', 'invalid_dispatch_order');
  end if;
  -- Write-ahead compare-and-set: a lost response consumes the claim permanently.
  -- An acknowledged claim authorizes ONE dispatch only; it is never a retry lease.
  if $2 = 'text' then
    update public.pilot_operations o set text_dispatched_at = clock_timestamp()
      where o.id = $1 and o.status = 'reserved' and o.text_dispatched_at is null returning o.id into v_claimed_id;
  else
    update public.pilot_operations o set image_dispatched_at = clock_timestamp()
      where o.id = $1 and o.status = 'reserved' and o.image_dispatched_at is null
        and o.text_dispatched_at is not null and o.operation_kind = 'asset' returning o.id into v_claimed_id;
  end if;
  if v_claimed_id is null then return jsonb_build_object('allowed', false, 'reason', 'dispatch_already_claimed'); end if;
  return jsonb_build_object('allowed', true, 'reason', null, 'operation_id', v_claimed_id);
end;
$$;

create function public.finish_pilot_operation(
  operation_id uuid, result_id uuid default null, failure_code text default null, response_payload jsonb default null
)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare
  v_operation public.pilot_operations%rowtype;
begin
  select o.* into v_operation from public.pilot_operations o where o.id = $1 for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'operation_invalid'); end if;
  if $3 is not null and ($3 !~ '^[a-z0-9_]{1,64}$' or $2 is not null or $4 is not null) then
    return jsonb_build_object('ok', false, 'reason', 'invalid_completion');
  end if;
  if v_operation.status <> 'reserved' then
    if (v_operation.status = 'completed' and $3 is null and v_operation.result_id is not distinct from $2
      and v_operation.response_payload is not distinct from $4)
      or (v_operation.status = 'failed' and $2 is null and $4 is null and v_operation.failure_code is not distinct from $3) then
      return jsonb_build_object('ok', true, 'status', v_operation.status, 'reason', null, 'result_id', v_operation.result_id,
        'response_payload', v_operation.response_payload);
    end if;
    return jsonb_build_object('ok', false, 'status', v_operation.status, 'reason', 'operation_terminal');
  end if;
  if $3 is null then
    if v_operation.text_dispatched_at is null
      or (v_operation.operation_kind = 'asset' and (v_operation.image_dispatched_at is null or $2 is null or $4 is not null))
      or (v_operation.operation_kind = 'planner' and ($2 is not null or $4 is null)) then
      return jsonb_build_object('ok', false, 'reason', 'invalid_completion');
    end if;
    if $4 is not null then
      -- Check type before JSON object subtraction, which errors for scalar JSON.
      if jsonb_typeof($4) <> 'object' or octet_length($4::text) > 48000 then
        return jsonb_build_object('ok', false, 'reason', 'invalid_response_payload');
      end if;
      if $4 - 'plan' - 'clarification' <> '{}'::jsonb
        or not coalesce((jsonb_typeof($4 -> 'plan') = 'object'
          or jsonb_typeof($4 -> 'clarification') = 'string'), false) then
        return jsonb_build_object('ok', false, 'reason', 'invalid_response_payload');
      end if;
    end if;
    if v_operation.operation_kind = 'asset' and not exists (
      select 1 from public.brick_concepts b where b.id = $2 and b.pilot_invite_id = v_operation.invite_id
    ) then return jsonb_build_object('ok', false, 'reason', 'result_owner_mismatch'); end if;
    if $2 is not null and exists (select 1 from public.pilot_operations o where o.result_id = $2 and o.id <> $1) then
      return jsonb_build_object('ok', false, 'reason', 'result_already_used');
    end if;
  end if;
  -- Finish remains available after shutdown/expiry to record already-paid outcomes.
  -- No budget or dispatch fields are reset, including on failure or uncertainty.
  update public.pilot_operations o set status = case when $3 is null then 'completed' else 'failed' end,
    result_id = $2, failure_code = $3, response_payload = $4, finished_at = clock_timestamp() where o.id = $1;
  return jsonb_build_object('ok', true, 'status', case when $3 is null then 'completed' else 'failed' end,
    'reason', null, 'result_id', $2, 'response_payload', $4);
end;
$$;

revoke all on function public.get_pilot_operation(text, text) from public, anon, authenticated;
revoke all on function public.get_pilot_invite_access(text) from public, anon, authenticated;
revoke all on function public.reserve_pilot_operation(text, text, text, text, text, uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.claim_pilot_dispatch(uuid, text) from public, anon, authenticated;
revoke all on function public.finish_pilot_operation(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.get_pilot_operation(text, text) to service_role;
grant execute on function public.get_pilot_invite_access(text) to service_role;
grant execute on function public.reserve_pilot_operation(text, text, text, text, text, uuid, uuid, uuid) to service_role;
grant execute on function public.claim_pilot_dispatch(uuid, text) to service_role;
grant execute on function public.finish_pilot_operation(uuid, uuid, text, jsonb) to service_role;

-- One campaign, disabled. Intentionally no invite inserts, tokens, or activation.
insert into public.pilot_campaigns (enabled) values (false);
