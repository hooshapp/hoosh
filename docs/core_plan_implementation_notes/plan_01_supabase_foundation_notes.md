# Plan 01 — Supabase Foundation Implementation Notes

**Plan:** [01_supabase_foundation.md](../core_plan/01_supabase_foundation.md).
**Owner for this work:** Ishmum; Anisha retains SB-01–03 and leads SB-06.
**Starting commit:** `d4f3e38`. **Started:** 2026-11-01.
**Current branch/part:** `task/backend/supabase-sb-04`, SB-04: Implemented/provisioned; hosted password-login acceptance pending

## Resume here

- Latest: **SB-04 — Least-privilege database bootstrap and backend trust handoff**, subject `chore(db): define least-privilege development database access`, parent `d4f3e38`.
- Actual validation: 286 deterministic backend tests passed for this part; Ruff passed. PostgreSQL 17.11 scratch bootstrap ran twice, true runtime login denied persistent DDL/Auth access/admin escalation and five unsafe-role/ambient-grant scenarios rolled back. Authenticated MCP applied the role bootstrap and verified zero elevated flags/memberships/ownership/Auth CRUD; public TEMP is separately reported. Actual production JWKS resolution and rejection of both real project public API key types passed. TLS 1.3 with downloaded CA/hostname passed; wrong trust/hostname failed before authentication. Hosted administrator password login was rejected; no hosted runtime-password initialization occurred. Frozen uv sync and contract drift checks passed. See artifacts/sb-04/verification.json.
- Next / remaining: SB-04 is partial only at the external hosted password-login/permission gate: correct or deliberately recover the project database password privately, then run configure-db-access.py with the downloaded CA. No reset was performed. Complete SB-05 isolated test infrastructure next; API-06 can build against its verified role contract/fixture, but hosted rollout still needs SB-04 login acceptance. API-06–10, real user tokens, Anisha Auth/root wiring and joint M1/M2 remain pending. Nothing was pushed.
- Anisha retains Auth administration/users/providers/redirects, onboarding and iOS.
  Ishmum owns the product database/backend. No Auth setting, user, product table,
  paid resource, credential reset, push or main merge was performed.

## Recording rules

Each commit records every file/logical change with exact line ranges, reasoning,
actual checks and remaining dependencies. Historical ranges refer to that commit.
Keep an entry's own hash Pending until the next normal update; resolve by its
unique subject through Git. Never store credentials or private account records.
Cloud observations and local fixture evidence are separate from live acceptance.

## Commit entries

### SB-04 — Least-privilege database bootstrap and backend trust handoff

**Hash:** Pending; resolve by `chore(db): define least-privilege development database access`.
**Date:** 2026-11-01. **Owner:** Ishmum. **Branch:** `task/backend/supabase-sb-04`. **Parent:** `d4f3e38`.
**Status:** Implemented/provisioned; hosted password-login acceptance pending

#### Changed files and logical changes

Ranges refer to this commit; deleted ranges refer to its parent. Resolve the own
Pending hash by unique commit subject until the next normal notes update.

