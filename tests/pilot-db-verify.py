#!/usr/bin/env python3
"""Source-only prepared harness. Run only with separate authorization on a disposable local cluster.

No service installation, TCP/URL connection, app environment loading, credentials,
provider HTTP calls, real tokens, or production migration command is supported.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import selectors
import shutil
import subprocess
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "supabase/migrations/20261008070000_pilot_invite_budget.sql"
SEQUENTIAL = ROOT / "tests/pilot-db-sequential.sql"
MARKER = "OFFKIN_PILOT_ISOLATED_DISPOSABLE_V1"
# Explicitly ignore ambient PG*, application secrets, .pgpass, and service files.
CLEAN_ENV = {"PATH": os.defpath, "PGPASSFILE": os.devnull,
             "PGSERVICEFILE": os.devnull, "PGCONNECT_TIMEOUT": "5"}

BOOTSTRAP = """
create table public.brick_concepts (
 id uuid primary key default gen_random_uuid(), cache_key text not null unique,
 brand text not null, title text not null, story text not null, image_path text not null,
 prompt_version text not null, created_at timestamptz not null default now()
);
alter table public.brick_concepts enable row level security;
revoke all on public.brick_concepts from public, anon, authenticated, service_role;
grant select, insert, update on public.brick_concepts to service_role;
grant usage on schema public to anon, authenticated, service_role;
"""


def require(ok: bool, message: str) -> None:
    if not ok:
        raise RuntimeError(message)


def json_result(lines: list[str]) -> dict:
    values = [json.loads(line) for line in lines if line.startswith("{")]
    require(len(values) == 1, f"Expected one JSON result, received: {lines}")
    return values[0]


class Session:
    """One persistent psql process = one real database connection/transaction."""
    def __init__(self, command: list[str], name: str):
        self.process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                        stderr=subprocess.STDOUT, env=CLEAN_ENV, bufsize=0)
        self.selector = selectors.DefaultSelector()
        self.selector.register(self.process.stdout, selectors.EVENT_READ)
        self.pending = b""
        self.query(f"set application_name='{name}'; set statement_timeout='15s';")
        self.pid = int(self.query("select pg_backend_pid();")[0])

    def send(self, sql: str) -> str:
        marker = "PILOT_END_" + uuid.uuid4().hex
        self.process.stdin.write((sql + f"\nselect '{marker}';\n").encode())
        self.process.stdin.flush()
        return marker

    def read(self, marker: str, timeout: float = 20) -> list[str]:
        result: list[str] = []
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            while b"\n" in self.pending:
                line, self.pending = self.pending.split(b"\n", 1)
                text = line.decode("utf-8", errors="replace").strip()
                if text == marker:
                    return result
                if text:
                    result.append(text)
            if not self.selector.select(max(0.01, deadline - time.monotonic())):
                continue
            chunk = os.read(self.process.stdout.fileno(), 65536)
            if not chunk:
                raise RuntimeError(f"psql exited before completion: {result}")
            self.pending += chunk
        raise RuntimeError(f"psql timed out: {result}")

    def query(self, sql: str) -> list[str]:
        return self.read(self.send(sql))

    def close(self) -> None:
        if self.process.poll() is None:
            try:
                self.process.stdin.write(b"\\q\n")
                self.process.stdin.flush()
                self.process.wait(timeout=2)
            except (BrokenPipeError, subprocess.TimeoutExpired):
                self.process.kill()
                self.process.wait(timeout=3)
        self.selector.close()


class Harness:
    def __init__(self, args: argparse.Namespace):
        require(args.ack_disposable_cluster, "Explicit disposable-cluster acknowledgment required")
        require(re.fullmatch(r"offkin_pilot_verify_[a-z0-9_]{1,32}", args.database) is not None,
                "Database must have the strict offkin_pilot_verify_ prefix; URLs/DSNs are rejected")
        require(Path(args.socket).is_absolute() and Path(args.socket).is_dir(),
                "Only an existing absolute local Unix-socket directory is supported")
        require(re.fullmatch(r"[a-z_][a-z0-9_]{0,62}", args.user) is not None,
                "Supply only a local peer-authenticated administrator role name")
        if args.psql:
            selected = Path(args.psql)
            require(selected.is_absolute() and selected.name == "psql" and selected.is_file()
                    and os.access(selected, os.X_OK),
                    "--psql must name an existing absolute approved official psql executable")
            executable = str(selected.resolve(strict=True))
        else:
            executable = shutil.which("psql", path=os.defpath)
        require(executable is not None, "Official PostgreSQL psql runtime is required; nothing is installed automatically")
        self.command = [executable, "-X", "-w", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1",
                        "--host", args.socket, "--port", str(args.port),
                        "--dbname", args.database, "--username", args.user]
        self.database = args.database
        self.dirty = False
        self.guard(initial=True)

    def run(self, sql: str) -> list[str]:
        result = subprocess.run(self.command, input=sql, text=True, stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT, env=CLEAN_ENV, timeout=30, check=False)
        require(result.returncode == 0, "psql failed: " + result.stdout)
        return [line.strip() for line in result.stdout.splitlines() if line.strip()]

    def guard(self, initial: bool = False) -> None:
        result = json_result(self.run("""
