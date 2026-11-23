# Combined app verification — INT-VERIFY-C01

Fixture/evidence readiness is prepared on `integration/shared-product` from
`ed263cc` plus the staged C06 intro repair. **Full app acceptance remains open.**
C01 can run independently of IOS-C06 physical acceptance under Plan05. It does not
complete VERIFY-C02–C06, either platform milestone or release readiness.

The machine-readable [V01–V24 manifest](../integration_notes/artifacts/verify-c01-readiness.json)
is the current scenario index. Each row records actual evidence separately from
what remains. `running` means partial evidence, not an accepted end-to-end journey.
`passed` at the increment level means readiness only; no entire mandatory journey
is promoted from an injected native callback. Existing source/QA reports retain
their historical build/scope and are not silently counted as current runs.

## Current independent results

-118 component cases:47 normal-root scenarios,9 account-provider cases and3 iOS
  setup presentations, each on iOS/Android Jest presets. These mount actual routes,
  SessionController, providers and screens, with synthetic SDK/API/native edges.
-88 portable cases across session/link controllers, account scope and API recovery.
  Delayed old-owner results, refresh/replacement, sign-out and recovery fencing
  remain automated evidence; tests cannot accept an OS permission or a provider.
- Public mobile config guard passed without values printed. Mobile project/API and
  backend project/issuer/audience/algorithm align with the existing development
  project; public JWKS fetched over verified HTTPS advertises ES256. This does not
  verify stored provider credentials or SMTP delivery.
- Local API health200; unauthenticated `/v1/me`,profile,settings401. API8000 and
  PG55432 listeners are loopback-only. Existing manual DB/API fixture was preserved.
  Its previous migration head0007/287DB report is historical, not a new DB-suite run.
- Compact simulator installed Hermes JS hash and runtime source hashes match the
  inspected current iOS receipt; version1.0.1/build6/minimum iOS16.4. Original B
  simulator still has the earlier layout package. No Android package rebuilt here.
- Owner reports introductory scrolling worked in Compact QA; physical feel remains
  a later check. This intro does not target another app or require Screen Time.

## Repeat the independent commands

From the repository root:

```sh
npm run test:components --workspace @disconnect/mobile -- normal-app-integration.test.tsx account-data-provider.test.tsx ios-device-setup.test.tsx
npm run test:unit --workspace @disconnect/mobile -- src/features/auth/session-controller.test.ts src/features/auth/link-controller.test.ts src/infrastructure/query/account-controller.test.ts src/infrastructure/api/client-recovery.test.ts
node scripts/android-standalone.mjs --check-config
```

The JSON/logs for this run are ignored/local:
`/tmp/hoosh-verify-c01-components.json`, `/tmp/hoosh-verify-c01-components.log`,
`/tmp/hoosh-verify-c01-unit.log`, `/tmp/hoosh-verify-c01-public-config.log`.
The committed manifest records sanitized results only. No passwords, tokens, real
UUIDs, emails, callback links, raw server bodies or database URLs belong in it.

## Reused fixtures and safe faults

Use the actual normal-root test fixture, not a new QA route or second runtime.
It supplies distinct synthetic A/B: saved versus missing settings and different
credit values. Existing `profile_accounts` supplies named versus null-name profile
controls; production-client settings/quest TCP tests supply distinct owner data and
own/foreign definitions. See fixture paths in the manifest. These generated test
identities are separate from privately supplied real Supabase accounts A/B.

The existing root/provider/controller tests hold promises before/after settings
writes, selection/Apply and account replacement. Delayed A results must not update
B. Reuse these injection points inside tests only; no public environment switch,
fixture signer, private account selector or native permission shortcut is added.
The inspected normal iOS package contains no known preview/pilot configuration.
The actual host's native activation gate remains compiled false.

Real managed A/B already have prior simulator sign-in/separation evidence in C06.
B writes/return-to-A and native rule ownership remain open. Credentials stay in
platform storage/private entry. Do not extract stored tokens to avoid a manual
login. If operator testing is later needed, the existing acceptance-login helper
requires privately entered approved credentials; it is not SDK/native acceptance.

## Database and cleanup boundary

**Do not run the schema/database suite against the current active manual fixture.**
The guarded suites may alter schema/data. Coordinate a deliberate stop of the
owned API and preserve manual A/B first, or use a separately prepared disposable
PG17 target admitted by the existing guard. Do not reset a hosted project or change
its schema. This C01 checkpoint neither runs migrations nor inserts/erases users.