| File and lines | Change and reason |
|---|---|
| `.github/workflows/checks.yml`: lines 44–44 | Lint the private database handoff script in the existing API CI job; hosted credentials are not introduced into CI. |
| `.gitignore`: lines 22–23 | Ignore the API-local certificate/scratch directory in addition to existing environment-file rules so downloaded CA files and private provisioning material cannot be staged accidentally. |
| `docs/architecture/environment-map.md`: lines 1–29 | Record backend trust/runtime/migration/test variable ownership and private-file/TLS boundaries without values; retain Anisha ownership of mobile Auth and actual Auth administration. |
| `docs/core_plan/01_supabase_foundation.md`: lines 3–3 | Advance only the actual SB-04 bootstrap/local evidence and retain partial hosted acceptance. Clarify persistent-object denial versus ambient temporary rights without revoking managed-service defaults; Anisha-owned ledger rows remain pending. |
| `docs/core_plan/01_supabase_foundation.md`: lines 197–198 | Advance only the actual SB-04 bootstrap/local evidence and retain partial hosted acceptance. Clarify persistent-object denial versus ambient temporary rights without revoking managed-service defaults; Anisha-owned ledger rows remain pending. |
| `docs/core_plan/01_supabase_foundation.md`: lines 305–305 | Advance only the actual SB-04 bootstrap/local evidence and retain partial hosted acceptance. Clarify persistent-object denial versus ambient temporary rights without revoking managed-service defaults; Anisha-owned ledger rows remain pending. |
| `docs/core_plan/01_supabase_foundation.md`: lines 321–331 | Advance only the actual SB-04 bootstrap/local evidence and retain partial hosted acceptance. Clarify persistent-object denial versus ambient temporary rights without revoking managed-service defaults; Anisha-owned ledger rows remain pending. |
| `docs/core_plan_implementation_notes/README.md`: lines 46–46 | Link the newly started single Plan 01 record so both developers/agents can discover the ownership and exact implementation history. |
| `docs/core_plan_implementation_notes/artifacts/sb-04/verification.json`: lines 1–40 | Record nonsecret hosted role/catalog and TLS/public-key evidence alongside 286 deterministic backend tests and local permission/unsafe-grant checks; explicitly record rejected administrator login and unverified real user identity. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 229–229 | Record the known API-05 hash and current Supabase backend follow-up: observed live JWKS and real public-key rejection are verified, while user-token/mobile M1 and hosted DB login remain separate unfinished evidence. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 335–344 | Record the known API-05 hash and current Supabase backend follow-up: observed live JWKS and real public-key rejection are verified, while user-token/mobile M1 and hosted DB login remain separate unfinished evidence. |
| `docs/runbooks/supabase-development.md`: lines 1–60 | Record actual project/PostgreSQL/ES256 observations, real resolver compatibility and database procedure while explicitly leaving Auth handoff, real user-token/mobile acceptance and rejected hosted-password login pending. |
| `package.json`: lines 20–20 | Include the new credential-safe bootstrap helper in the root API lint command; no runtime/mobile dependency or client changes. |
| `scripts/configure-db-access.py`: lines 1–231 | Implement a private development-only handoff with pinned project/role/host/mode, strict URI parsing and verify-full CA validation. Initialize a fresh runtime password using client-side SCRAM and private encoded URI persistence only when explicitly requested; real runtime-login probes remain separate from administrator authority. Map driver failures to server-owned safe categories without exposing credentials or SQL. |
| `services/api/.env.example`: lines 24–27 | Document remote verify-full/root-CA requirements and the actual direct versus session-pooler custom-role naming; keep all credential fields as placeholders and separate future test settings. |
| `services/api/README.md`: lines 130–143 | Expose the current DB preparation/runbooks and distinguish provisioned hosted role/public trust checks from pending password login and future HTTP application DB integration. |
| `services/api/db/bootstrap/README.md`: lines 1–86 | Document reviewed infrastructure bootstrap versus Alembic product ownership, separate administrator/runtime credentials, passwordless initial role, private SCRAM/psql setup, exact dashboard pooler/TLS procedure, temporary PUBLIC privilege boundary and non-destructive recovery. |
| `services/api/db/bootstrap/check-permissions.sql`: lines 1–31 | Use rollback-only permission probes through a true runtime session to reject persistent table/schema creation, managed Auth reads and administrator SET ROLE. A privileged session using SET ROLE cannot satisfy the login prerequisite. |
| `services/api/db/bootstrap/roles.sql`: lines 1–57 | Create/validate the non-owner LOGIN role with bounded connections and no elevated flags/memberships; grant only CONNECT/public USAGE, reject ambient persistent CREATE and Auth-table CRUD, then set bounded role defaults. No passwords, product tables, global PUBLIC revokes or Auth configuration changes. |
| `services/api/db/bootstrap/verify.sql`: lines 1–19 | Report only role attributes, effective persistent/temporary privileges, memberships, ownership and Auth-table permission counts; do not fetch user rows, tokens or password hashes. |
| `services/api/pyproject.toml`: lines 17–17 | Add psycopg binary support only to development tooling for private hosted provisioning and real PostgreSQL verification; application engine/session integration stays API-06. |
| `services/api/tests/test_db_bootstrap_config.py`: lines 1–104 | Verify strict target/role/port/options guards, forced full TLS, reserved-character URI round trips and safe CLI/driver error categories using synthetic inputs only; no live passwords or network are used in these unit tests. |
| `services/api/uv.lock`: lines 151–151 | Lock psycopg and its platform binary wheels at 3.3.6 under the existing single uv lockfile; no SQLAlchemy, Alembic or runtime DB engine is installed. |
| `services/api/uv.lock`: lines 168–168 | Lock psycopg and its platform binary wheels at 3.3.6 under the existing single uv lockfile; no SQLAlchemy, Alembic or runtime DB engine is installed. |
| `services/api/uv.lock`: lines 334–369 | Lock psycopg and its platform binary wheels at 3.3.6 under the existing single uv lockfile; no SQLAlchemy, Alembic or runtime DB engine is installed. |
| `services/api/uv.lock`: lines 622–630 | Lock psycopg and its platform binary wheels at 3.3.6 under the existing single uv lockfile; no SQLAlchemy, Alembic or runtime DB engine is installed. |
| `docs/core_plan_implementation_notes/plan_01_supabase_foundation_notes.md`: lines 1–26 | Refresh the plan ownership, resume checkpoint, actual checks and precise outstanding integration/credential boundaries. |
| `docs/core_plan_implementation_notes/plan_01_supabase_foundation_notes.md`: lines 27–82 | Record this per-commit file/line table, decisions, real validation and remaining handoff; no credentials or unrun acceptance claims. |

