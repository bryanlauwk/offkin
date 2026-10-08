# Five-buyer pilot: database verification gate

Status: prepared source only. No migration, isolated database fixture, PostgreSQL role check, lock race, campaign activation, or invite issuance was executed during preparation. The existing Vitest checks inspect SQL source; they are not database evidence. Public generation and the real campaign must remain inactive.

## Scope and required evidence

Before activation, verify the exact revisions of both ordered migrations on a disposable PostgreSQL runtime matching the target Supabase PostgreSQL major version. Record each migration SHA-256, server version, test transcript, actual backend IDs, observed lock contention, and cleanup result. A source review, mocked Supabase client, or sequential RPC loop cannot substitute for this evidence.

Prepared files:

- `supabase/migrations/20261008070000_pilot_invite_budget.sql`: original generation/invitation migration, applied first
- `supabase/migrations/20261008133000_pilot_brand_discovery.sql`: additive brand-discovery and separate QA allocation migration, applied second
- `tests/pilot-db-sequential.sql`: real role and functional assertions within one transaction, followed by rollback
- `tests/pilot-db-verify.py`: isolated local PostgreSQL harness, including eight genuine two-connection contention cases
- `src/lib/pilot-invite-migration.test.ts` and `src/lib/brand-discovery-migration.test.ts`: fast source-policy regression checks only

The current harness requires both migrations. Original-only execution is no longer supported by these fixtures. Its functional and contention cases remain buyer-generation regressions: all campaign mutations and scalar budget reads explicitly select `campaign_kind='buyer'`. The separate QA allocation must remain disabled, unissued and unused throughout. This harness does not yet provide database execution coverage for discovery RPCs, QA issuance/expiry/caps, or discovery contention; those remain separate mandatory acceptance gaps before their activation.

The Python harness uses standard-library Python and the official `psql` client. It makes no HTTP/provider calls and reads no application configuration or application secrets. Synthetic ledger digests have no known corresponding bearer token. Mock asset rows use a nonexistent `never-uploaded/fixture.png` path; no images or storage uploads are created.

## Authorized runtime route

An operator must separately provision and authorize an isolated, disposable PostgreSQL cluster and an empty test database. Do not point this harness at production, a shared staging database, a database clone containing user data, or any existing OFFKIN application database. Preparation of this pack is not approval to create or connect to infrastructure.

Use an existing approved development runtime with PostgreSQL and Python already available, or have an operator provision one through the project's supported development environment. The official PostgreSQL [`psql` documentation](https://www.postgresql.org/docs/current/app-psql.html) describes Unix-socket connections and the no-startup-file/no-password options used here. The official [Supabase local-development guide](https://supabase.com/docs/guides/local-development/cli/getting-started) is the route for a separate local Supabase stack and later full-stack parity testing. The harness deliberately does not accept a Supabase project URL, database URI, remote host, pooler URL, password, service key, or TCP address. A default local Supabase TCP endpoint is therefore not a drop-in harness target; use the approved runtime's local database Unix socket or a separately reviewed adaptation.

Required preconditions, arranged by the operator outside this pack:

1. A dedicated disposable cluster with peer-authenticated local administrator access, using a PostgreSQL major version matching the target.
2. Existing `anon` and `authenticated` roles: NOLOGIN, non-superuser, no BYPASSRLS, and no inherited role memberships. Existing `service_role`: NOLOGIN, non-superuser, BYPASSRLS, no inherited memberships. The harness neither creates nor deletes cluster roles.
3. An empty database named `offkin_pilot_verify_<suffix>` with only an empty `public` application schema. Database comment must be exactly `OFFKIN_PILOT_ISOLATED_DISPOSABLE_V1`. This marker must only ever be attached to a newly created disposable database.
4. An existing absolute local Unix-socket directory. The connecting local administrator must be a superuser so it can perform real SET ROLE checks and observe blocker PIDs. This is a test-only administrative requirement, not an application privilege recommendation.
5. Official `psql` available under the runtime's standard `/bin` or `/usr/bin` executable search path, or an explicitly approved absolute executable passed with `--psql`, and Python 3.10 or later. An ephemeral extracted binary still requires source/package verification; the harness does not download, install or trust one automatically.

No credentials should be pasted into chat, committed to these files, or passed on the command line. The runner clears inherited connection settings, disables password/service-file lookup, uses `psql -X -w`, and fails instead of prompting for a password. Missing prerequisites are a blocker to resolve through the approved environment, not a reason to use production access.

