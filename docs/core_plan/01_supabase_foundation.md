# Plan 01 — Supabase Auth and Database Foundation

**Status:** Draft implementation plan; no project, credentials, roles, or users are created by this document.\
**Owners:** Anisha owns Supabase Auth end to end, including development project setup and Auth configuration (SB-01–03). Ishmum owns product database roles and test infrastructure (SB-04–05). Anisha leads SB-06 with Ishmum supplying backend evidence.\
**Area branches:** SB-01–03 use `area/auth-onboarding`; SB-04–05 use `area/backend`. Use one task branch per part, such as `task/auth/supabase-sb-01` or `task/backend/supabase-sb-04`. SB-06 has one named author, Anisha, with Ishmum contributing API/database notes.\
**Prerequisite:** Agree the relevant contracts in [Plan 00](00_shared_contracts.md).\
**Milestones:** Supplies the development identity provider for M1; supplies least-privilege database access and isolated test infrastructure for M2.

## 1. Outcome and scope

Ishmum and Anisha can use one explicitly identified **development** Supabase project for real authentication. The mobile app receives only public client configuration; FastAPI knows the exact trusted issuer, audience, signing algorithm, and public-key discovery endpoint. Later database work has separate runtime and migration credentials, one migration authority, and an isolated test database.

Supabase hosts two concerns with different owners: **Anisha configures Auth and the project that supplies it; Ishmum implements the application database/backend side.** Ishmum consumes the Auth trust metadata; he is not responsible for configuring providers, confirmation, redirects, SMTP or Auth users.

This plan does not implement mobile login, server token verification, SQLAlchemy models, product migrations, production hosting, or native restriction behavior. Those responsibilities belong to Plans 02, 03, and future native/deployment plans.

### Requirement and design references

- PRD: FR-002, FR-003, FR-008, FR-009, NFR-005/006/007/012/013.
- TSD: §8 identity/API boundary, §9 database ownership, §13 security, §14 configuration.
- Figma: signup `18:2`, login `27:59`, optional demographics `27:113` / `48:79`, Settings identity `27:157`.
- PM dependencies: Q17 / PD-09/10 for login and providers; Q19 / PD-17 for age/distribution; Q21 for device scope. Infrastructure setup must not silently resolve these product choices.

## 2. Chosen approach and boundaries

These are proposed engineering choices to implement through the parts below; they are not evidence of existing configuration.

| Concern | Choice | Reason / boundary |
|---|---|---|
| Identity authority | Supabase Auth | Do not build a second password store or separate user-ID namespace. |
| Canonical account ID | Auth user UUID, later used as profile `user_id` | Emails and provider subjects are not application primary keys. |
| Initial live path | Email/password in development | Lets Ishmum and Anisha verify M1; production provider requirements remain open. |
| Signing | New project's asymmetric signing key; record exact algorithm | Keeps signing secrets out of FastAPI; do not guess `ES256` from a sample. |
| Mobile configuration | Project URL + publishable key | Never ship an elevated key, database URL, or signing secret. |
| Server verification | Project-pinned public JWKS | Mobile public keys do not prove user identity; the bearer token does. |
| Product access | FastAPI owns product API writes | Mobile uses Supabase directly for Auth, not product-table CRUD in this stage. |
| Product migration history | Alembic in `services/api/alembic/` | No parallel hand-written dashboard table edits or Supabase migration history. |
| Database runtime | Dedicated non-owner, non-bypass login role | Runtime code must not connect as `postgres` or use a service-role Data API shortcut. |
| Database integration tests | Disposable local PostgreSQL matching the managed major version | Avoid sharing or resetting the development project during automated tests. |
| Production environment | Separate later project/configuration | Development credentials and test accounts must not become the production baseline accidentally. |

Supabase distinguishes public client keys from elevated secret keys; only the former belongs in mobile configuration. Verify the actual project's key type and copy configuration from its dashboard rather than inferring it from a naming convention. [Supabase API keys](https://supabase.com/docs/guides/api/api-keys)

## 3. Deliverables and proposed file ownership