Existing DB parents are `services/api/tests/db/test_mobile_settings_acceptance.py`,
`test_mobile_quests_acceptance.py`, `test_mobile_rewards_acceptance.py`,
`test_mobile_history_acceptance.py` and `test_mobile_recommendations_acceptance.py`.
Never invoke their private child Vitest files directly with live credentials.
Parents provide ephemeral local JWTs and remove only their generated rows/reports.
Their older passing results are supporting history, not refreshed C01 evidence.

Leave current manual API/DB and signed-in B intact. This run changed no accounts,
credentials, native permission, phone or installed rules. Remove only task-owned
scratch reports when no longer needed; never clear owner data or global stores.
Hosted disposable-C deletion, further TalkBack and wider product/store/OEM work
retain V22–V24 deferrals. Actual iPhone Screen Time requires the spare phone;
combined Android normal-account journey still needs its own exact-package run.

## Next integration work

VERIFY-C02/C03 can progress through existing automated Auth/setup seams and approved
simulator account journeys. Operator assistance is needed for actual credentials,
provider consent and email links; do independent tests before requesting it.
VERIFY-C04 is the integrated Android packaged journey. VERIFY-C05 remains gated by
physical IOS-C06; VERIFY-C06 records exact accepted scope and cannot claim both
platforms complete while mandatory native behavior remains unaccepted.


## VERIFY-C02 — current automated Auth/isolation continuation

Source parent `212d386`, test-only delta. [C02 receipt](../integration_notes/artifacts/verify-c02-auth-isolation.json)
records119 portable and180 component checks (299total), current commands and explicit
live boundaries. TypeScript and focused lint passed. No production runtime changed,
so its hashes still match C01 and no native rebuild/install was required.

The new SDK regression uses the actual pinned Supabase client with controlled fetch
and serialized in-memory storage. Refresh is held while local sign-out closes access;
its stale result is rejected, failed server logout still clears local credentials,
and a new SDK/controller on the same storage restores signed out. Deliberate login
continues to work. This is actual SDK behavior against synthetic HTTP, not hosted
sign-in, physical SecureStore or full process-death acceptance.

Existing normal routes/provider/session-boundary/native-storage tests and profile/
quest consumers were rerun. Late A profile/settings/quest/native results cannot
populate B at the tested seams; same-user new-session replacement clears drafts,
ordinary refresh retains the correct generation, and failed storage/recovery keeps
private access closed. Native modules/SDK responses remain fixture edges in these
component tests. No new production injection or permission bypass was added.

C02 stays partially verified. Still needed: exact packaged fresh-email confirmation/
recovery, enabled-provider consent/cancel/restart, private real-account B writes and
return-to-A, and actual unavailable/locked storage/background/upgrade behavior.
Phone-only native owner/rule enforcement stays deferred with IOS-C06. Prior real
simulator journeys remain supporting evidence; the new tests do not upgrade them
into a full current-build provider/OS pass. C03 independent setup/persistence checks
can proceed without manufacturing any of those successes.


## VERIFY-C03 — independent setup/persistence continuation

Parent `0a512e2`; no production changes. [C03 receipt](../integration_notes/artifacts/verify-c03-persistence.json)
records228 component,68 portable and144 actual PostgreSQL/API tests (440total).
The existing production mobile-client settings harness runs7 write/validation/
isolation cases and1 fresh-client/process restart case inside its passing pytest
parent; those nested cases are not added again to the144count.

Routed tests mount actual setup/profile/settings screens with synthetic SDK/API/
native edges. Both suggested/manual paths, reviewed canonical settings, conflict
Keep edits/Use latest, dirty exit, dropped reply readback, missing/pending progress,
failed final local receipt and account replacement pass. Failed receipt retry does
not repeat the API PATCH, native selection Save or Apply. Profile/settings native
renderer and real TCP/PG tests are distinct evidence layers, not one fully hosted
SDK/touch journey. Supported v1 progress reload and incompatible/corrupt recovery
pass; no automatic arbitrary legacy/project/account import was added.

### Separate PG17 run and restoration

The existing test guard fixes loopback port55432/database/roles/marker/major17.
**That guard was not changed.** A fresh cluster `pg17-verify-c03` was initialized
using the already-installed local PG17toolchain and existing fixture bootstrap,
roles and runtime SQL. The owned manual uvicorn/API was stopped, original manual
cluster `pg17-c06` content was digested and that cluster was stopped without edits.
Only then did the separate cluster bind55432. Test env overrides were process-local;
`services/api/tests/.env` and managed configuration were not modified.

Existing pytest parents ran against the new guarded cluster, with normal ephemeral
JWT verification, actual loopback HTTP and production portable mobile client. They
verified profile/settings RLS/ownership, revisions, section replace/omit/null,
Unicode, deliberate conflict retry, transaction failure and lost committed reply,
plus actual API/client process restart/readback. Temporary head was0007 and no
fixture Auth users remained. Test-only local Auth rows are not managed accounts.