## Execution, only after separate authorization

From the repository root, an authorized operator may run the following with their verified disposable runtime values:

```sh
python3 tests/pilot-db-verify.py \
  --socket /ABSOLUTE/LOCAL/POSTGRES/SOCKET_DIRECTORY \
  --port 5432 \
  --database offkin_pilot_verify_review \
  --user LOCAL_PEER_ADMIN \
  --ack-disposable-cluster
```

If the approved runtime uses an extracted official binary, add `--psql /ABSOLUTE/VERIFIED/PATH/psql`. The default does not search inherited PATH, and CLEAN_ENV remains unchanged.

The placeholders must be replaced; this is not a preconfigured connection command. The runner intentionally refuses DSNs and unknown target identities. It verifies the database marker, empty initial schema, role attributes, and local connection route before creating fixtures. It then builds a minimal private `brick_concepts` prerequisite and applies both exact migrations in order to the disposable database only. The initial committed state must contain two disabled campaign allocations (one buyer and one QA), zero invites, zero operations, zero research rows, and zero consumed budget.

After that fail-closed check, the harness temporarily enables only the disposable buyer fixture campaign and inserts synthetic invite rows. Those are database test fixtures, not bearer tokens or buyer invitations. The sequential fixture rolls back all such rows. Concurrency cases require committed disposable fixture setup so two independent connections can observe the same rows. Between cases and at the end, the runner drops and recreates only the already-verified disposable database's `public` schema. This is destructive to that fixture schema. It never disables audit protections to delete rows in an application database.

## Single-transaction coverage

The SQL fixture must pass every assertion with `ON_ERROR_STOP=1`:

- Combined migrations remain fail closed: separate disabled buyer and QA campaigns, explicit activation expiry requirement, no invite/operation/research rows. Existing buyer-generation tables retain their RLS assertions; discovery RLS execution remains a separate acceptance gap.
- Actual `SET ROLE anon` and `SET ROLE authenticated` reject SELECT, INSERT, UPDATE, DELETE, TRUNCATE, and every generation pilot RPC with SQLSTATE `42501`. A zero-row response is not accepted as an equivalent result.
- Actual `service_role` successfully follows the permitted RPC path while lacking DELETE access.
- The first five lifetime buyer seats work; the sixth buyer seat fails. Revoking an invite does not recycle a seat, remove audit history, or allow reactivation.
- Issuance stamps exactly 336 hours of invite validity. Expiry extension and revocation reversal fail. An owner-only past-timestamp fixture checks access, reserve, and dispatch denial after expiry.
- Campaign-disabled, campaign-expired, and invite-revoked states stop both reservations and dispatch claims. They do not refund previously reserved liability.
- Matching operation/content duplicates return existing state; conflicting payloads under one key fail; changing a client key cannot redispatch the same content. Read-only operation lookup returns `not_found` without allocating any budget, and can return pending, failed, or completed replay state.
- Image dispatch cannot precede text. Unknown provider outcome after a text claim permanently consumes the whole asset reservation and cannot retry the text claim, start a new initial stage, or refund counters.
- The completed lineage is world → physical → details/packaging, owned by the same invite. Cross-invite source IDs, wrong source stages, mismatched revision ancestors, and revisions before the complete baseline fail.
- Only a details or packaging revision is allowed after the full baseline, at most once. World/physical revision attempts fail.
- Each of five invites consumes exactly five asset reservations and one planner reservation: 25 image-pipeline liabilities and 30 text liabilities globally. Constraint assertions also reject 26/31 globally and excessive per-invite values.
- Separate artificial high-water counter fixtures exercise explicit budget-denial branches. These simulate already-consumed liability; they are not represented as real provider work.
- Planner dispatch is text-only. Empty, unexpected-field and oversized replay payloads fail. A bounded saved planner reply is returned by duplicate reservation and the read-only recovery RPC, with no additional claim. A matching finish is idempotent; a changed terminal payload is rejected.
- Owned saved-asset reconciliation rejects foreign owners, recovers an unfinished reservation using an already-saved owned row, prevents terminal result replacement, and allocates no additional budget. Another invite cannot look up that operation.
- Final transaction rollback restores zero invites, operations, and budget. The Python runner independently reads those post-rollback values and checks that QA stays disabled, unissued and unused.

