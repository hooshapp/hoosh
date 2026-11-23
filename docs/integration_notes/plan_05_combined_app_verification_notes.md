# Plan05 — Combined normal-app verification

## Current checkpoint — INT-VERIFY-C06 handoff, November23

- Owner/reviewer: Anisha / Ishmum. Branch `integration/shared-product`; verified
  source `6bf8b299e6970891c211fe019ff501dd2408f608` (owner committed C04).
- C04 core emulator journey passed including corrected real A/B/no-install/A return;
  C05 physical signed iPhone explicitly deferred. Overall integration remains partial.
- Final local/CI results, V01–V24 limitations, rollback and reproduction are in
  [handoff](../qa/integration-handoff.md) and [receipt](artifacts/verify-c06-handoff.json).
- No runtime changes in C06; historical source provenance from integration index
  retained. No fresh iOS product build claimed: native source unchanged since prior
  signed packaging, current SDK/model probes passed, physical enforcement unverified.
- API8000 and manual PG17/55432 restored with identical data digests; disposable
  test cluster stopped. Emulator QA account/rules retained; font/network defaults.
- Next: owner commits/pushes C06, verify that documentation head CI; arrange signed
  spare iPhone C05, Android physical/OEM/accessibility and remaining packaged Auth
  cases before their respective acceptance/release claims. No merge/deploy authorized.

## Historical checkpoint — INT-VERIFY-C04 continuation, November22

- Parent `5fe021a`; owner committed the initial C04 packaging slice. Physical
  Android/iPhone acceptance is explicitly deferred by the owner.
- Current focused connected regression pass:124 component cases across Android
  and iOS renderers,139 portable API/adapter cases; receipt
  `artifacts/verify-c04-connected-checks.json`. Controlled ports are not native proof.
- Fixed remaining native user-facing Disconnect branding in disclosure, History
  disclosure, service label and overlay/pane/window title. Identifiers, permissions,
  consent version and native policy/storage formats remain unchanged.
- Exact rebuilt internal APK passed six optimized read-only native checks and117
  pure JVM cases. First JVM invocation lacked GRADLE_USER_HOME and refused before
  compilation; rerun with the existing local toolchain passed.
- Owner signed in privately on emulator5560. Normal picker saved only the separate
  test target. Not-now disclosure preserved missing access; normal disclosure and
  Android Settings grant succeeded. No initializer seeded native rules/consent.
- Initial settings PATCH403 exposed missing local Auth FK prerequisite, not a
  hosted sign-in failure. Normal setup created the account-scoped progress key.
  Queried only SQLite key names (no values/secure session), checked local PG17,
  test database/marker/head0007 and inserted one ID-only Auth reference locally.
  Normal account Save then succeeded. No hosted Auth/schema/security change.
- Normal plan Preview left installation unchanged; explicit Apply confirmed active
  weekly protection. Target entry showed actual Hoosh pause. Return home and Open
  anyway worked; five-minute allowance/count1 survived offline native process kill
  and target reentry with unchanged deadlines. Within-window one-minute halfway/Keep-going/expiry passed after separately
  recording interrupted and midnight-boundary runs. Full C04 remains partial.
- Private artifacts and local Auth prerequisite are retained for manual QA; no
  token/password was extracted, no phone accessed, no commit/push performed.

## Historical checkpoint — INT-VERIFY-C03, November22

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


### C04 actual normal-root continuation, November23

Final APK `817db3d...49183d`, exact hashes in normal receipt. Normal account
Save/Apply/pause and one-minute in-window expiry passed, with no clock edits.
A separate five-minute interrupted run and23:59/midnight run are not isolated
expiry passes. Midnight daily count correctly reset. Controlled117 engine/124
component/139 portable cases and six exact-APK read-only native cases passed.

Connected native reward sync acknowledged its outbox; wallet25, one Feed20
produced balance5/health70 and refresh retained those values. Recommendation
Accept saved a quest and cooldown, with no award on acceptance. Future scheduled
one-minute quest installed alongside weekly; actual pause showed two reasons.
Weekly Stop revision4 retained the quest; its window ended before a subsequent
target observation, so quest-only live pause after Stop is not claimed. Synthetic
self-report confirmation earned exactly one completion/50 credits and removed
the confirmation action. Confirmed quest Stop removed its native rule only.
Stale weekly resume failed closed, explicit Refresh then Resume restored revision6.
Logout removed private screens while revision6/week/session history persisted.

Normal Usage Access grant plus History disclosure/Start produced0/7 baseline
days with unavailable comparisons; no fabricated seven-day measurements.
Second-account identity and explicit claim now passed on emulator5560. B had its
own cloud preferences, no saved quests or A History receipts. Before claim, A
revision6 remained unchanged; cancelling preserved it. Confirming archived/stopped
A at revision7 with daily count1/session retained, left B with no selected apps or
installed weekly plan, and target opened without a pause. B profile save succeeded;
sign-out hid private screens. Initial selection/schedule errors were the expected
cross-owner gate and cleared after explicit claim. Return to A and the two-quest
concurrent live matrix remain open. Emulator is at login awaiting A; no rules
resume automatically. API8000
reverse is present; network/font defaults restored, Usage/Accessibility enabled.
No physical phone, Metro, remote backend, schema migration or hosted Auth change.
Raw screenshots/private identifiers/scratch scripts remain ignored.

### C04 return-account regression