Temporary PG stopped after the tests. Original PG and API restarted with their
original cluster/config. Before/after digests match for all12 original public/Auth
tables. Health200 and unauthenticated private401 gates pass after restoration.
Manual simulator A/B data was preserved; no raw account rows/identities are committed.
Only private scratch logs/report/digests remain ignored. No native permission,
phone, hosted project, real Auth account or app installation changed.

To reproduce on an appropriately isolated disposable target, use the seven pytest
file paths from the receipt with `-o addopts= -m database -q`. Do not aim those tests
at the currently restored manual fixture. On this Mac, a new run needs a reviewed
fresh cluster path and the same owned-service pause/restore sequence; the private
one-shot helper refuses reuse of an existing cluster. On Docker-equipped systems,
the existing named disposable fixture commands remain the supported alternative.
Never weaken the guard or run schema suites concurrently with manual API activity.

C03 remains partial for full managed-account/platform acceptance. Native iPhone
picker/permissions/Apply, real OS interruptions and full physical input/accessibility
still belong to IOS-C06/VERIFY-C05; exact Android journey belongs to VERIFY-C04.
Prior one-account real simulator save/relaunch remains valid supporting evidence,
not completion of every fresh managed-account signup/setup combination. The source
runtime hashes still match C01, so no redundant native rebuild was required.


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


## VERIFY-C04 normal Android continuation — November22–23

Parent `5fe021a`. The normal release root was used with owner-entered real
Supabase sign-in and the isolated local PG17/API via explicit emulator-only
port8000 reverse. No SDK/session injection, native rule initializer or hosted
mutation. The only runtime changes are Hoosh branding in the native disclosure,
service and pause (three Kotlin/resource files); package IDs/consent version and
native policy/storage remain unchanged. Rebuilt APK and source hashes are in
`../integration_notes/artifacts/verify-c04-normal-android.json`. Six optimized
read-only cases and117 pure JVM cases passed on that artifact/source.

Focused existing tests also passed:124 component cases in20 suites (ten files,
each Android/iOS renderer) and139 portable cases in eight files. See
`../integration_notes/artifacts/verify-c04-connected-checks.json`. They cover
controlled account/permission/status fences, Apply/Stop, quest/recommendation,
reward/Feed and qualified History recovery. Native/API ports are controlled there;
one selected selection-lifecycle file is explicitly a development component.
These results are not relabeled as live OS/HTTP acceptance.

Normal-route observations: picker Save retained only the separate synthetic test
app; Not now left access missing; disclosure → Android Settings → grant worked.
Initial plan PATCH403 correctly rejected a missing local Auth FK prerequisite.
After normal setup created its progress key, key names only supplied the approved
UUID for one local ID-only Auth reference after PG17/test marker/head guards. No
credential/session value or questionnaire contents were extracted. Normal Save
then succeeded; Preview left native installation unchanged and explicit Apply
confirmed active weekly protection. Real target entry paused, Return home worked
and Open anyway created an allowance. Offline process SIGKILL/reentry preserved
exact deadline/count/revision. Cold emulator restart retained native installation
and real session; System UI's startup stall required Wait. Installed hours ended
as scheduled, so readback correctly changed to scheduled. Settings edits saved
without automatically applying them; explicit Apply installed the reviewed change.

The original five-minute uninterrupted expiry observation was interrupted by
emulator shutdown and remains unaccepted. A later one-minute run crossed the
23:59 schedule end/real midnight and is boundary evidence, not isolated expiry.
The new day's first allowance correctly counted1. Follow the final receipt for
the subsequent within-window expiry result and remaining steps. No device clock
was changed. Physical Android/OEM/iPhone checks remain owner-deferred.

Second-account continuation: normal Settings confirmed a different identity and
own cloud preferences. A revision6 stayed unchanged until explicit claim; cancel
kept it, confirm archived/stopped A revision7 with daily/session history retained.
B had no inherited app selection, installed plan, quests or History receipts.
Target opened without pause after claim. B profile save and sign-out passed.
Return-to-A restoration and remaining concurrent two-quest live checks are pending.
See the updated normal Android receipt; no physical-device acceptance is inferred.

Return-A update: own cloud identity/draft/quest and wallet55/health70 restored;
login did not activate. Apply exposed an empty-active-slot/archive allowance reset
after B claim without installation. Owner-aware reads now require explicit claim
for archived accounts before Apply. Android146 controller/persistence cases passed
including the actual AtomicFile regression; pure JVM117 passed. New APK/UI roundtrip
is still required. Old APK normal observations remain historical evidence only.

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