| File / artifact | Owner | Purpose |
|---|---|---|
| `docs/runbooks/supabase-development.md` | Anisha authors project/Auth sections; Ishmum authors DB sections in SB-04/05 | Project identity, setup/recovery procedure, observed non-secret settings, dated verification. |
| `docs/architecture/environment-map.md` | Anisha authors project/Auth mapping; Ishmum adds backend/DB mapping | Where each setting belongs; no secret values. Coordinate section edits. |
| `apps/mobile/.env.example` | Anisha owns Supabase Auth fields; Ishmum supplies API base URL | Public configuration names required by the mobile Auth client. |
| `services/api/.env.example` | Ishmum | Issuer/audience/algorithm and database URL variable names; examples contain placeholders only. |
| `services/api/db/bootstrap/roles.sql` | Ishmum | Reviewed, repeatable role bootstrap; passwords supplied through a separate secure procedure. |
| `services/api/db/bootstrap/README.md` | Ishmum | Who can bootstrap, which database is targeted, verification and recovery. |
| `compose.test.yml` | Ishmum | Isolated PostgreSQL service for integration tests, with a pinned compatible image. |
| `services/api/tests/support/bootstrap.sql` | Ishmum | Test-only minimal Auth-user table and role prerequisites, not production Auth migrations. |
| Secret store / local ignored files | Each developer | Actual credentials; never checked into Git or copied into evidence logs. |

**Boundary with Plan 03:** this plan provisions access and prerequisites. API-07 authors the product tables, table grants, RLS policies, and migration history together. Do not write duplicate profile migrations here.

## 4. Configuration contract

### 4.1 Non-secret values that may be recorded

- Environment label, project reference, project URL, region, and observed PostgreSQL major version.
- JWT issuer, expected audience, exact allowed signing algorithm, and JWKS URL derived from that issuer.
- Approved development redirect URIs, configured provider names, confirmation requirement, and observed email limits.
- Connection mode (direct or session pooler), host/port convention, runtime role name, migration role name, and TLS verification method.

Avoid publishing actual project URLs in public issue screenshots when unnecessary, even though they are not passwords. Use placeholders in reusable examples.

