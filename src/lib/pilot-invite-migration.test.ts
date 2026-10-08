import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Source-policy regression checks only. These do not apply the migration or claim
// to replace Postgres concurrency/RLS acceptance tests in an authorized rollout.
const migration = readFileSync('supabase/migrations/20261008070000_pilot_invite_budget.sql', 'utf8');
const sql = migration.replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').toLowerCase();
const functionBody = (name: string) => {
  const start = sql.indexOf(`create function public.${name}(`);
  expect(start).toBeGreaterThan(-1);
  const end = sql.indexOf('$$;', start);
  expect(end).toBeGreaterThan(start);
  return sql.slice(start, end);
};
const rpcNames = ['get_pilot_invite_access', 'get_pilot_operation', 'reserve_pilot_operation', 'claim_pilot_dispatch', 'finish_pilot_operation'];

describe('pilot invite SQL source policy (not database execution)', () => {
  it('seeds only a disabled singleton campaign, without issuing any invites', () => {
    expect(sql).toContain('singleton boolean not null default true unique check (singleton)');
    expect(sql).toContain('enabled boolean not null default false');
    expect(sql).toContain('insert into public.pilot_campaigns (enabled) values (false)');
    expect(sql).not.toMatch(/insert into public\.pilot_invites\s*\(/);
    expect(sql).not.toMatch(/enabled\s*=\s*true/);
    expect(sql).toContain('pilot_campaign_activation_expiry check (not enabled or expires_at is not null)');
  });

  it('makes all three ledger tables RLS-enabled and service-only, without delete or truncate grants', () => {
    for (const table of ['pilot_campaigns', 'pilot_invites', 'pilot_operations']) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }
    expect(sql).toContain('revoke all on table public.pilot_campaigns, public.pilot_invites, public.pilot_operations from public, anon, authenticated, service_role');
    expect(sql).toContain('grant select, insert, update on table public.pilot_campaigns, public.pilot_invites, public.pilot_operations to service_role');
    expect(sql).not.toMatch(/create policy|grant (?:all|delete|truncate)/);
  });

  it('uses invoker permissions, fixed search paths, and service-only execute for every RPC', () => {
    expect(sql).not.toContain('security definer');
    for (const name of rpcNames) {
      expect(functionBody(name)).toContain('security invoker set search_path = pg_catalog');
      expect(sql).toMatch(new RegExp(`revoke all on function public\\.${name}\\([^;]+\\) from public, anon, authenticated`));
      expect(sql).toMatch(new RegExp(`grant execute on function public\\.${name}\\([^;]+\\) to service_role`));
    }
  });

  it('stores only unique digest credentials and fixes expiry to 14 days from issuance', () => {
    expect(sql).toContain("token_digest text not null unique check (token_digest ~ '^[0-9a-f]{64}$')");
    expect(sql).not.toMatch(/(?:raw_token|bearer_token|token_plaintext)\s+text/);
    expect(sql).toContain("pilot_invite_lifetime check (expires_at = created_at + interval '336 hours')");
    const trigger = functionBody('enforce_pilot_invite_lifetime');
    expect(trigger).toContain('new.created_at := clock_timestamp()');
    expect(trigger).toContain("new.expires_at := new.created_at + interval '336 hours'");
    expect(trigger).toContain('new.expires_at is distinct from old.expires_at');
    expect(trigger).toContain('old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at');
  });

  it('enforces five lifetime issued seats, including revoked or attempted-deletion seats', () => {
    expect(sql).toContain('seats_issued between 0 and 5');
    const trigger = functionBody('enforce_pilot_invite_lifetime');
    expect(trigger).toContain("if tg_op = 'delete' then raise exception");
    expect(trigger).toContain('where id = new.campaign_id for update');
    expect(trigger).toContain('v_campaign.seats_issued >= 5');
    expect(trigger).toContain('set seats_issued = seats_issued + 1');
    expect(functionBody('enforce_pilot_campaign_lifetime')).toContain('new.seats_issued < old.seats_issued');
  });

  it('bounds every invite and the campaign with conservative full-pipeline liabilities', () => {
    expect(sql).toContain('image_attempts_reserved between 0 and 5');
    expect(sql).toContain('planner_attempts_reserved between 0 and 1');
    expect(sql).toContain('text_dispatches_reserved between 0 and 6');
    expect(sql).toContain('image_attempts_reserved between 0 and 25');
    expect(sql).toContain('text_dispatches_reserved between 0 and 30');
    expect(sql).toContain('text_dispatches_reserved = image_attempts_reserved + planner_attempts_reserved');
    const reserve = functionBody('reserve_pilot_operation');
    expect(reserve).toContain("v_image_cost := case when $4 = 'asset' then 1 else 0 end");
    expect(reserve).toContain("v_planner_cost := case when $4 = 'planner' then 1 else 0 end");
    expect(reserve).toContain('v_invite.image_attempts_reserved + v_image_cost > 5');
    expect(reserve).toContain('v_invite.planner_attempts_reserved + v_planner_cost > 1');
    expect(reserve).toContain('v_campaign.image_attempts_reserved + v_image_cost > 25');
    expect(reserve).toContain('v_campaign.text_dispatches_reserved + 1 > 30');
    expect(reserve).toContain('text_dispatches_reserved = c.text_dispatches_reserved + 1');
    expect(reserve).toContain('text_dispatches_reserved = i.text_dispatches_reserved + 1');
  });

  it('serializes reservation and dispatch using a consistent campaign-before-invite lock order', () => {
    for (const name of ['reserve_pilot_operation', 'claim_pilot_dispatch']) {
      const body = functionBody(name);
      const campaignLock = body.indexOf('select c.* into v_campaign');
      const inviteLock = body.indexOf('select i.* into v_invite', campaignLock);
      expect(campaignLock).toBeGreaterThan(-1);
      expect(inviteLock).toBeGreaterThan(campaignLock);
      expect(body.slice(campaignLock, inviteLock)).toContain('for update');
      expect(body.slice(inviteLock, body.indexOf('if not v_campaign.enabled', inviteLock))).toContain('for update');
    }
    const reserve = functionBody('reserve_pilot_operation');
    expect(reserve.indexOf('for update')).toBeLessThan(reserve.indexOf('update public.pilot_campaigns c'));
    expect(reserve.indexOf('update public.pilot_invites i')).toBeLessThan(reserve.indexOf('insert into public.pilot_operations'));
  });

  it('rechecks the kill switch, campaign expiry, invite expiry, and revocation on access/reserve/dispatch', () => {
    for (const name of ['get_pilot_invite_access', 'reserve_pilot_operation', 'claim_pilot_dispatch']) {
      const body = functionBody(name);
      expect(body).toContain('not v_campaign.enabled');
      expect(body).toContain('v_campaign.expires_at is null or v_campaign.expires_at <=');
      expect(body).toContain('v_invite.revoked_at is not null');
      expect(body).toContain('v_invite.expires_at <=');
    }
    for (const name of ['reserve_pilot_operation', 'claim_pilot_dispatch']) {
      expect(functionBody(name)).toContain('v_invite.expires_at <= clock_timestamp()');
    }
  });

  it('does not mistake exhausted but valid credentials for an invalid invite', () => {
    const access = functionBody('get_pilot_invite_access');
    expect(access).toContain("jsonb_build_object('ready', true");
    expect(access).toContain("'image_attempts', 5 - v_invite.image_attempts_reserved");
    expect(access).toContain("'planner_attempts', 1 - v_invite.planner_attempts_reserved");
    expect(access).not.toMatch(/budget_exhausted|image_attempts_reserved\s*(?:>=|=)\s*5/);
    expect(access).toContain("'expires_at', least(v_invite.expires_at, v_campaign.expires_at)");
  });

  it('exposes bounded blocked status and strictly read-only authenticated recovery', () => {
    const access = functionBody('get_pilot_invite_access');
    expect(access).toContain("'blocked_attempt', exists");
    expect(access).toContain("o.status in ('reserved', 'failed')");
    expect(access).toContain("'blocked_kind'");
    const lookup = functionBody('get_pilot_operation');
    expect(lookup).toContain('public.get_pilot_invite_access($1)');
    expect(lookup).toContain("o.invite_id = (v_access ->> 'invite_id')::uuid and o.request_fingerprint = $2");
    expect(lookup).toContain("'status', 'not_found'");
    expect(lookup).toContain("'response_payload', v_operation.response_payload");
    expect(lookup).not.toMatch(/insert into|update public|delete from|for update|reserve_pilot_operation|claim_pilot_dispatch/);
    expect(lookup).not.toContain("'allowed', true");
  });

  it('deduplicates both request keys and canonical content, never returning a dispatchable duplicate', () => {
    expect(sql).toContain('unique (invite_id, operation_key)');
    expect(sql).toContain('unique (invite_id, request_fingerprint)');
    const reserve = functionBody('reserve_pilot_operation');
    expect(reserve).toContain('v_existing.request_fingerprint <> $3');
    expect(reserve).toContain('v_existing.operation_kind is distinct from $4');
    expect(reserve).toContain('v_existing.previous_asset_id is distinct from $8');
    const duplicate = reserve.slice(reserve.indexOf('select o.* into v_existing', reserve.indexOf('idempotency_conflict')),
      reserve.indexOf("if ($4 = 'planner'"));
    expect(duplicate).toContain("jsonb_build_object('allowed', false");
    expect(duplicate).toContain("when v_existing.status = 'reserved' then 'in_progress'");
    expect(duplicate).toContain("when v_existing.status = 'failed' then 'attempt_consumed'");
    expect(duplicate).not.toContain("'allowed', true");
  });

  it('allows only one initial attempt per stage, one narrow revision, and one planner attempt', () => {
    expect(sql).toContain('create unique index pilot_one_initial_stage on public.pilot_operations(invite_id, stage)');
    expect(sql).toContain("where operation_kind = 'asset' and previous_asset_id is null");
    expect(sql).toContain('create unique index pilot_one_revision on public.pilot_operations(invite_id)');
    expect(sql).toContain("where operation_kind = 'asset' and previous_asset_id is not null");
    expect(sql).toContain('create unique index pilot_one_planner on public.pilot_operations(invite_id)');
    const reserve = functionBody('reserve_pilot_operation');
    expect(reserve).toContain("o.stage = $5 and o.stage in ('details', 'packaging')");
    expect(reserve).toContain("o.previous_asset_id is null and o.status = 'completed') <> 4");
    expect(reserve).toContain("'reason', 'baseline_incomplete'");
  });

  it('requires completed, same-invite owned world and physical sources and matching revision ancestors', () => {
    const reserve = functionBody('reserve_pilot_operation');
    expect(reserve.match(/join public\.brick_concepts b on b\.id = o\.result_id/g)).toHaveLength(4);
    expect(reserve.match(/b\.pilot_invite_id = v_invite\.id/g)).toHaveLength(4);
    expect(reserve).toContain("o.stage = 'world' and o.previous_asset_id is null and o.status = 'completed' and o.result_id = $6");
    expect(reserve).toContain("o.stage = 'physical' and o.previous_asset_id is null and o.status = 'completed' and o.result_id = $7 and o.source_world_id = $6");
    expect(reserve).toContain('o.source_world_id = $6 and o.source_physical_id = $7');
  });

  it('claims each provider dispatch once with an irreversible write-ahead CAS', () => {
    const claim = functionBody('claim_pilot_dispatch');
    expect(claim).toContain("o.status = 'reserved' and o.text_dispatched_at is null returning o.id");
    expect(claim).toContain("o.status = 'reserved' and o.image_dispatched_at is null and o.text_dispatched_at is not null");
    expect(claim).toContain("v_operation.operation_kind <> 'asset' or v_operation.text_dispatched_at is null");
    expect(claim).toContain("'reason', 'dispatch_already_claimed'");
    const immutable = functionBody('enforce_pilot_operation_lifetime');
    expect(immutable).toContain('old.text_dispatched_at is not null and new.text_dispatched_at is distinct from old.text_dispatched_at');
    expect(immutable).toContain('old.image_dispatched_at is not null and new.image_dispatched_at is distinct from old.image_dispatched_at');
    expect(immutable).toContain("old.status <> 'reserved' and new is distinct from old");
  });

  it('finishes atomically and forbids result replacement, cross-invite results, and refunds', () => {
    const finish = functionBody('finish_pilot_operation');
    expect(finish).toContain('where o.id = $1 for update');
    expect(finish).toContain("if v_operation.status <> 'reserved'");
    expect(finish).toContain('v_operation.result_id is not distinct from $2');
    expect(finish).toContain('b.id = $2 and b.pilot_invite_id = v_operation.invite_id');
    expect(finish).toContain("'reason', 'result_already_used'");
    expect(sql).toContain('create unique index pilot_one_result_owner on public.pilot_operations(result_id)');
    expect(finish).not.toMatch(/update public\.pilot_(?:campaigns|invites)|dispatched_at\s*=|reserved\s*=|delete from/);
    expect(functionBody('enforce_pilot_invite_lifetime')).toContain('new.image_attempts_reserved < old.image_attempts_reserved');
    expect(functionBody('enforce_pilot_campaign_lifetime')).toContain('new.text_dispatches_reserved < old.text_dispatches_reserved');
  });

  it('persists only bounded planner responses and replays identical terminal payloads without redispatch', () => {
    expect(sql).toContain('response_payload jsonb');
    expect(sql).toContain('octet_length(response_payload::text) <= 48000');
    expect(sql).toContain("case when jsonb_typeof(response_payload) = 'object' then");
    expect(sql).toContain("response_payload - 'plan' - 'clarification' = '{}'::jsonb");
    expect(sql).toContain("operation_kind = 'asset' and result_id is not null and response_payload is null");
    expect(sql).toContain("operation_kind = 'planner' and result_id is null and response_payload is not null");
    const finish = functionBody('finish_pilot_operation');
    expect(finish).toContain('response_payload jsonb default null');
    expect(finish).toContain('v_operation.response_payload is not distinct from $4');
    expect(finish).toContain("'reason', 'invalid_response_payload'");
    expect(finish.indexOf("if jsonb_typeof($4) <> 'object'")).toBeLessThan(finish.indexOf("if $4 - 'plan' - 'clarification'"));
    expect(finish).toContain('response_payload = $4');
    expect(functionBody('reserve_pilot_operation')).toContain("'response_payload', v_existing.response_payload");
    expect(sql).toContain('revoke all on function public.finish_pilot_operation(uuid, uuid, text, jsonb) from public, anon, authenticated');
  });

  it('preserves old UUID restoration by adding nullable ownership without changing old permissions or storage', () => {
    expect(sql).toContain('alter table public.brick_concepts add column pilot_invite_id uuid references public.pilot_invites(id) on delete restrict');
    expect(sql).not.toMatch(/pilot_invite_id uuid not null|update public\.brick_concepts|delete from public\.brick_concepts/);
    expect(sql).not.toMatch(/grant[^;]*brick_concepts|storage\.buckets|storage\.objects|reserve_brick_generation/);
  });
});


it('supports only an explicit local psql path without inheriting PATH or credentials',()=>{
  const harness=readFileSync('tests/pilot-db-verify.py','utf8');
  expect(harness).toContain('parser.add_argument("--psql"');expect(harness).toContain('selected.is_absolute() and selected.name == "psql" and selected.is_file()');expect(harness).toContain('os.access(selected, os.X_OK)');
  expect(harness).toContain('shutil.which("psql", path=os.defpath)');expect(harness).toContain('"PATH": os.defpath');expect(harness).toContain('"PGPASSFILE": os.devnull');expect(harness).toContain('"PGSERVICEFILE": os.devnull');expect(harness).not.toContain('os.environ.get("PATH")');
});