select json_build_object('database',current_database(),'version',current_setting('server_version'),
 'marker',(select shobj_description(oid,'pg_database') from pg_database where datname=current_database()),
 'superuser',(select rolsuper from pg_roles where rolname=current_user),
 'role_count',(select count(*) from pg_roles where rolname in ('anon','authenticated','service_role')),
 'client_roles_safe',(select count(*)=2 and bool_and(not rolsuper and not rolbypassrls and not rolcanlogin)
     from pg_roles where rolname in ('anon','authenticated')),
 'service_role_safe',(select not rolsuper and rolbypassrls and not rolcanlogin from pg_roles where rolname='service_role'),
 'no_role_memberships',not exists(select 1 from pg_auth_members m join pg_roles r on r.oid=m.member
     where r.rolname in ('anon','authenticated','service_role')),
 'other_schemas',(select count(*) from pg_namespace where nspname not in ('public','information_schema')
     and nspname not like 'pg_%'),
 'public_objects',(select count(*) from pg_class where relnamespace='public'::regnamespace)
      +(select count(*) from pg_proc where pronamespace='public'::regnamespace)
      +(select count(*) from pg_type where typnamespace='public'::regnamespace));
"""))
        require(result["database"] == self.database and result["marker"] == MARKER,
                "Missing disposable database marker; do not mark an existing application database")
        require(result["superuser"] and result["role_count"] == 3 and result["client_roles_safe"]
                and result["service_role_safe"] and result["no_role_memberships"],
                "Expected disposable-cluster owner and isolated NOLOGIN anon/authenticated/service_role roles")
        require(result["other_schemas"] == 0, "Database contains unexpected application schemas")
        if initial:
            require(result["public_objects"] == 0, "Initial database must have an empty public schema")
            print(json.dumps({"runtime": result["version"], "database": self.database,
                              "migration_sha256": hashlib.sha256(MIGRATION.read_bytes()).hexdigest()}))

    def reset(self) -> None:
        self.guard()
        # This destructive statement is reachable only after the marked, empty,
        # disposable database guard. No application database is a supported target.
        self.run("begin; drop schema public cascade; create schema public;\n" + BOOTSTRAP
                 + MIGRATION.read_text() + "\ncommit;")
        self.dirty = True
        result = json_result(self.run("""
select json_build_object('campaigns',(select count(*) from public.pilot_campaigns),
 'disabled',(select bool_and(not enabled) from public.pilot_campaigns),
 'invites',(select count(*) from public.pilot_invites),
 'operations',(select count(*) from public.pilot_operations));
"""))
        require(result == {"campaigns": 1, "disabled": True, "invites": 0, "operations": 0},
                "Migration did not fail closed")

    def seed(self, count: int = 1, high_water: bool = False) -> None:
        # Isolated fixture state only; there is deliberately no bearer token.
        liability = ",image_attempts_reserved=24,text_dispatches_reserved=29" if high_water else ""
        self.run("begin; set local role service_role; "
                 "update public.pilot_campaigns set enabled=true,expires_at=clock_timestamp()+interval '30 days'"
                 + liability + "; insert into public.pilot_invites(campaign_id,token_digest) "
                 f"select c.id,lpad(to_hex(n),64,'0') from public.pilot_campaigns c,generate_series(1,{count}) n; commit;")

    def race(self, name: str, first_sql: str, second_sql: str, rollback_first: bool = False) -> tuple[dict, dict]:
        a = Session(self.command, "pilot_verify_" + name + "_a")
        b = Session(self.command, "pilot_verify_" + name + "_b")
        try:
            first = json_result(a.query("begin; set local role service_role; " + first_sql))
            second_marker = b.send("begin; set local role service_role; " + second_sql + " commit;")
            observed = False
            deadline = time.monotonic() + 8
            while time.monotonic() < deadline:
                check = self.run(f"select exists(select 1 from pg_stat_activity where pid={b.pid} "
                                 f"and wait_event_type='Lock' and {a.pid}=any(pg_blocking_pids(pid)));")
                if check == ["t"]:
                    observed = True
                    break
                time.sleep(0.05)
            require(observed, name + ": actual two-connection lock contention was NOT observed")
            a.query("rollback;" if rollback_first else "commit;")
            second = json_result(b.read(second_marker))
            print(json.dumps({"race": name, "distinct_backend_pids": [a.pid, b.pid],
                              "observed_blocking_lock": True, "first": first, "second": second}))
            return first, second
        finally:
            b.close()
            a.close()

    def counters(self) -> dict:
        return json_result(self.run("""