### 4.2 Mobile public settings

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://<development-project>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<development-publishable-key>
EXPO_PUBLIC_API_BASE_URL=<reachable-development-api-origin>
```

The mobile URL and key must reference the **same environment**. A public key is still configuration, not an access token. Plan 02 owns secure storage and refresh-token handling; this plan never instructs users to copy refresh tokens into `.env` files.

### 4.3 Server settings

Names must match Plan 00/03 before code is added:

```dotenv
APP_ENV=development
SUPABASE_PROJECT_URL=https://<development-project>.supabase.co
SUPABASE_JWT_ISSUER=https://<development-project>.supabase.co/auth/v1
SUPABASE_JWT_AUDIENCE=authenticated
SUPABASE_JWT_ALGORITHMS=["<observed-asymmetric-algorithm>"]
# M2 only; actual values stay outside Git:
DATABASE_URL=<runtime-connection-url>
MIGRATION_DATABASE_URL=<migration-connection-url>
```

FastAPI does not need a Supabase secret/service key to verify asymmetric access tokens. It does need outbound access to the project-pinned JWKS endpoint when the key cache is cold or refreshed. [Supabase JWT verification](https://supabase.com/docs/guides/auth/jwts)

## 5. Commit sequence

Every part includes implementation evidence in its commit/PR description. Dashboard actions are external state: the Git commit records reproducible configuration and redacted checks, but cannot substitute for actually performing and verifying them during implementation.

### SB-01 — Establish environment ownership and configuration names

**Owner:** Anisha; Ishmum consumes the server configuration handoff.

**Proposed commit:** `docs(supabase): define development environment and credential ownership`\
**Depends on:** Plan 00 identity/configuration contracts.\
**Files:** `docs/architecture/environment-map.md`, `apps/mobile/.env.example`, `docs/runbooks/supabase-development.md`. Ishmum applies the server settings to `services/api/.env.example` in his backend work; Anisha supplies their agreed names and observed metadata.

**Implementation:**

1. Identify whether a development Supabase project already exists; reuse deliberately or create a separately named development project. Inspect ownership before changing anything.
2. Anisha coordinates project creation/administration and Auth configuration. Give Ishmum the access needed for product database/bootstrap work and establish backup access; each uses their own account. Document where non-secret setup notes and actual credentials live.
3. Fix the client/server variable names and the environment label; explain how a developer confirms both clients point at development.
4. Record which settings are needed for M1 versus M2. Do not require database credentials to run the UI shell or public health endpoint.
5. Record the intended email/password development path as an engineering milestone, not approval of the production sign-in policy.

**Validation / acceptance:**

- Ishmum and Anisha can explain which settings they need without exchanging passwords in source files.
- Existing `.gitignore` excludes actual environment files, database keys, and signing material; examples remain tracked.
- `npm run check` still passes; this part should not introduce runtime dependencies.

**Failure / recovery:** correct an inconsistent environment map before creating resources. If a secret is accidentally committed, rotate it and remove it from active configuration; deleting the line in a later commit is insufficient.

### SB-02 — Establish the development project and signing configuration

**Owner:** Anisha; Ishmum verifies the delivered trust metadata in his API configuration/tests.

**Proposed commit:** `docs(supabase): record verified development project and signing configuration`\
**Depends on:** SB-01.\
**Files:** development runbook and environment examples; project settings are external state.

**Implementation:**

1. Use the agreed development project, appropriate region, and the smallest suitable service configuration. Do not provision a paid production environment in this part.
2. Record project identity and PostgreSQL major version. Record free-tier limitations observed at implementation time rather than promising permanent zero cost.
3. Inspect JWT signing configuration. Prefer an asymmetric key for this new development setup and record the actual algorithm/issuer/audience. If existing users/project keys exist, treat rotation as a separate migration task; do not casually rotate an established project.
4. Derive the JWKS URL from the configured issuer and fetch its public key set. Check `kid`, key type, use, and algorithm compatibility without copying tokens or private keys into logs.
5. Populate each developer's ignored local configuration through the agreed secret-sharing method.

**Validation / acceptance:**

- Project URL, issuer, audience, and allowed algorithm agree across the server and mobile setup notes.
- JWKS responds over verified HTTPS and contains a usable public signing key for the intended development flow.
- A key from a different project is not accepted by the future API test setup; API-02/03 will prove enforcement.

**Failure / recovery:** a missing/empty JWKS must be investigated against the actual project's signing mode. Do not add an unsigned-token or arbitrary HS256 fallback. A dashboard change requires checking new and existing sessions before marking this part complete. Supabase supports managed key rotation, but its discovery caches mean custom verifiers need an explicit rotation/revocation procedure. [Signing-key guidance](https://supabase.com/docs/guides/auth/signing-keys)

### SB-03 — Configure the first Auth flow, redirects, and development users

**Owner:** Anisha (providers, confirmation/email delivery, callback allowlists and disposable Auth accounts).

**Proposed commit:** `docs(auth): configure development email authentication and redirects`\
**Depends on:** SB-02 and the callback URL contract in Plan 00/02, not completed callback code. AUTH-04 consumes this configuration afterwards; live callback evidence belongs to SB-06.\
**Files:** runbook, environment map, examples if necessary; coordinate any `app.config.ts` scheme change with the mobile/native owner.

**Implementation:**

1. Configure email/password and choose the development email-confirmation behavior explicitly. Prefer testing the real confirmation flow instead of disabling it to make a screenshot pass.
2. Keep the initial provider list narrow. Configure Google/Apple only in the conditional Auth-plan part selected for implementation; do not ship a nonfunctional provider button.
3. Register the agreed controller URL `/auth/callback` for signup confirmation, recovery, and selected OAuth flows: `http://localhost:8081/auth/callback`, plus provisional `disconnect-dev://auth/callback` after checking the intended Router mapping. Add a `127.0.0.1` target only if that distinct development origin is deliberately used. The recovery controller navigates internally to `/reset-password` after verification; do not register the reset form as a shortcut around callback exchange/context checks. Do not use a broad production redirect wildcard.
4. Record the current development scheme (`disconnect-dev`) as provisional. The existing iOS audit may reveal a production scheme that must be preserved; callback configuration must follow that audited choice.
5. Check the project's current email restrictions. Supabase's default sender is for limited testing; arbitrary real users may require custom SMTP. Record delivery evidence for the actual two development accounts rather than assuming success. [SMTP limits and production delivery](https://supabase.com/docs/guides/auth/auth-smtp)
6. Create two distinct disposable development accounts A and B using controlled test email addresses. To unblock the initial existing-user sign-in proof, a supported development-admin/dashboard seed may mark only those disposable accounts confirmed; this does not prove the app's signup/confirmation flow. Real signup/confirmation must still be tested under AUTH-04/05 and SB-06 before broad signup use. Store credentials outside Git; use A/B labels in evidence.
7. Record the real signup/confirmation/sign-in/refresh/sign-out scenarios to execute in SB-06 once AUTH-03–07 and RN-05/06 exist. Keep those outcomes explicitly pending here; configuration readiness must not wait on the consumers that need this configuration.

**Validation / acceptance:**

- The provider can issue a real access token for each disposable account with different `sub` UUIDs, using a controlled provider/client smoke operation independent of unfinished mobile screens. Do not save token values in the runbook.
- Exact callback allowlists, confirmation settings, provider state, and current email limits are recorded. Callback delivery/exchange success is still pending AUTH-04 and SB-06.
- Duplicate signup, wrong password, unconfirmed email, resend limits, and expired-link tests have explicit later acceptance owners; do not label an unrun client scenario passed.
- Rejection of a public key at `/v1/me` is a later API-04/SB-06 assertion, not a prerequisite for this configuration commit.

**Failure / recovery:** distinguish rejected credentials from mail delivery problems and redirect misconfiguration. Do not bypass backend JWT verification or invent a user session to continue. Changing callbacks should be reversible by restoring the prior allowlist; old links may remain unusable and must be reissued.

### SB-04 — Provision database roles and verified connection modes for M2

**Owner:** Ishmum (application database/bootstrap); coordinate project access with Anisha without changing her Auth settings.

**Proposed commit:** `chore(db): define least-privilege development database access`\
**Depends on:** SB-02; Plan 03 database design reviewed. Not a prerequisite for M1 `/v1/me`.\
**Files:** `services/api/db/bootstrap/roles.sql`, bootstrap README, API environment example, runbook.

**Implementation:**

1. Use a separate runtime login role, proposed name `disconnect_api`, with `NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`. It must not own product tables or inherit the migration owner's privileges.
2. Keep migration credentials separate. Prefer a suitably privileged migration role; if the initial development project requires the project database administrator for DDL, restrict its use to explicit migrations/bootstrap. Never configure that identity as the API runtime account.
3. Keep passwords out of SQL files, command transcripts, and Git. The checked-in role script must not contain a default credential. Document how credentials are set/rotated separately and how scripts verify an existing role has the intended flags.
4. Before product tables exist, grant only necessary connection/schema access. API-07 owns table-specific grants and RLS policies in the same migration that creates each table.
5. Choose direct connection when the development network supports it; otherwise use the dashboard-provided session-pooler URL. Record the actual host, connection mode, custom-role username convention, and TLS certificate configuration. Do not derive the pooler host from the region.
6. Use TLS with server verification (`verify-full` and the supplied trust material) for remote connections. Diagnose certificate or hostname failures rather than disabling verification.
7. Keep initial synchronous SQLAlchemy/psycopg connections small and bounded. The API plan defines pool sizing and disposal. Transaction poolers have different prepared-statement/session-state behavior and require a later measured compatibility test before switching modes. [Connection-mode guidance](https://supabase.com/docs/guides/database/connecting-to-postgres)

**Validation / acceptance:**

- Runtime connects successfully, cannot create/drop objects, cannot assume the migration role, and has neither `rolsuper` nor `rolbypassrls`.
- Runtime cannot read or modify managed Auth tables; Auth management stays with Supabase Auth.
- Migration credentials can apply an explicit migration to development, but the API config never loads them as its runtime URL.
- A connection without the correct TLS trust settings fails rather than silently downgrading.

**Failure / recovery:** fix connection mode, role username, and grants independently. Do not solve a role failure by granting `service_role`, `BYPASSRLS`, or ownership to runtime. Credential rotation must update the appropriate secret, restart affected pools, and verify old credentials no longer work. [Postgres role model](https://supabase.com/docs/guides/database/postgres/roles)

### SB-05 — Supply an isolated PostgreSQL integration-test environment

**Owner:** Ishmum.

**Proposed commit:** `test(db): add disposable PostgreSQL integration environment`\
**Depends on:** SB-04's role contract; backend owner confirms driver/image compatibility.\
**Files:** `compose.test.yml`, `services/api/tests/support/bootstrap.sql`, runbook, test environment example.

**Implementation:**

1. Pin a PostgreSQL container image matching the managed database major version observed in SB-02. The implementation records the exact tested tag/digest; do not blindly choose the newest major.
2. Use a dedicated database/name/volume for tests. Disposable local credentials may be explicit test-only values and must not be usable against the managed project.
3. Bootstrap a minimal test-only `auth.users(id UUID PRIMARY KEY)` prerequisite and the runtime role, so product foreign keys and RLS can be tested. This is fixture infrastructure only, not an emulation of all Supabase Auth behaviors.
4. Provide `TEST_DATABASE_URL` and a separate test migration URL. API-06 owns SQLAlchemy/pytest connection/context fixtures; API-07 initializes the Alembic history and wires actual migration execution into the required database test group. Do not make API-06 run a migration configuration that does not exist yet.
5. Guard destructive test cleanup: require a test environment plus the expected test database identifier/host. Never infer safety from `localhost` alone, and never fall back to `DATABASE_URL` when `TEST_DATABASE_URL` is absent.
6. Document Docker prerequisites and startup/shutdown commands. If a developer cannot run Docker, explicitly provision a separate disposable test target; do not point automated cleanup at the shared development project.

**Validation / acceptance:**

- Environment starts from empty storage, exposes only the intended test port, and can be destroyed without affecting development data.
- A failing test-database configuration fails the database test group clearly; tests do not silently pass against SQLite.
- CI can construct the same role/fixture prerequisites without storing managed-project secrets.

**Failure / recovery:** delete/reset only the named disposable test volume after verifying the target. A managed Auth behavior not represented by the fixture must receive a separate development-project smoke check; the local fixture is not proof of Supabase signup/deletion semantics.

### SB-06 — Complete the live development handoff and recovery notes

**Owner:** Anisha records the project/Auth handoff; Ishmum supplies API verification and database recovery notes. Perform the joint checks when both outputs are ready to wire.

**Proposed commit:** `docs(supabase): record identity integration evidence and recovery runbook`\
**Depends on:** AUTH-01–07, API-04/05, and RN-05/06 for the joint M1 evidence. It does not block those producer commits. Native evidence is recorded only when a signed build is available.\
**Files:** runbook, plan progress evidence links, environment map if settings changed.

**Implementation:**

1. Run M1 with both development accounts and record that `/v1/me` returns the matching UUID without database access.
2. Verify the same mobile build fails against a server pinned to a different project rather than silently linking accounts by email.
3. Record how to recover from project pause/unavailability, expired sessions, redirect mistakes, lost development credentials, key rotation, and runtime database password rotation.
4. Clearly separate session sign-out from JWT expiration. Locally verified access tokens can remain valid until expiration; M1 does not promise instant global revocation. Any sensitive future operation needing stronger freshness requires its own server-side policy. [Supabase session lifecycle](https://supabase.com/docs/guides/auth/sessions)
5. Record actual commands/builds/dates with credentials redacted. Later M2 profile isolation/runtime-role evidence is owned by API-10/RN-11 and can be linked from this runbook in a follow-up; it does not keep the M1 handoff commit open.
6. Confirm development infrastructure cost/limits and access ownership are visible to Ishmum and Anisha. Configure alerts/limits available for the selected service tier without treating alerts as spending caps.

**Validation / acceptance:**

- A second developer can configure the app/API from the runbook plus separately supplied credentials.
- No tokens, passwords, refresh tokens, or secret keys appear in Git, screenshots, CI output, or evidence.
- Live checks are marked passed only after performed; dashboard configuration checklists alone are not integration proof.

## 6. Cross-plan handoffs

| Producer / owner | Delivers | Consumer | Does not deliver |
|---|---|---|---|
| SB-02 / Anisha | Project-pinned issuer/audience/algorithm/JWKS metadata | API-01–04 | A working token verifier |
| SB-03 / Anisha | Allowed callbacks, email behavior, public config, A/B accounts | AUTH signup/login/recovery | Mobile session storage |
| SB-04 / Ishmum | Runtime/migration identities and tested connection mode | API-06/07 | Product schema or schema changes in dashboard |
| SB-05 / Ishmum | Disposable DB plus role/Auth fixture prerequisites | API integration tests / CI | Full managed Auth simulation |
| API-07 / Ishmum | Actual schema/grants/RLS migration | SB-06 evidence and Auth/profile integration | Production deployment approval |

Anisha hands Ishmum the non-secret project URL, issuer, audience, exact asymmetric
algorithm/JWKS metadata and relevant Auth behavior from SB-02/03. No provider password,
refresh token or Auth-admin key belongs in the backend handoff. Ishmum supplies the
reachable API origin and implemented schemas/error behavior. Database credentials
are provisioned/accessed separately for Ishmum's database work, outside Git.

Both sides can implement and run deterministic tests before the live join. Integration
parts such as SB-06 stay pending until the real Auth/API check has actually run;
finishing a producer module does not imply that all integration evidence is complete.

## 7. Edge-case checklist

- The public key is correct but belongs to a different project than the URL.
- A callback points at web while the request originated from a native development build.
- Old confirmation/recovery links were issued before a redirect/provider setting change.
- Email delivery is restricted to team addresses or rate limited; the UI must not announce delivery as proof of receipt.
- JWKS is temporarily unavailable, cached, empty, or contains both old/new rotation keys.
- An old signed access token remains cryptographically valid after sign-out; it must not be described as instantly revoked.
- IPv4-only development networking cannot reach the direct database endpoint.
- A custom runtime role can log in directly but is misformatted for the pooler username.
- RLS is enabled but runtime owns the table or has bypass privileges; policy tests must use the actual runtime identity.
- Test cleanup accidentally receives the development URL; reject before opening a destructive transaction.
- A developer loses access; handoff ownership must permit credential rotation without sharing personal passwords.
- Restoring configuration must not reset or destroy the team's released app identity, users, or native restrictions.

## 8. Completion gates

**M1 infrastructure ready:** SB-01–03 complete, A/B Auth accounts usable, trusted JWT metadata agreed, no application database dependency added to sign-in.

**M2 infrastructure ready:** SB-04–05 complete, runtime privileges verified, isolated DB available, one Alembic owner/history established. Product data persistence itself is completed under Plan 03.

**Plan complete:** SB-06 evidence exists, Ishmum and Anisha can repeat setup, secrets remain outside Git, and unresolved production/provider questions stay visible in the PM log.

## 9. Progress ledger

All entries start **Pending**. Replace status only when that part's checks have been performed; record the actual commit hash and evidence location.

| Part | Owner | Status | Actual commit | Evidence / notes |
|---|---|---|---|---|
| SB-01 | Anisha | Pending | — | — |
| SB-02 | Anisha | Pending | — | — |
| SB-03 | Anisha | Pending | — | — |
| SB-04 | Ishmum | Pending | — | — |
| SB-05 | Ishmum | Pending | — | — |
| SB-06 | Anisha leads; Ishmum contributes | Pending | — | — |

## 10. References checked for this plan

Official guidance checked 2026-10-28; recheck the pinned SDK/provider behavior during implementation. This plan's architecture and acceptance tests are engineering proposals, not provider guarantees.

- [Supabase API keys](https://supabase.com/docs/guides/api/api-keys)
- [Supabase JWT verification](https://supabase.com/docs/guides/auth/jwts)
- [JWT signing keys](https://supabase.com/docs/guides/auth/signing-keys)
- [User sessions](https://supabase.com/docs/guides/auth/sessions)
- [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Database connection methods](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Postgres roles](https://supabase.com/docs/guides/database/postgres/roles)
- [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
