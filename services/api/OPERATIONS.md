# API-10 operations and joint acceptance

Owner: Ishmum. Anisha owns Auth/project administration, sessions/onboarding and iOS.
API-01–09 producers are accepted locally. API-10's operational implementation is
ready; **full API-10, M1/M2 and Plan 03 acceptance remain open** until the actual
managed-user and mobile/device rows below have evidence.

## Start and check

Run from the repository root:

```sh
uv sync --project services/api --frozen
npm run check
npm run api:db:up
npm run api:db:test
npm run api:db:down
```

The required PostgreSQL group applies the real migration and fails if its explicit
disposable URL/marker is unavailable. It never needs hosted credentials or falls
back to the developer project. Down retains the labeled volume; reset is a separate
disposable-only action. No startup command runs migrations or fabricates identity.

Configure the backend's ignored services/api/.env using .env.example and the
existing public trust/runtime-role handoff. Ishmum keeps database credentials;
Anisha needs only the reachable API origin and her current access token.

```sh
CORS_ALLOWED_ORIGINS='["http://localhost:8081"]' npm run api:dev
```

This binds loopback:8000 with raw Uvicorn access logs disabled. A physical phone
cannot use the computer's loopback URL; use a separately reviewed reachable
trusted-development host or HTTPS deployment for actual native acceptance. Public
browser origins must be exact. CORS is browser enforcement, not API authorization;
requests without Origin still require a verified user token on private endpoints.

In a second terminal:

```sh
npm run api:acceptance -- --project eaisvwqfbgdkzdfmxkvm --base-url http://127.0.0.1:8000
```

This default performs only liveness, missing-credential, allowed/denied preflight,
CORS response-header and no-Origin HTTP checks. It neither reads token inputs nor
writes profiles. It labels actual browser/native/user journeys not run. The CLI
pins APP_ENV=development and the configured project; remote targets require HTTPS,
redirects/proxy inheritance are disabled, responses are bounded to 64 KiB, and
failures never print response bodies, identities, credentials or driver text.
HTTP client timeouts are per operation/inactivity, not a whole-run SLA.

## Get genuine user tokens

An access token is issued by Supabase Auth sign-in. Dashboard API keys and database
passwords are different credentials. The Dashboard's Authentication > Users page
lets you identify existing approved test accounts; it does not expose their
passwords. Use two distinct disposable email/password accounts with known passwords
or ask Anisha for tokens from her existing OAuth/OTP flow. Do not reset existing
accounts or change providers to finish this checklist.

On a new checkout, create services/api/.local/live-acceptance.env from
[the safe template](tools/live-acceptance.env.example) with mode 600. Keep any
existing private file. Populate API_ACCEPTANCE_PUBLISHABLE_KEY with the existing
**development publishable key** from project settings; no service/admin key is
needed. This checkout was configured through read-only MCP; the filled file stays
ignored. The helper also works with public trust settings and no database URL.

```sh
npm run api:acceptance:login -- --project eaisvwqfbgdkzdfmxkvm --account A
npm run api:acceptance:login -- --project eaisvwqfbgdkzdfmxkvm --account B
```

Run these in an interactive terminal. Email/password prompts are hidden and the
helper refuses nonterminal fallback. It performs one normal HTTPS password sign-in,
verifies the resulting JWT with the production project-pinned verifier, and writes
only the access token atomically with mode 600. Passwords, emails and refresh tokens
are not saved or printed. A normal Auth session is created by sign-in; this is a
one-off operator utility, not a second application session/refresh manager. Failed
sign-in is not retried or repaired automatically. Captcha, MFA or other provider
flows should use Anisha's existing client rather than weakening their settings.

