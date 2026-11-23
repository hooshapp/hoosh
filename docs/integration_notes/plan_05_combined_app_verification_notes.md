# Plan05 — Combined normal-app verification

## Current checkpoint — INT-VERIFY-C02, November22

- Branch `integration/shared-product`, parent `212d386`; owner committed the earlier
  C06/C01 checkpoint. This delta adds a test/evidence only; no production runtime,
  dependency, native or database change. User retains commit/push control.
- C01 readiness remains passed. **C02 automated slice passed; full C02 remains open**
  for real-account/provider/OS-storage acceptance. No phone operation or new login.
-119 portable/180 component checks (299total), mobile TypeScript and focused lint
  passed. The new real pinned SDK race test confirms local logout across in-flight
  refresh, server503 and a new-client restore, using synthetic fetch/storage.
- Existing normal routes, account providers, profile/quest mutation fences and
  storage adapters retain isolation under the tested delayed-response/session cases.
  Native permission and live Supabase provider acceptance are not inferred.
- Runtime source hashes match C01; no redundant package build/install or manual
  API/DB fixture mutation. The physical iPhone, original B session and compact
  simulator are untouched in this continuation. Native activation remains false.
- Next: C03 independent setup/profile/settings verification. Exact packaged private
  account/provider checks need owner interaction later; IOS-C06 native lifecycle
  and actual enforcement remain deferred. No whole-app or release acceptance.
- Intended files staged for owner review/commit; no commit/push performed.

## INT-VERIFY-C01 — Readiness and fixture inventory

Changed:
- `docs/integration_notes/artifacts/verify-c01-readiness.json`: source/runtime hashes,
  existing fixture inventory, current test/config/environment results, V01–V24 and
  safe cleanup state. No real identities/secrets.
- `docs/qa/combined-app-verification.md`: actual repeat commands, fixture/fault scopes,
  manual-vs-automated limits and active manual-DB protection rule.
- `docs/integration_plan/05_combined_app_verification.md`: C01 prepared/independent
  status and concrete QA/manifest links; C02–C06 acceptance stays open.
- `docs/qa/ios-c06-simulator.md` and Plan04 notes: owner-reported simulator intro pass
  and explicit physical-feel recheck, not real Screen Time acceptance.
- This notes file: current checkpoint, per-file record, evidence and next step.

Existing harness inventory includes normal-root integration, account/provider and
Auth/client recovery; guarded profile/settings/quest/rewards/History/recommendation
HTTP/PG suites; iOS product inspector/native runner; Android standalone/optimized
smoke, native instrumentation and pure-engine scripts. Existing QA runbooks and
core Plan03/04/source Auth handoffs were consulted. No new test dashboard or second
framework; historical reports are explicitly separated from current execution.

The118 current component tests mount normal production routes with synthetic SDK,
API and native ports. The88 unit cases do not use managed accounts. Those tests
accept fixture seams only, not real provider, secure-store, OS permission or native
intervention behavior. Existing fixture A/B have differing settings/credit data;
profile/quest distinctions remain in their existing guarded parent harnesses.
No DB suite rerun against the still-running manual API. Migration0007/287DB remains
previous C06 evidence, not a fresh count. Physical iPhone acceptance remains deferred.

Validation: both commands passed; public config guard passed; JSON/24-ID/status,
source-hash and path-reference checks plus Git whitespace checks passed. Local
logs/reports under `/tmp/hoosh-verify-c01-*`; committed manifest is redacted. All
intended files staged for owner review; no commit/push or remote branch operation.


## INT-VERIFY-C02 — Auth/isolation automated continuation

Changed:
- `apps/mobile/src/infrastructure/auth/sdk.test.ts` lines46–121: real pinned SDK
  refresh/logout/new-client restore regression, controlled HTTP and persistent
  in-memory adapter, cleanup in finally. No SDK/mock implementation replaces the
  actual library; no live URL/credentials or production behavior changed.
- `docs/integration_notes/artifacts/verify-c02-auth-isolation.json`: exact parent/
  test hash,299-case results, V01–V05/V16 evidence and pending live boundaries.
- C01 receipt: only a pointer to newer evidence; dated C01 outcomes preserved.
- `docs/qa/combined-app-verification.md`: repeat/evidence and remaining C02 scope.
- Plan05 C02 ledger and this checkpoint: independent pass vs full increment open.
- Plan01 Auth notes: source-owner verification supplement, not a new Auth feature.

119 unit cases:109 auth/link/session/storage/controller/recovery and10 identity
validation.180 component cases:134 root/provider/session/storage and46 profile/quest
consumer cases, each selected native renderer. All pass with TypeScript/focused
lint. New SDK race test passed without a production fix. Current commands/ignored
logs are in the receipt. Existing callback URL/state guards and identity gates
were not weakened. No runtime build needed: C01 runtime hashes still match.

Full C02 requires real SDK+verified backend identity and managed A/B/provider journeys;
controlled-fetch SDK tests are narrower evidence. No credential/session extraction,
hosted mutation, new account, database suite or physical device interaction. All
intended files staged; user commits/pushes.
