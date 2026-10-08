import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Static source-policy checks only. No database connection, SQL execution,
// production activation, invite issuance, or provider requests occur here.
// Authorized PostgreSQL execution/concurrency/RLS acceptance remains required.
const normalize = (source: string) => source.replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').toLowerCase();
const base = normalize(readFileSync('supabase/migrations/20261008070000_pilot_invite_budget.sql', 'utf8'));
const sql = normalize(readFileSync('supabase/migrations/20261008133000_pilot_brand_discovery.sql', 'utf8'));
function functionBody(name: string, source = sql) {
  const match = new RegExp(`create (?:or replace )?function public\\.${name}\\(`).exec(source);
  expect(match, name).not.toBeNull();
  const start = match!.index;
  const end = source.indexOf('$$;', start);
  expect(end, name).toBeGreaterThan(start);
  return source.slice(start, end);
}
const researchRpcs = ['get_pilot_brand_research', 'reserve_pilot_brand_research', 'claim_pilot_brand_dispatch', 'save_pilot_brand_research'];
const writes = researchRpcs.slice(1);

describe('brand discovery and QA allocation SQL source policy (not SQL execution)', () => {
  it('uses a new additive source migration and seeds only an unissued disabled QA allocation', () => {
    expect(sql).toContain("add column campaign_kind text not null default 'buyer'");
    expect(sql).toContain('drop constraint pilot_campaigns_singleton_key');
    expect(sql).toContain('unique (campaign_kind)');
    expect(sql).toContain("insert into public.pilot_campaigns (campaign_kind, enabled) values ('qa', false)");
    expect(sql).not.toMatch(/insert into public\.pilot_invites|enabled\s*=\s*true|delete from|truncate |drop table/);
    expect(sql).not.toMatch(/update public\.brick_concepts|storage\.(?:buckets|objects)|create policy|security definer/);
  });

  it('keeps five buyer seats and adds exactly one separately capped QA seat', () => {
    expect(sql).toContain("seats_issued between 0 and case when campaign_kind = 'qa' then 1 else 5 end");
    expect(sql).toContain("image_attempts_reserved between 0 and case when campaign_kind = 'qa' then 5 else 25 end");
    expect(sql).toContain("text_dispatches_reserved between 0 and case when campaign_kind = 'qa' then 6 else 30 end");
    expect(sql).toContain('foreign key (campaign_id, campaign_kind) references public.pilot_campaigns(id, campaign_kind) on delete restrict');
    const invite = functionBody('enforce_pilot_invite_lifetime');
    expect(invite).toContain("v_campaign.seats_issued >= (case when v_campaign.campaign_kind = 'qa' then 1 else 5 end)");
    expect(invite).toContain('new.created_at := clock_timestamp()');
    expect(invite).toContain('new.campaign_kind := v_campaign.campaign_kind');
    expect(invite).toContain("new.expires_at := new.created_at + case when v_campaign.campaign_kind = 'qa' then interval '24 hours' else interval '336 hours' end");
    expect(invite).toContain('new.campaign_kind is distinct from old.campaign_kind');
    expect(invite).toContain('new.expires_at is distinct from old.expires_at');
    expect(invite).toContain('old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at');
    expect(invite).toContain('set seats_issued = seats_issued + 1');
    expect(sql).toContain("expires_at = created_at + case when campaign_kind = 'qa' then interval '24 hours' else interval '336 hours' end");
  });

  it('surgically preserves the generation reservation contract except campaign-specific caps', () => {
    const expected = functionBody('reserve_pilot_operation', base)
      .replace('create function', 'create or replace function')
      .replace('v_campaign.image_attempts_reserved + v_image_cost > 25 or v_campaign.text_dispatches_reserved + 1 > 30',
        "v_campaign.image_attempts_reserved + v_image_cost > (case when v_campaign.campaign_kind = 'qa' then 5 else 25 end) or v_campaign.text_dispatches_reserved + 1 > (case when v_campaign.campaign_kind = 'qa' then 6 else 30 end)");
    expect(functionBody('reserve_pilot_operation')).toBe(expected);
    expect(sql).not.toMatch(/(?:create|replace) function public\.(?:get_pilot_operation|claim_pilot_dispatch|finish_pilot_operation)\(/);
  });

  it('preserves invite access authentication and recovery semantics with accurate QA remaining caps', () => {
    const expected = functionBody('get_pilot_invite_access', base)
      .replace('create function', 'create or replace function')
      .replace("'campaign_id', v_campaign.id,", "'campaign_id', v_campaign.id, 'campaign_kind', v_campaign.campaign_kind,")
      .replace('25 - v_campaign.image_attempts_reserved', "(case when v_campaign.campaign_kind = 'qa' then 5 else 25 end) - v_campaign.image_attempts_reserved")
      .replace('30 - v_campaign.text_dispatches_reserved', "(case when v_campaign.campaign_kind = 'qa' then 6 else 30 end) - v_campaign.text_dispatches_reserved");
    expect(functionBody('get_pilot_invite_access')).toBe(expected);
  });

  it('reserves one lifetime research and the full separate 1-search/2-read liability before dispatch', () => {
    expect(sql).toContain('invite_id uuid not null unique');
    expect(sql).toContain('unique (invite_id, request_fingerprint)');
    expect(sql).toContain("brand_researches_reserved between 0 and case when campaign_kind = 'qa' then 1 else 5 end");
    expect(sql).toContain('brand_searches_reserved = brand_researches_reserved');
    expect(sql).toContain('brand_reads_reserved = 2 * brand_researches_reserved');
    const reserve = functionBody('reserve_pilot_brand_research');
    expect(reserve).toContain('brand_researches_reserved = c.brand_researches_reserved + 1');
    expect(reserve).toContain('brand_searches_reserved = c.brand_searches_reserved + 1');
    expect(reserve).toContain('brand_reads_reserved = c.brand_reads_reserved + 2');
    expect(reserve.indexOf('update public.pilot_campaigns')).toBeLessThan(reserve.indexOf('insert into public.pilot_brand_research'));
    expect(reserve).toContain("v_campaign.brand_reads_reserved + 2 > (case when v_campaign.campaign_kind = 'qa' then 2 else 10 end)");
    expect(reserve).not.toMatch(/(?:image_attempts|text_dispatches)_reserved\s*=/);
    expect(reserve).toContain("'reason', 'research_consumed'");
    const replay = reserve.slice(reserve.indexOf('if found then'), reserve.indexOf('if v_campaign.brand_researches_reserved'));
    expect(replay).toContain("'allowed', false");
    expect(replay).not.toContain("'allowed', true");
  });

  it('uses service-only RLS and execute, without granting deletion, truncation or client access', () => {
    expect(sql).toContain('alter table public.pilot_brand_research enable row level security');
    expect(sql).toContain('revoke all on table public.pilot_brand_research from public, anon, authenticated, service_role');
    expect(sql).toContain('grant select, insert, update on table public.pilot_brand_research to service_role');
    expect(sql).not.toMatch(/grant (?:all|delete|truncate)|create policy/);
    for (const name of [...researchRpcs, 'valid_pilot_brand_payload', 'enforce_pilot_brand_research_lifetime']) {
      expect(functionBody(name)).toContain('security invoker set search_path = pg_catalog');
      expect(sql).toMatch(new RegExp(`revoke all on function public\\.${name}\\([^;]*\\) from public, anon, authenticated`));
      expect(sql).toMatch(new RegExp(`grant execute on function public\\.${name}\\([^;]*\\) to service_role`));
    }
  });

  it('keeps recovery read-only, owned, and authenticated with exactly one selector', () => {
    const get = functionBody('get_pilot_brand_research');
    expect(get).toContain('if ($2 is null) = ($3 is null)');
    expect(get).toContain('public.get_pilot_invite_access($1)');
    expect(get).toContain("r.invite_id = (v_access ->> 'invite_id')::uuid");
    expect(get).toContain('($2 is not null and r.id = $2) or ($3 is not null and r.request_fingerprint = $3)');
    expect(get).toContain("'status', 'not_found'");
    expect(get).not.toContain("'allowed', true");
    expect(get).not.toMatch(/insert into|update public|delete from|for update|reserve_pilot_brand_research|claim_pilot_brand_dispatch/);
  });

  it('rechecks campaign, expiry and revocation under a campaign-before-invite-before-research lock order', () => {
    for (const name of writes) {
      const body = functionBody(name);
      const campaign = body.indexOf('select c.* into v_campaign');
      const invite = body.indexOf('select i.* into v_invite', campaign);
      const research = body.indexOf('select r.* into v_research', invite);
      expect(campaign, name).toBeGreaterThan(-1);
      expect(invite, name).toBeGreaterThan(campaign);
      expect(research, name).toBeGreaterThan(invite);
      expect(body.slice(campaign, invite), name).toContain('for update');
      expect(body.slice(invite, research), name).toContain('for update');
      expect(body.slice(research, body.indexOf(';', research)), name).toContain('for update');
      expect(body, name).toContain('not v_campaign.enabled');
      expect(body, name).toContain('v_campaign.expires_at is null or v_campaign.expires_at <= clock_timestamp()');
      expect(body, name).toContain('v_invite.revoked_at is not null');
      expect(body, name).toContain('v_invite.expires_at <= clock_timestamp()');
    }
  });

  it('CAS-claims one name search and two distinct stored candidates with no retry lease', () => {
    const claim = functionBody('claim_pilot_brand_dispatch');
    expect(claim).toContain('expected_version integer, dispatch_kind text, candidate_id uuid default null');
    expect(claim).toContain('v_research.version <> $3');
    expect(claim).toContain("r.status = 'reserved' and r.search_claimed_at is null and r.query_kind = 'name'");
    expect(claim).toContain('r.id = $2 and r.invite_id = v_invite.id and r.version = $3');
    expect(claim).toContain("v_research.payload #>> '{response,status}' = 'ready'");
    expect(claim).toContain('v_research.read_claims >= 2');
    expect(claim).toContain('$5 = any(v_research.read_candidate_ids)');
    expect(claim).toContain("from jsonb_array_elements(v_research.payload -> 'candidates') where (value ->> 'id')::uuid = $5");
    expect(claim).toContain("jsonb_typeof(v_candidate -> 'source') is distinct from 'null'");
    expect(claim).toContain("set status = 'reading', active_candidate_id = $5");
    expect(claim).toContain('read_candidate_ids = array_append(r.read_candidate_ids, $5)');
    expect(claim).toContain("r.status = 'completed' and r.read_claims < 2 and not ($5 = any(r.read_candidate_ids))");
    expect(claim).not.toMatch(/source_url|interval|lease|retry_after/);
  });

  it('CAS-saves bounded results and freezes candidate URLs and cached sources after first save', () => {
    const save = functionBody('save_pilot_brand_research');
    expect(save).toContain('expected_version integer, payload jsonb');
    expect(save).toContain('public.valid_pilot_brand_payload($4, v_research.query_kind)');
    expect(save).toContain("lower($4 #>> '{response,researchid}') is distinct from v_research.id::text");
    expect(save).toContain('v_research.version <> $3');
    expect(save).toContain("(v_previous - 'source') is distinct from (v_candidate - 'source')");
    expect(save).toContain('(v_candidate ->> \'id\')::uuid is distinct from v_research.active_candidate_id');
    expect(save).toContain("jsonb_typeof(v_previous -> 'source') is distinct from 'null'");
    expect(save).toContain("'reason', 'source_without_claim'");
    expect(save).toContain("set status = 'completed', payload = $4, active_candidate_id = null, version = r.version + 1");
    expect(save).toContain('r.id = $2 and r.invite_id = v_invite.id and r.version = $3');
    expect(save).not.toMatch(/update public\.pilot_(?:campaigns|invites)|read_claims\s*=|search_claimed_at\s*=/);
  });

  it('treats ready as immutable but acknowledges an identical ready payload without a write', () => {
    const save = functionBody('save_pilot_brand_research');
    const ready = save.slice(save.indexOf("if v_research.payload #>> '{response,status}' = 'ready'"), save.indexOf('if v_research.version <> $3'));
    expect(ready).toContain("v_research.payload is not distinct from $4 and v_research.status = 'completed'");
    expect(ready).toContain("'ok', true");
    expect(ready).toContain("'reason', 'research_terminal'");
    expect(ready).not.toContain('update public');
    expect(functionBody('enforce_pilot_brand_research_lifetime')).toContain("old.payload #>> '{response,status}' = 'ready' and new is distinct from old");
  });

  it('checks database payload bounds, query binding, unique candidate IDs and at most two direct evidence excerpts', () => {
    const shape = functionBody('valid_pilot_brand_payload');
    expect(shape).toContain("jsonb_typeof($1) <> 'object' or octet_length($1::text) > 32000");
    expect(shape).toContain("$1 ->> 'version' is distinct from 'offkin-brand-research-v1'");
    expect(shape).toContain("$1 ->> 'querykind' is distinct from $2");
    expect(shape).toContain("jsonb_array_length($1 -> 'candidates') > 5");
    expect(shape).toContain("(v_candidate ->> 'id')::uuid = any(v_candidate_ids)");
    expect(shape).toContain('v_source_count > 2');
    expect(shape).toContain("jsonb_array_length($1 #> '{response,evidence}') > 2");
    expect(shape).toContain("length(v_evidence ->> 'excerpt') not between 1 and 1200");
    expect(shape).toContain("not in ('choose', 'needs-context', 'ready', 'unavailable')");
    expect(sql).toContain('payload is null or public.valid_pilot_brand_payload(payload, query_kind)');
  });

  it('pins typed names and requires ready identity and evidence to match saved direct sources', () => {
    const shape = functionBody('valid_pilot_brand_payload');
    expect(shape).toContain("$2 = 'name' and jsonb_typeof($1 -> 'exactname') is distinct from 'string'");
    expect(shape).toContain("jsonb_typeof($1 -> 'exactname') = 'string' and length($1 ->> 'exactname') not between 1 and 120");
    expect(shape).toContain("jsonb_typeof($1 #> '{response,researchid}') is distinct from 'string'");
    expect(shape).toContain("$1 #>> '{response,brand}' is distinct from $1 ->> 'exactname'");
    expect(shape).toContain("c #>> '{source,url}' = $1 #>> '{response,website}'");
    expect(shape).toContain("from jsonb_array_elements($1 #> '{response,evidence}') e where e.value = c -> 'source'");
    expect(shape).not.toContain('@>');
    const save = functionBody('save_pilot_brand_research');
    expect(save).toContain("v_research.query_kind = 'name' and ($4 ->> 'exactname') is distinct from (v_research.payload ->> 'exactname')");
    expect(save).toContain("'reason', 'name_conflict'");
    expect(sql).toContain("payload is null or lower(payload #>> '{response,researchid}') = id::text");
    expect(functionBody('enforce_pilot_brand_research_lifetime')).toContain("old.query_kind = 'name' and old.payload is not null and (new.payload ->> 'exactname') is distinct from (old.payload ->> 'exactname')");
  });

  it('protects lifetime identity, nonrefundable liabilities, claim history and version progression', () => {
    const lifetime = functionBody('enforce_pilot_brand_research_lifetime');
    expect(lifetime).toContain("if tg_op = 'delete' then raise exception");
    for (const field of ['id', 'invite_id', 'campaign_id', 'request_fingerprint', 'query_kind', 'created_at']) {
      expect(lifetime).toContain(`new.${field} is distinct from old.${field}`);
    }
    expect(lifetime).toContain('new.version <> old.version + 1');
    expect(lifetime).toContain('new.read_claims < old.read_claims');
    expect(lifetime).toContain('new.read_candidate_ids[1:old.read_claims] is distinct from old.read_candidate_ids');
    expect(lifetime).toContain('old.search_claimed_at is not null and new.search_claimed_at is distinct from old.search_claimed_at');
    expect(sql).toContain('read_claims = cardinality(read_candidate_ids)');
    expect(sql).toContain('read_claims < 2 or read_candidate_ids[1] <> read_candidate_ids[2]');
    const campaign = functionBody('enforce_pilot_campaign_lifetime');
    for (const counter of ['seats_issued', 'image_attempts_reserved', 'text_dispatches_reserved', 'brand_researches_reserved', 'brand_searches_reserved', 'brand_reads_reserved']) {
      expect(campaign).toContain(`new.${counter} < old.${counter}`);
    }
    expect(campaign).toContain('new.campaign_kind is distinct from old.campaign_kind');
  });

  it('keeps future disposable buyer fixtures scoped away from QA and requires both migrations', () => {
    const sequential = readFileSync('tests/pilot-db-sequential.sql', 'utf8');
    const harness = readFileSync('tests/pilot-db-verify.py', 'utf8');
    for (const source of [sequential, harness]) {
      expect(source).toContain('20261008070000_pilot_invite_budget.sql');
      expect(source).toContain('20261008133000_pilot_brand_discovery.sql');
      expect(source.replace(/^-- ?/gm, '').replace(/\s+/g, ' ').toLowerCase()).toContain('original-only execution is no longer supported');
      expect(source).toContain("campaign_kind='buyer'");
      expect(source).toContain("campaign_kind='qa'");
    }
    for (const line of sequential.split('\n').filter(line => line.includes('update public.pilot_campaigns set '))) {
      expect(line).toMatch(/where campaign_kind=(?:'buyer'|''buyer'')/);
    }
    expect(sequential).toContain("from public.pilot_campaigns where campaign_kind='buyer' returning id into result");
    expect(harness).toContain('"\\n".join(path.read_text() for path in MIGRATIONS)');
    expect(harness).toContain('hashlib.sha256(path.read_bytes()).hexdigest() for path in MIGRATIONS');
    expect(harness).toContain("n where c.campaign_kind='buyer'; commit;");
    expect(harness).toContain('def assert_qa_unused(self) -> None:');
    expect(harness).toContain('Buyer fixtures touched the separate QA allocation');
    expect(harness).not.toContain('MIGRATION.read_text()');
  });

  it('returns version and identity binding alongside every successful owned RPC result', () => {
    for (const name of researchRpcs) {
      const body = functionBody(name);
      expect(body).toContain("'research_id', v_research.id, 'version', v_research.version");
      expect(body).toContain("'request_fingerprint', v_research.request_fingerprint, 'query_kind', v_research.query_kind");
      expect(body).toContain("'payload', v_research.payload");
    }
  });
});


describe('scoped inherited-default ACL repair source policy (not SQL execution)', () => {
  const guard = sql.slice(sql.indexOf('do $pilot_acl$'));
  it('conditionally revokes only sandbox_exec grants on the exact four newly created pilot tables', () => {
    expect(guard).toContain("select oid into v_sandbox from pg_catalog.pg_roles where rolname = 'sandbox_exec'");
    expect(guard).toContain('if v_sandbox is not null then');
    expect(guard).toContain("format('revoke all on table %i.%i from sandbox_exec', v_schema, v_name)");
    const tables = Array.from(guard.matchAll(/'public\.([a-z_]+)'::regclass::oid/g), match => match[1]);
    expect(tables).toEqual(['pilot_campaigns', 'pilot_invites', 'pilot_operations', 'pilot_brand_research']);
    expect(guard).not.toMatch(/brick_concepts|alter default privileges|alter role|\bgrant\s+(?:select|insert|update|delete|execute|all|usage)\b|revoke .* on schema|nspname\s*=\s*'public'|'public'::regnamespace/);
  });
  it('limits conditional function revocation to the fourteen new pilot routines without adding objects', () => {
    const signatures = Array.from(guard.matchAll(/'public\.([^']+)'::regprocedure::oid/g), match => match[1]);
    expect(signatures).toEqual([
      'enforce_pilot_invite_lifetime()', 'enforce_pilot_campaign_lifetime()', 'enforce_pilot_operation_lifetime()',
      'get_pilot_invite_access(text)', 'get_pilot_operation(text,text)',
      'reserve_pilot_operation(text,text,text,text,text,uuid,uuid,uuid)', 'claim_pilot_dispatch(uuid,text)',
      'finish_pilot_operation(uuid,uuid,text,jsonb)', 'valid_pilot_brand_payload(jsonb,text)',
      'enforce_pilot_brand_research_lifetime()', 'get_pilot_brand_research(text,uuid,text)',
      'reserve_pilot_brand_research(text,text,text)', 'claim_pilot_brand_dispatch(text,uuid,integer,text,uuid)',
      'save_pilot_brand_research(text,uuid,integer,jsonb)',
    ]);
    expect(guard).toContain('if v_sandbox is not null and exists (');
    expect(guard).toContain('where a.grantee = v_sandbox');
    expect(guard).toContain("format('revoke all on function %i.%i(%s) from sandbox_exec'");
    expect(guard).toContain('pg_catalog.pg_get_function_identity_arguments(v_object)');
    expect(guard).not.toMatch(/create (?:function|table|role|trigger)|cascade/);
  });
  it('fails closed on PUBLIC/unintended direct or column ACLs and on grantable service rights', () => {
    expect(guard).toContain("pg_catalog.aclexplode(coalesce(v_acl, pg_catalog.acldefault('r', v_owner)))");
    expect(guard).toContain("pg_catalog.aclexplode(coalesce(v_acl, pg_catalog.acldefault('f', v_owner)))");
    expect(guard).toContain('a.grantee not in (v_owner, v_service)');
    expect(guard).toContain('cross join lateral pg_catalog.aclexplode(c.attacl)');
    expect(guard).toContain("a.is_grantable or a.privilege_type not in ('select', 'insert', 'update')");
    expect(guard).toContain("a.is_grantable or a.privilege_type <> 'execute'");
    expect(guard).toContain("using errcode = '42501'");
    expect(guard).toContain("where c.oid = v_object and c.relkind = 'r' and c.relrowsecurity");
  });
  it('caps service effective privileges too, including inherited grant options and version-specific table rights', () => {
    expect(guard).toContain("a.privilege_type not in ('select', 'insert', 'update') and pg_catalog.has_table_privilege(v_service, v_object, a.privilege_type)");
    expect(guard).toContain("pg_catalog.has_table_privilege(v_service, v_object, a.privilege_type || ' with grant option')");
    expect(guard).toContain("p.privilege_type = 'references' and pg_catalog.has_any_column_privilege(v_service, v_object, p.privilege_type)");
    expect(guard).toContain("pg_catalog.has_any_column_privilege(v_service, v_object, p.privilege_type || ' with grant option')");
    expect(guard).toContain("pg_catalog.has_function_privilege(v_service, v_object, 'execute with grant option')");
    expect(guard).toContain("raise exception 'unexpected effective service-role pilot table privileges");
  });
  it('checks effective table, column and execute rights for all other user-defined roles including inherited grants', () => {
    expect(guard.match(/r\.oid not in \(v_owner, v_service\) and not r\.rolsuper and r\.rolname !~ '\^pg_'/g)).toHaveLength(2);
    expect(guard).toContain("pg_catalog.aclexplode(pg_catalog.acldefault('r', v_owner))");
    expect(guard).toContain('pg_catalog.has_table_privilege(r.oid, v_object, a.privilege_type)');
    expect(guard).toContain("pg_catalog.has_any_column_privilege(r.oid, v_object, 'select,insert,update,references')");
    expect(guard).toContain("pg_catalog.has_function_privilege(r.oid, v_object, 'execute')");
    expect(guard).not.toContain('r.rolcanlogin');
    for (const check of guard.matchAll(/select r\.rolname into v_unexpected[\s\S]*?limit 1;/g)) expect(check[0]).not.toMatch(/sandbox_exec|authenticator|supabase_admin/);
    expect(guard).toContain("raise exception 'unexpected effective pilot table access");
    expect(guard).toContain("raise exception 'unexpected effective pilot routine access");
  });
});


/** Detect the actual failed grammar shape; this is not a PostgreSQL parser. */
function topLevelConditionalCases(source: string): number {
  const plain = source.replace(/--[^\n]*/g, '').replace(/'(?:''|[^'])*'/g, "''");
  const tokens = plain.toLowerCase().match(/[a-z_][a-z_0-9]*|[();]/g) ?? [];
  let count = 0;
  for (let start = 0; start < tokens.length; start++) {
    if (!['if', 'elsif'].includes(tokens[start]) || tokens[start - 1] === 'end') continue;
    let depth = 0;
    for (let i = start + 1; i < tokens.length; i++) {
      if (tokens[i] === '(') depth++;
      else if (tokens[i] === ')') depth--;
      else if (tokens[i] === 'case' && depth === 0) count++;
      else if (depth === 0 && ['then', ';'].includes(tokens[i])) break;
    }
  }
  return count;
}
describe('regression for observed PostgreSQL 42601 conditional CASE failure', () => {
  it('detects the failed seat IF shape and accepts its parenthesized replacement', () => {
    expect(topLevelConditionalCases("if not found or v_campaign.seats_issued >= case when v_campaign.campaign_kind = 'qa' then 1 else 5 end then")).toBe(1);
    expect(topLevelConditionalCases("if not found or v_campaign.seats_issued >= (case when v_campaign.campaign_kind = 'qa' then 1 else 5 end) then")).toBe(0);
  });
  it('checks both complete migrations for analogous bare CASE operands in IF or ELSIF', () => {
    for (const path of ['supabase/migrations/20261008070000_pilot_invite_budget.sql', 'supabase/migrations/20261008133000_pilot_brand_discovery.sql']) {
      expect(topLevelConditionalCases(readFileSync(path, 'utf8')), path).toBe(0);
    }
  });
  it('parenthesizes all six campaign-dependent conditional caps without changing their values', () => {
    const checks = [
      ['enforce_pilot_invite_lifetime', "v_campaign.seats_issued >= (case when v_campaign.campaign_kind = 'qa' then 1 else 5 end)"],
      ['reserve_pilot_operation', "v_campaign.image_attempts_reserved + v_image_cost > (case when v_campaign.campaign_kind = 'qa' then 5 else 25 end)"],
      ['reserve_pilot_operation', "v_campaign.text_dispatches_reserved + 1 > (case when v_campaign.campaign_kind = 'qa' then 6 else 30 end)"],
      ['reserve_pilot_brand_research', "v_campaign.brand_researches_reserved + 1 > (case when v_campaign.campaign_kind = 'qa' then 1 else 5 end)"],
      ['reserve_pilot_brand_research', "v_campaign.brand_searches_reserved + 1 > (case when v_campaign.campaign_kind = 'qa' then 1 else 5 end)"],
      ['reserve_pilot_brand_research', "v_campaign.brand_reads_reserved + 2 > (case when v_campaign.campaign_kind = 'qa' then 2 else 10 end)"],
    ];
    for (const [name, expression] of checks) expect(functionBody(name)).toContain(expression);
  });
});