Normal return to A restored its own identity, saved all-seven-day/00:00–23:59/
one-minute draft and saved quest, wallet55/health70; B profile name did not leak.
Login did not reactivate protection. A subsequent explicit Apply exposed an
archive gap: when B had claimed without installing, the empty active slot was
treated as new and reset active allowance counters. A stopped revision7 archive
remained intact. Fixed owner-aware reads to require explicit restoration before
Apply when that account has archived history. Service reads remain non-mutating.
Android controller/persistence146 passed, including actual AtomicFile coverage of
this exact no-B-install path, rejected A read/Apply, explicit restore preserving
daily/session history, and no automatic activation. Pure JVM117 passed. Rebuilt
normal roundtrip and concurrent live matrix remain pending; no completion claim.

Corrected standalone APK `f11a8dd...867d53` built and installed; exact APK/mapping
and source hashes are in the normal receipt regression section. Six optimized
read-only checks passed; normal signed-in A Home loaded with wallet55/health70
and cooldown intact. API-only8000 reverse restored; no Metro. A new manual A/B
roundtrip on this artifact remains pending, alongside the concurrent quest matrix.


### Corrected APK live matrix — November23

On corrected standalone `f11a8dd...867d53`, normal production UI installed two
07:05–08:00 quests alongside the weekly plan (revision4). Offline elapsed expiry
with the separate target open showed three pause reasons. Weekly Stop left two
quest reasons (revision5); stopping one quest left one (revision6); stopping the
last removed the pause (revision7). Daily count2 stayed unchanged. Explicit weekly
Resume restored revision8 with that count and no quests. Permission revoke/Deny/
Allow recovery and 1.5 font-scale profile keyboard/Discard were exercised; draft
was discarded and font1.0/network restored. First interrupted allowance is not an
isolated expiry pass; the second actual elapsed expiry is. Software graphics
restart preserved app data. Normal-root controlled component checks:94 passed.
Rebuilt real-account roundtrip still needs private A/B login; physical checks
remain deferred. Exact source/build and limits are in the normal journey receipt.


### Final rebuilt account roundtrip — November23

Corrected APK normal A→B(no installation)→A roundtrip passed. Distinct B profile,
preferences and zero-credit wallet stayed separate. Explicit B claim archived
stopped A revision9/count2/session1; B installed no rules and target was unpaused.
Returning A restored Home75/health70 and its own blank profile. Normal owner gate
required explicit claim: stopped revision10 retained count2 and exact session
deadline; explicit Resume revision11 preserved both and target pause returned.
A deliberate subsequent Open anyway created count3 with exhausted=true: voluntary
override remains possible by design; this is not a hard blocking-cap claim.

Core packaged Android emulator journey is accepted within the local API/internal
signing scope. Physical/OEM/TalkBack and field distribution stay deferred. Installed
Android provider consent/callbacks were not repeated; prior auth evidence does not
claim that platform-specific run. Earlier pending roundtrip/live-matrix statements
above describe historical checkpoints and are superseded by these final results.


## INT-VERIFY-C06 — Exact-source checks and scoped handoff

Date: 2026-11-23. Owner / reviewer: Anisha / Ishmum. Branch: `integration/shared-product`.
Commit message: `INT-VERIFY-C06: record final checks and integration handoff`.
Commit: Pending. Source: `6bf8b29`; existing integration index preserves both parent
source SHAs. Plan: [C06](../integration_plan/05_combined_app_verification.md#int-verify-c06--exact-head-checks-readiness-report-and-maintainable-handoff).

### Changes

| File | Change and reason |
|---|---|
| `docs/qa/integration-handoff.md` (entire new file) | Exact-source results, V01–V24 evidence/remaining owners, reproducibility, privacy and rollback; no false both-platform completion. |
| `docs/integration_notes/artifacts/verify-c06-handoff.json` (entire new file) | Sanitized result counts, log digests, exact CI SHA/job results and known environment limitations. |
| `docs/integration_plan/05_combined_app_verification.md` (commit ledger) | C05 owner-deferred and C06 scoped reporting recorded without closing physical/release gates. |
| `docs/integration_plan/README.md` (opening checkpoint) | Route readers directly to current handoff instead of old foundation-start instruction. |
| `docs/integration_notes/plan_05_combined_app_verification_notes.md` (opening checkpoint and this entry) | Current state and next actions; former checkpoint explicitly historical. |
| `docs/core_plan_implementation_notes/plan_01_supabase_foundation_notes.md` (opening cross-plan pointer) | Link current isolated DB/real-account evidence; keep SB-06 hosted deletion and platform gates open. |
| `docs/core_plan_implementation_notes/plan_02_auth_onboarding_notes.md` (opening cross-plan pointer) | Link current Auth/persistence/account integration; do not bulk-complete original AUTH IDs. |

### Validation and handoff

663 portable /967 component (two conditional skips),682 deterministic API,287 real
isolated PG17 tests passed; mobile types/lint/assets/eight packaging guards, UI/web
builds, API contracts, iOS SDK/model gates and seven inspector cases passed. Four
ESLint warnings retained. `npm run check` itself exited127 at missing `uv`; remaining
exact configured checks passed via existing venv. Actual GitHub Foundation mobile/
API/database jobs passed on 6bf8b29. Current documentation commit CI must be checked
once owner pushes. No runtime/schema/signing/provider changes, phone work or secrets
introduced. DB original data and API restoration verified. C05 and remaining matrix
rows stay as listed in handoff; rollback is a tested forward fix, not silent store reset.
