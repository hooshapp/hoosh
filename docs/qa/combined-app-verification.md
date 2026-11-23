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