The expiry test temporarily disables only the invite-lifetime trigger, as the isolated fixture owner, to model fourteen days of elapsed time without waiting fourteen days. It re-enables the trigger before calling the service RPCs and rolls back the entire test. This is explicitly not an application-supported expiry mutation or a production remediation procedure.

## Actual two-connection concurrency

Each race uses two persistent `psql` processes with distinct `pg_backend_pid()` values. Connection A holds an uncommitted mutation. Connection B attempts the conflicting operation. The coordinator requires an observed lock wait for B and requires `pg_blocking_pids(B)` to name A before releasing A. Without that evidence the race fails; two sequential successful calls are never reported as concurrency coverage. The observation method follows PostgreSQL's [activity and lock-wait documentation](https://www.postgresql.org/docs/current/monitoring-stats.html).

Eight cases are implemented:

1. Same invite, key, and fingerprint: one reservation and one `in_progress` response; one set of liabilities.
2. Same key, changed fingerprint: one reservation and one `idempotency_conflict`; no extra budget.
3. Different keys/content for the same initial stage: one reservation and one `stage_consumed` denial.
4. A reservation rolled back while another waits: B can reserve afterward; only B's ledger/budget remains.
5. Two text-claim attempts on one operation: exactly one succeeds.
6. Two image-claim attempts after the text claim: exactly one succeeds.
7. Two distinct invites competing for the last artificial global image/text capacity: one reservation, one global-budget denial, final counters exactly 25/30.
8. Campaign kill committed while a reserve waits: the waiter observes the kill and allocates no operation or budget.

These tests prove database atomicity and one-time dispatch permission in the exercised cases. They do not prove that a provider billed exactly once, or that a crashed worker delivered its response. Lost dispatch acknowledgments remain consumed; there is no automatic refund or retry lease.

## Additional activation gates

A passing disposable harness is necessary, but its minimal `brick_concepts` prerequisite is not a full Supabase deployment. Before activation, also retain evidence for:

- Applying both ordered migrations in an authorized clean full local Supabase schema, including existing migrations, production-equivalent roles/default grants, and the actual PostgREST RPC signatures. The new finish RPC has four arguments, including `response_payload jsonb`; the read-only recovery RPC is `get_pilot_operation(text,text)`.
- All existing application tests, endpoint mocks, type checks, build, and generation-contract checks on the same source revision.
- Actual anon/authenticated PostgREST denials and service-role integration in that isolated local stack. No service key may be exposed to the browser. This harness does not bypass or emulate HTTP authentication.
- Owned saved-asset reconciliation after response/save/finish uncertainty, recovery at zero remaining quota, and free saved-planner replay with provider calls asserted zero. An unresolved operation must never be redispatched.
- Application validation of stored planner content and source manifests, canonical fingerprinting, invite-scoped cache keys, preserved legacy UUID restores, and malformed-recovery-header behavior. The SQL validates bounded planner envelope shape; it relies on the server to validate complete planner semantics.
- Separate discovery/QA database fixtures covering one research per invite, owned recovery, version conflicts, distinct read claims, search/read contention, nonrefundable liability, QA lifetime/caps, and real anon/authenticated denials for all new RPCs and the research table. These are not covered by the existing buyer-generation harness.
- An explicit final review that both real campaign allocations remain disabled, no real bearer token has been created, no invite has been distributed, and no live paid generation occurred during database verification.

Any failing assertion, missing lock-contention observation, unverified cleanup, missing runtime, or changed migration hash blocks activation. Do not work around a failure by weakening RLS, refunding counters, removing uniqueness constraints, reusing production credentials, or running a paid generation call. Diagnose and fix the source, then repeat the relevant isolated checks. Deployment, activation, real invite creation/distribution, and bounded paid acceptance each still require their own authorization.

## Evidence record to complete after a real run

- Source commit / both ordered migration SHA-256 values: pending
- PostgreSQL version / authorized disposable environment: pending
- Single-transaction role and functional assertions: NOT RUN
- Eight two-connection races and observed blocker PIDs: NOT RUN
- Post-rollback zero-state assertions: NOT RUN
- Final fixture cleanup: NOT RUN
- Discovery/QA-specific database behavior, RLS and contention: NOT IMPLEMENTED in this harness / NOT RUN
- Full local Supabase/PostgREST parity checks: NOT RUN
- Production campaign activation / real invite issuance: NOT AUTHORIZED by this verification pack