Alternatively, after signing in through her actual client, Anisha can use
`supabase.auth.getSession()` and save `data.session.access_token` in the A/B fields.
Do not paste tokens into chat, commands, artifacts or Git. Tokens expire; repeat
sign-in manually when needed. This utility does not store a refresh session.
[Supabase sessions](https://supabase.com/docs/guides/auth/sessions),
[getSession](https://supabase.com/docs/reference/javascript/auth-getsession),
[password sign-in endpoint](https://supabase.github.io/auth/#post-token).

## Managed M1/M2 HTTP checks

Start the API as above, then run a read-only account journey first:

```sh
npm run api:acceptance -- --project eaisvwqfbgdkzdfmxkvm --base-url http://127.0.0.1:8000 --with-accounts
```

Both token slots are mandatory and locally verified against the pinned public
keys; equal subjects fail before any API mutation. Identity responses must match
the captured subjects. A/B profile reads, explicit absence and owner-query injection
are checked. Correlation/no-store/CORS exposure is checked on actual HTTP replies.
CLI output contains outcomes only, never emails, UUIDs, names or tokens.

For **approved disposable accounts only**, the requested API-10 write journey is:

```sh
npm run api:acceptance -- --project eaisvwqfbgdkzdfmxkvm --base-url http://127.0.0.1:8000 --write-profiles
```

This reads both profiles, creates/edits each with the actual revision, checks stale
replay conflict and the other account's unchanged row, clears the name, restores
the original name and refetches. It exercises signed browser-origin and no-Origin
HTTP paths. Original names are restored on success, but **revisions/timestamps
advance and newly created profile rows remain**; runtime DELETE is intentionally
unavailable. Nothing deletes Auth users or changes providers/redirects/keys.
An error stops without automatic replay or speculative rollback; a response may
have committed before a transport failure. Refetch privately and reconcile before
running more writes. The tool is not an account cleanup/lifecycle workflow.

## Diagnostics and readiness

Normal Uvicorn INFO configuration emits JSON records under
`uvicorn.error.disconnect`. Retain `--no-access-log`; raw access/debug SQL/client
logging can disclose URLs or parameters and is not required by these diagnostics.

- Request: generated request_id, one of the fixed endpoint labels (unknown becomes
  other), bounded method, actual status, monotonic duration_ms, completion and safe
  error_category. No caller-provided request ID is trusted. Cancelled/aborted or
  disconnected requests are explicit rather than invented HTTP successes.
- Dependency: that same request_id, fixed dependency and fixed outcome only. JWKS
  records cache hits, negative hits, suppression, fetch success/failure/cancellation
  and budget exhaustion; no kid, URL, JWT or claims are recorded.
- Database: pool_timeout, query_cancelled (including statement timers),
  lock_unavailable (including lock timers), connection_failure/disconnected or a
  safe query/integrity category. Authentication is identified only when explicit
  SQLSTATE is available. Libpq connection failures may omit SQLSTATE; never parse
  or log private driver messages to guess a more specific reason.

ContextVars correlate async verification and synchronous worker SQL without a
mutable global account. Context resets on normal, exceptional and cancellation
paths; engine/pool raw parameter logging remains disabled. These records contain
no bearer headers, account/session IDs, email, display name, request target/query,
body, SQL, password, key material or exception text. Duration measures observed
request processing/stream completion, not native enforcement or a network SLA.

`/healthz` is **process liveness only**. It works with Auth/DB disabled or down and
says nothing about signing-key freshness, database migrations/connectivity, mobile
session state or installed protection. There is no `/readyz` or background probe.
Use explicit bounded operator checks for individual dependencies. A profile 503
is not signed-out/absent/onboarded; identity can still be valid independently.
A deployment needs a separate reviewed readiness, connection-budget and recovery
plan; no production deployment or release readiness is established here.

## Evidence and remaining gates

| Layer | Current evidence | Remaining acceptance |
|---|---|---|
| Local backend | 473 deterministic tests; 104 real PostgreSQL checks including the operational journey, categorized failures and safe outage recovery probe | Hosted GitHub execution unverified |
| Actual process/network | Normal app.main startup, public and authenticated A/B loopback/CORS/no-Origin HTTP checks pass; profiles survive an actual process restart | Actual application/browser/native journeys remain separate |
| Hosted dependencies | Public ES256 key discovery, schema/security drift check and runtime-role TLS/READ COMMITTED/default deny pass | No user identity was exercised by these independent probes |
| Managed M1/M2 | Real privately supplied A/B tokens verified; identity, profile reads/writes/clear/conflicts/isolation/refetch/restart pass over HTTP | Actual Auth/mobile/root flows and coordinated managed cascade evidence |
| Browser | Actual Opera GX Fetch/CORS: allowed/denied origins, preflight, exposed correlation/no-store and safe 401/413/422 pass through native app control | Actual authenticated application/web session/profile flow remains open |
| Native | No-Origin HTTP protocol is checked | Actual development-client/signed-device session, storage, links, account changes/sign-out and profile journey |
| Onboarding | [Persistence contract review](../../docs/architecture/onboarding-persistence-review.md) prepared | Anisha/Ishmum review and PM/native prerequisites before a later schema/plan |

The live account check does not accept RN-07/Anisha's application integration,
physical-device behavior, sign-out cache cleanup or account deletion just because
HTTP passes. Record those independently with environment/date/platform, outcome
and responsible owner; never copy credentials or personal account payloads into
notes. Full API-10 stays open until the required joint rows are actually accepted.


Managed-account follow-up (2026-11-02): after both approved tokens were supplied,
read-only acceptance and explicit disposable writes passed through the normal API
process and hosted runtime DB role. Original names were restored; created profile
rows remain and revisions/update times advanced. A separate read-only check started
two genuine API processes sequentially and confirmed unchanged profiles after
restart. At that earlier checkpoint browser-connector inventory was empty; native app control later established actual browser protocol acceptance below. Tokens/personal payloads were
not copied into evidence; Auth users/settings/schema were untouched. See Plan 03
notes and artifacts/api-10/managed-acceptance.json. This supersedes the earlier
missing-token limitation, while full app/device/lifecycle gates remain open.


## Actual browser protocol reproduction

The [static operator probe](tools/browser/index.html) has **no real token input**,
loads no private files and performs no successful profile write. It is outside
mobile/production entry points and uses fixed loopback origins. In separate root
terminals, run:

```sh
CORS_ALLOWED_ORIGINS='["http://localhost:8081","http://127.0.0.1:8766"]' uv run --project services/api uvicorn app.main:app --app-dir services/api --host 127.0.0.1 --port 8765 --no-access-log
python3 -m http.server 8766 --bind 127.0.0.1 --directory services/api/tools/browser
python3 -m http.server 8767 --bind 127.0.0.1 --directory services/api/tools/browser
```

Open http://127.0.0.1:8766/?run=1 in a real browser. Its visible report must show
passed for missing/invalid credentials, GET/PATCH preflight and browser-readable
correlation/no-store on safe 401/422/413 responses. Then open port 8767 with the
same path; the real browser must reject the unapproved origin's preflight. The
probe first confirms API reachability with an unauthenticated opaque no-cors
health fetch, so an offline API cannot count as a passing denied-origin check.
That opaque response is not used to read private data or bypass CORS. Main checks
use ordinary CORS requests. Do not disable browser security or add wildcard CORS.

Actual Opera GX execution passed on 2026-11-02 using native CUA app controls,
despite browser-connector inventory being empty. The first probe draft incorrectly
combined no-cors with redirect:error and failed before network access; it was fixed
to use follow for the fixed unauthenticated health fetch. Fresh URL loading then
verified the current file. The CSP restricts connections to the one loopback API.
No credentials, personal payloads or browser settings were changed. Browser error
responses prove protocol enforcement, not authenticated SDK/application acceptance.
Stop only these task-owned servers after testing; leave user browser sessions alone.

## Auth-only and unavailable-database process checks

The new read-only outage mode requires two supplied verified tokens and is
mutually exclusive with --write-profiles:

```sh
npm run api:acceptance -- --project eaisvwqfbgdkzdfmxkvm --base-url http://127.0.0.1:8765 --expect-profile-unavailable
```

It requires both actual `/v1/me` identities to succeed while profile GET and PATCH
return retryable DEPENDENCY_UNAVAILABLE 503, for allowed browser-origin and
no-Origin HTTP paths. Null-profile success or an Auth outage fails this check.
PATCH uses an impossible positive revision rather than expected 0: if the DB
recovers between probes, it cannot create/update a row, and a 409 stops the check.
A real local PostgreSQL regression test exercises that recovery race.

To start the **existing runtime factory with the DB disabled**, without editing
services/api/.env, run from services/api in a separate terminal:

```sh
uv run python - <<'PYTHON'
import uvicorn
from app.core.config import Settings
from app.runtime import create_app
values = Settings().model_dump()
values.update(database_url=None, cors_allowed_origins=['http://localhost:8081'])
settings = Settings(_env_file=None, **values)
uvicorn.run(create_app(settings), host='127.0.0.1', port=8765, access_log=False)
PYTHON
```

Only this process has its DB disabled; production trust still verifies real tokens.
An unconfigured-shell check instead starts `create_app(Settings(_env_file=None))`:
health passes and opaque bearer requests safely return AUTH_UNAVAILABLE 503. There
is no fabricated identity. Normal complete configuration remains the standard
app.main entry point; keep unavailable checks away from write acceptance mode. The final configured-process
read-only A/B journey and valid-credential profile reads passed again after the
pooler cooldown, without changing the saved credentials.

Actual process checks passed for unconfigured shell, Auth-only with DB disabled,
and identity independence during a genuine connection failure. No production
configuration file was modified. **Do not induce failures on the shared pooler by
sending bad passwords.** That initial operator experiment opened Supavisor's
ECIRCUITBREAKER and temporarily blocked new connections from this origin; invalid
probes were stopped and existing valid credentials retained. Deliberate wrong-
password/outage fault tests belong on the guarded disposable database. An existing
outage can be checked with this mode without creating new bad-credential attempts.
For recovery, stop failing clients and permit the provider cooldown; do not reset
shared credentials, loosen TLS or loop on login failures. Supabase documents a
window up to two minutes, extended by further invalid attempts:
[Supavisor circuit breaker](https://supabase.com/kb/troubleshooting/supavisor-error-circuit-breaker-open-after-password-rotation).

Current evidence is in artifacts/api-10/browser-protocol.json and
platform-startup-verification.json with final pooler recovery status. Full API-10
remains open for joint authenticated application/root/RN-07, real native
client/device and coordinated managed account-cascade acceptance. Hosted GitHub
execution remains unverified; no push or deployment was requested. The independently
implementable backend Auth work is complete; Anisha's mobile Auth remains hers.
