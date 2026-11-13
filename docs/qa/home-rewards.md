# RN09-D01 rewards acceptance

Read [policy and boundaries](../architecture/home-rewards.md), the original Plan04
and its latest implementation notes. D02 usage/savings and D03 recommendations are
separate features. Auth/onboarding/iOS remain Anisha's; further TalkBack work is
user-deferred. No managed account or hosted credential is needed for local checks.

Run `npm run check`, `npm run api:db:up`, `npm run api:db:test` and the existing JVM
engine runner with a populated Android JDK/Kotlin cache. The DB tool admits only
the explicitly marked PostgreSQL17 disposable loopback database. Never run its
migration suite concurrently with the manual quest-device fixture.

Acceptance covers real PostgreSQL row locks/RLS, normal verified ephemeral test
JWT HTTP, atomic/replayed Feed and receipt reads, account isolation, quest deletion
retaining earnings,0004→0005 backfill, privilege/schema drift rejection and own
Auth-cascade cleanup. Deterministic malformed-body checks run before database
acquisition. Shared transport tests check account fencing, content-free envelopes,
server ACKs and native ACK failure. Actual Home component tests cover original
artwork/verified metrics, no-funds/full-health controls, conflict, lost Feed
response, non-spending recovery, offline masking and account replacement.

Android's pure engine checks exercise real outbox/nudge/allowance logic. The
existing instrumentation runner also verifies actual AtomicFile roundtrips,
format1–3 migration, format4 corruptions, bounded business/diagnostic queues,
owner archives and ACK-prefix persistence. Build debug/test APKs and release native
Kotlin using the existing [native runbook](android-interventions.md); run the
`interventionChecks` probe on an authorized phone or the dedicated Android36 AVD.
No TalkBack session is required for this work.

For a manual shared Home journey, use the existing ignored/private quest device
fixture, normal API verifier and QA host described in [quest acceptance](quest-lifecycle.md).
Keep its ephemeral token out of chat/logs/screenshots. Only a synthetic native target
is selected. Check Home balance/Dino, explicit Feed, background/refetch, lost-response
receipt recovery, initial Return home, halfway Return home/Keep going, expiry Return
home and account-safe sync. A fixture cannot certify Anisha's managed Auth SDK,
iOS, signed builds or store approval. Restore any phone files/settings; stop owned
servers/emulator and clean the disposable fixture before stopping its database.

Current measured results and artifact paths belong to the latest Plan04 notes;
this runbook is not evidence that an unrun phone/platform case passed.

## Observed2026-11-13

Full workspace:547 portable,731 component(+2 existing skips),663 deterministic API;
255 real PostgreSQL, including four nested real-mobile-client TCP/restart tests.
Pure JVM101 and actual Android36 instrumentation124 pass, with real AtomicFile
format migration/corruption/archive checks; debug/test APKs and release Kotlin build.
Web isolation38files/71original SVGs and Android QA Hermes export pass. Export the
Android QA project from `apps/mobile/dev/profile` with `expo export --platform android`.

On the dedicated emulator, seeded50 test credits funded one real Feed (50→30,
health50→70). A real scheduled synthetic target pause and explicit Return home
then earned5: Home showed35 and native business pending0/next2/discarded0 while
the diagnostic quit remained. Intentionally losing the next Feed response still
charged only once (35→15,health70→90/happy artwork). Check last Feed recovered via
GET and removed the uncertain state. No full-day streak was fabricated.

The account fixture uses normal verified ephemeral local JWTs, not Anisha's Auth
SDK. No physical phone was detected. Instrumentation force-stop required emulator
service re-enable, matching the documented force-stop limitation; no crash-buffer
exception was present. UI Automation dumps can suppress service callbacks or expose
an underlying window rather than the modal; final native action checks used screen
captures/observed coordinates and persisted receipts, not dump-based assumptions.

Native file contents/modes, accessibility settings and task reverse mappings were
restored and verified; owned Metro/API fixture/AVD stopped, fixture users/manifest
removed. No SDK credentials or managed Auth data were changed. See
[sanitized evidence](../core_plan_implementation_notes/artifacts/rn-09-d01-rewards/evidence.json),
[native earning Home](../core_plan_implementation_notes/artifacts/rn-09-d01-rewards/home-native-credit.png)
and [reconciled Feed Home](../core_plan_implementation_notes/artifacts/rn-09-d01-rewards/home-feed-recovered.png).
The floating developer gear belongs to the QA host; these are actual product Home
components in that host, not signed app/root acceptance. Further TalkBack, managed
Auth/iOS and signed/wider-device acceptance remain separate. No live24hour/seven-day
soak is claimed by deterministic date-boundary tests.