#### Decisions and relations

- Consume the existing project through authenticated MCP rather than creating another account/project. Read-only observations identify PostgreSQL 17.11, empty public product schema and ES256. Populate ignored mode-0600 backend public trust settings only; the expected audience is the shared M1 contract, not a claim that a real user's JWT was observed. Anisha still owns SB-01–03/Auth/mobile/iOS and leads SB-06.
- Implement and test one reviewed infrastructure role bootstrap before applying it remotely. MCP requires DDL through apply_migration, so its provider record bootstrap_disconnect_runtime_role is explicitly infrastructure-only; API-07 will still own the single Alembic product-schema history. No product table, managed Auth object/setting/user, callback, provider, paid resource or password reset was changed.
- The dedicated runtime LOGIN starts without a password and cannot own persistent objects, elevate, inherit/assume other roles, create databases/roles or bypass RLS. Reject unsafe existing attributes/memberships/ownership/ambient grants atomically instead of silently erasing them or revoking shared PUBLIC/managed-service privileges. Grant only database CONNECT and public USAGE. Preserve/report PostgreSQL's PUBLIC-inherited temporary-table capability separately from denied persistent DDL; changing that global default could disrupt managed clients.
- Retain explicit administrator-only migration/bootstrap credentials for early development rather than inventing an untested hosted migration role. The API must never fall back to that URL. No application database client/engine was wired; psycopg 3.3.6 is development-only until API-06 consumes it at runtime.
- This machine could not resolve the direct database hostname, so obtain the exact session-pooler host from the user's dashboard URI rather than guessing its cluster index. The system trust store rejected the provider's self-signed chain; the privately downloaded root CA verifies TLS 1.3 and the real hostname, with negative trust/hostname checks failing before credentials. Do not downgrade SSL or infer real login from a TLS handshake.
- Provide strict private provisioning/check tooling. Refuse unknown URI options, wrong project/role/database or transaction-pooler port; use client-side SCRAM instead of plaintext ALTER ROLE SQL, canonical URI escaping (including CA paths with spaces), private .env storage and refusal of implicit rerotation. File persistence and database commit cannot be one atomic distributed transaction; interrupted operations require a nonrotating check before deliberate recovery. Every driver failure is sanitized to a safe diagnostic; raw text never enters chat/Git/logs.
- The saved administrator credential was corrected locally but still rejected by Supabase. Stop retries and leave hosted login/runtime-password acceptance pending; do not reset a shared administrator password to claim completion. The role/catalog and local fixture contract remain useful to SB-05 independently. No hosted runtime credential was generated because initialization never passed administrator connection.
- Real public-key rejection and live JWKS compatibility are backend evidence, not a real A/B user login, signup/confirmation, refresh, Auth session producer or mobile M1 proof. Do not mark Anisha's parts complete or create disposable Auth accounts on her behalf. Sources are linked in the bootstrap/runbooks; no design/UI/PM policy change is made.

**Actual validation:** 286 deterministic backend tests passed for this part; Ruff passed. PostgreSQL 17.11 scratch bootstrap ran twice, true runtime login denied persistent DDL/Auth access/admin escalation and five unsafe-role/ambient-grant scenarios rolled back. Authenticated MCP applied the role bootstrap and verified zero elevated flags/memberships/ownership/Auth CRUD; public TEMP is separately reported. Actual production JWKS resolution and rejection of both real project public API key types passed. TLS 1.3 with downloaded CA/hostname passed; wrong trust/hostname failed before authentication. Hosted administrator password login was rejected; no hosted runtime-password initialization occurred. Frozen uv sync and contract drift checks passed. See artifacts/sb-04/verification.json.

**Remaining / next:** SB-04 is partial only at the external hosted password-login/permission gate: correct or deliberately recover the project database password privately, then run configure-db-access.py with the downloaded CA. No reset was performed. Complete SB-05 isolated test infrastructure next; API-06 can build against its verified role contract/fixture, but hosted rollout still needs SB-04 login acceptance. API-06–10, real user tokens, Anisha Auth/root wiring and joint M1/M2 remain pending. Nothing was pushed.
