# Plan05 — Combined normal-app verification

## Current checkpoint — INT-VERIFY-C03, November22

- Branch `integration/shared-product`, parent `0a512e2`; owner committed C02.
  C03 changes only evidence/docs; no production source, dependency or schema change.
- **C03 independent slice passed:**228 component +68 portable +144 actual PG17/API
  tests =440. Existing mobile TCP settings parent also passed its7 write cases and
  1 new-client/API-process restart case; not counted twice. Full real managed-
  account/platform/native acceptance remains open, as do C02's live rows.
- Reused normal routes/fixtures and guarded profile/settings harnesses. Existing
  port55432 guard unchanged. Fresh separate PG17cluster ran only after owned manual
  API and original cluster paused; original storage was never the suite target.
- Test cluster stopped with0fixture Auth users. Original PG/API restored; all12
  public/Auth table content digests match before/after. Health200/private401 gates
  rechecked. Test env file/hosted DB/native accounts/phones/simulators unchanged.
- Manual/suggested setup, conflicts, lost replies, dirty navigation, local progress
  failures and account separation passed at current automated/UI or TCP/PG layers.
  Native ports are fixtures in routed tests; actual Screen Time remains deferred.
- Runtime hashes match C01; no new app build/install needed. Exact source, commands,
  environment, cleanup and remaining boundaries are in C03 receipt/runbook.
- Next: VERIFY-C04 integrated Android packaged journey. iPhone native lifecycle/
  ownership/enforcement and physical input stay in deferred IOS-C06/VERIFY-C05.
  No whole-app/release acceptance and no claim that every C02/C03 live row passed.
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


## INT-VERIFY-C03 — independent setup/profile/settings acceptance

Changed:
- `docs/integration_notes/artifacts/verify-c03-persistence.json`:440checks, exact
  parent, separate PG17isolation/restoration, current head0007, zero fixture users,
  V06–V09/V21 coverage and explicit live/native limits.
- `docs/qa/combined-app-verification.md`: current results, test-layer boundaries,
  reproduction prerequisites and strict manual-DB protection/restoration procedure.
- Plan05 C03 ledger and this notes file: current status/next integration, not full
  platform acceptance. Plan02 notes receive the setup-owner verification supplement.

No implementation defect was found; no production/test-source changes needed.
Reused profile reads/writes/isolation, settings storage/HTTP/restart and production
mobile-client TCP parent. Guard validates both URLs, reserved port/role/database,
marker and actual PG17 before schema/cleanup. Only a fresh cluster was the suite
subject. Original owned API/PG were temporarily paused and safely restored; whole
original table content digests match. Temporary cluster remains stopped; no Auth
fixture rows remain. Exact test command/paths/counts and private log locations in
receipt; no private values, tokens or DB URLs committed.

Current routed failures/recovery paths and TCP/PG writes/readbacks/restarts passed;
normal SDK/provider/fresh-account and OS/native touch acceptance is narrower/pending.
C01 runtime hashes, JSON/scope/count/fixture paths and Git whitespace checks passed.
Existing original API health/private401 gate checks passed after restoration.
All intended files staged; user commits/pushes. No source reset, hosted mutation,
physical device operation or native activation change.


## INT-VERIFY-C04 — November 22 packaged Android continuation

Independent packaging/public-UI slice passed; full C04 remains partial. See
[the sanitized receipt](../integration_notes/artifacts/verify-c04-android.json)
for exact parent, source/APK/mapping hashes and scope. Fixed the standalone filter
dropping reviewed Google/Apple switches, and changed Expo/Android display name to
Hoosh without changing package IDs or callback scheme. Rebuilt the final optimized
embedded-Hermes APK; eight config guards,117 pure JVM engine checks, six optimized
read-only native checks and mobile TypeScript passed. Local debug signing is
internal only; ZIP alignment does not certify a16KiB kernel or store release.

Fresh API37/Android17 emulator5560 showed the normal intro (five short swipes per
transition), signup validation/native keyboard, reachable login footer and enabled
Google/Apple actions on both forms. No credentials or provider consent were used.
At font scale2.0 provider actions remained reachable with scrolling. Signed-out
offline cold launch retained login without repeating intro. Font/network settings
were restored; no account, owner, native permission or protection rules changed.
An initial System UI stall resolved by choosing Wait; subsequent launches worked.

Temporary API-only `adb -s emulator-5560 reverse tcp:8000 tcp:8000` let the guest
browser display local `/healthz` success. Shell nc probes returned empty output
and were inconclusive. Reverse mappings were removed afterward; future local
signed-in API testing must deliberately restore this tunnel first. This does not
prove authenticated API operations, hosted availability or provider callbacks.
Emulator remains at Hoosh login. No Metro launch was required. Private screenshots,
AVD, APK, mapping and scratch scripts remain ignored, not staged.

Next: managed A/B normal-root permission/selection/Apply/intervention/expiry,
overlap/Stop and connected reward/recommendation/History journeys. Historical
synthetic lifecycle checks remain historical supporting evidence. Physical Android
and signed iPhone tests remain deferred; iOS activation stays gated. C04 is not
fully accepted, and this Android rebuild does not refresh iOS build evidence.