select json_build_object('images',c.image_attempts_reserved,'texts',c.text_dispatches_reserved,
 'operations',(select count(*) from public.pilot_operations),
 'text_claims',(select count(*) from public.pilot_operations where text_dispatched_at is not null),
 'image_claims',(select count(*) from public.pilot_operations where image_dispatched_at is not null))
from public.pilot_campaigns c;
"""))

    def cleanup(self) -> None:
        if self.dirty:
            self.guard()
            self.run("begin; drop schema public cascade; create schema public; commit;")
            self.dirty = False
            self.guard(initial=True)
            print("PASS: fixture schema removed; original empty public schema restored; roles/database marker unchanged")


def reserve(n: int, label: str = "race_world", fingerprint: str | None = None) -> str:
    # All inputs are internal fixed fixture values; no SQL accepts caller payloads.
    fp = fingerprint or hashlib.sha256(label.encode()).hexdigest()
    return (f"select public.reserve_pilot_operation(lpad(to_hex({n}),64,'0'),'{label}',"
            f"'{fp}','asset','world');")


def run_cases(h: Harness) -> None:
    h.reset()
    for line in h.run(SEQUENTIAL.read_text()):
        if line.startswith("PASS:"):
            print(line)
    require(h.counters() == {"images": 0, "texts": 0, "operations": 0, "text_claims": 0, "image_claims": 0},
            "Single-transaction fixture did not roll back")
    require(h.run("select count(*) from public.pilot_invites;") == ["0"], "Invite fixtures leaked after rollback")
    print("PASS: post-rollback counters and invite rows independently checked")

    for name, follower_sql, expected in [
        ("same_request", reserve(1), "in_progress"),
        ("same_key_changed_payload", reserve(1, fingerprint="f" * 64), "denied"),
        ("new_key_same_stage", reserve(1, "second_world"), "denied"),
    ]:
        h.reset(); h.seed()
        first, second = h.race(name, reserve(1), follower_sql)
        require(first.get("status") == "reserved" and second.get("status") == expected, name + ": wrong statuses")
        if name == "same_key_changed_payload":
            require(second.get("reason") == "idempotency_conflict", "Payload conflict was not enforced")
        if name == "new_key_same_stage":
            require(second.get("reason") == "stage_consumed", "Second stage reservation was not blocked")
        require(h.counters() == {"images": 1, "texts": 1, "operations": 1, "text_claims": 0, "image_claims": 0},
                name + ": duplicate charged more than once")

    h.reset(); h.seed()
    first, second = h.race("rollback_then_reserve", reserve(1), reserve(1), rollback_first=True)
    require(first.get("status") == "reserved" and second.get("status") == "reserved", "Rollback waiter did not reserve")
    require(h.counters()["operations"] == 1 and h.counters()["images"] == 1 and h.counters()["texts"] == 1,
            "Rolled-back reservation leaked liability")
    op = second["operation_id"]
    for kind in ["text", "image"]:
        query = f"select public.claim_pilot_dispatch('{op}','{kind}');"
        a, b = h.race("one_" + kind + "_claim", query, query)
        require(a.get("allowed") is True and b.get("allowed") is False
                and b.get("reason") == "dispatch_already_claimed", kind + " was not claimed exactly once")
    require(h.counters() == {"images": 1, "texts": 1, "operations": 1, "text_claims": 1, "image_claims": 1},
            "Claim race altered reservations")

    h.reset(); h.seed(count=2, high_water=True)
    a, b = h.race("last_global_capacity", reserve(1), reserve(2))
    require(a.get("status") == "reserved" and b.get("reason") == "campaign_budget_exhausted", "Global race exceeded capacity")
    require(h.counters() == {"images": 25, "texts": 30, "operations": 1, "text_claims": 0, "image_claims": 0},
            "Global atomic high-water counters incorrect")

    h.reset(); h.seed()
    kill = "update public.pilot_campaigns set enabled=false; select json_build_object('killed',true);"
    _, denied = h.race("kill_before_waiter", kill, reserve(1))
    require(denied.get("reason") == "pilot_disabled", "Waiter ignored committed kill switch")
    require(h.counters()["operations"] == 0, "Killed waiter allocated budget")
    print("PASS: all eight genuine two-connection contention cases completed")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--psql", help="Explicit absolute path to an approved official psql executable; default searches /bin:/usr/bin only")
    parser.add_argument("--socket", required=True, help="Existing local Unix-socket directory; TCP and URLs forbidden")
    parser.add_argument("--port", type=int, default=5432)
    parser.add_argument("--database", required=True)
    parser.add_argument("--user", required=True, help="Disposable cluster's local peer-authenticated administrator")
    parser.add_argument("--ack-disposable-cluster", action="store_true")
    args = parser.parse_args()
    require(1 <= args.port <= 65535, "Port/socket number out of range")
    harness = Harness(args)
    try:
        run_cases(harness)
    finally:
        harness.cleanup()


if __name__ == "__main__":
    main()
