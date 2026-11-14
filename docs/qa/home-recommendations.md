# Home recommendations acceptance — RN09-D03

Read the [policy](../architecture/home-recommendations.md), original Plan04 and its
latest implementation notes. This is the TSD's transparent activity-template
fallback. Generated AI/provider/input/budget/evaluation, Anisha's Auth/iOS, further
user-deferred TalkBack and signed/store acceptance remain separate.

## Reproduce automated checks

Run `npm run check`, then the guarded `npm run api:db:up` and
`npm run api:db:test`. Only the marked PostgreSQL17 loopback database is admitted.
Never run its migration suite while the manual quest-device fixture exists.

Deterministic API/domain checks cover strict body/extra fields, JSON size/duplicates,
auth-before-DB and actual saved-zone midnight/gap/fold future times.
Proposal duration matches real elapsed minutes across DST; the existing edited
quest schedule semantics remain unchanged. Real PG checks
cover nonmutating offers, saved-interest/generic behavior, expiry/preferences,
cooldown, no early schedule/credit, atomic creation/rollback, same/opposite replay,
deleted-ID fencing, own-account isolation, identical/opposite first-request races,
exact security/schema drift,0006 preservation and disposable-only Auth cascade.
Accepted definitions exercise the existing schedule/end/self-report50once ledger.

`test_mobile_recommendations_acceptance.py` runs five nested production-client tests
against real TCP FastAPI, its normal ephemeral-JWKS verifier and PostgreSQL, including
actual API-process restart. It checks Accept/replay/one-time quest/no initial reward,
lost committed Skip/readback, opposite/foreign decisions and A/B/C isolation. Private
tokens/reports never enter stdout or Git. No managed Auth setup is substituted.

Portable decoding tests validate own identity, policy/source/state, expiry, duration,
reward and nullable deleted targets. Actual Home component tests exercise template
copy, Accept navigation, Skip, uncertain-write readback, offline/expired actions,
account replacement, deleted-target acknowledgment and leaving Home while Accept
is pending. A late response cannot navigate from an unmounted Home, while canonical
account cache/quest-list invalidation remains safe. Existing Home reward/history/
settings tests remain required.

Run `npm run mobile:export` for production export/isolation/original assets. Export
the QA Android host separately with `expo export --platform android` from
`apps/mobile/dev/profile`. Compilation is not native runtime or signed acceptance.
No native source or SDK/package dependency is changed by this feature.

## Android journey

Use the ignored/private local quest-device fixture and QA host in
[quest acceptance](quest-lifecycle.md). Keep test tokens private and enable real
native account ownership only through explicit controls. Save only the synthetic
test target; never select a personal app for this bounded test. Back up original
native files/settings/reverse mappings first; do not include SDK credentials.

1. Open live Home. Check the real interest/generic template, completion-only50notice
   and Accept/Skip. There must be no claimed usage pattern, AI generation or free time.
2. Accept. Verify the existing quest editor opens with `Does not repeat`, the intended
   duration and visible saved zone. API state must show one accepted recommendation
   definition, no schedule enabled and no reward. The existing manual fixture also
   seeds an unrelated quest; compare accepted ID/count delta, not total count1.
3. Review a valid future time/date. If setup takes longer than the proposed start,
   move the time forward. With explicit device claim, disclosure/access, saved
   synthetic selection and session policy, schedule/apply through the real editor.
   Confirm account and native acknowledgments separately.
4. Open only the synthetic target during the installed interval. Observe the actual
   native pause. Avoid UI Automation dumps during intervention callbacks: they can
   disconnect/suppress accessibility events. Use a scoped capture/native readback.
   Mere pause display is not completion or50credit evidence.
5. Return to the host and confirm Stop. Check local/account stopped state, then open
   the target again: it should be unpaused. Verify no early completion reward.
6. Cold-restart the host, reconnect the same isolated account and reopen Home.
   Accepted receipt/review target must persist without another Accept or auto-resume.
7. Use a second isolated account: Skip, check receipt/cooldown and no new quest/reward,
   then cold-restart/reconnect and verify Skip persists. Never claim the first
   account's native state for the second account automatically.
8. Restore original native file contents/modes, accessibility and usage settings,
   reverse mappings and owned temporary files. Stop owned Metro/API/emulator; let
   the fixture remove only its own users/manifest, then stop the disposable DB with
   its labeled volume retained. No hosted account deletion or Auth administration.

Record actual results/screenshots in the latest Plan04 notes and
[sanitized evidence](../core_plan_implementation_notes/artifacts/rn-09-recommendations/evidence.json).
The floating gear belongs to the QA host. This bounded journey does not establish
full20minute/task-completion soak, managed SDK login, full combined physical/native
matrices, iOS, signed
store builds or TalkBack. Actual completion50once is separately exercised against
the real database/ledger at an advanced test time, not fabricated as device usage.


## Observed2026-11-14

Final workspace checks pass553portable,773component(+2existing skips),682API;
287actualPG, including16 recommendation DB cases and five nested mobile TCP/
API-process-restart cases. Production web isolation38files/original SVG71 and QA
Android Hermes export pass. Four pre-existing mobile lint warnings remain; zero
errors. No new native build/instrumentation count is claimed: the existing debug
APK/native interfaces are reused without native source changes.

On the dedicated Android36 emulator, actual Home Accept opened a non-repeating
20minute quest, with schedule off and balance0. After explicit claim/disclosure/
synthetic-app selection, the accepted quest was retimed forward through the verified
API because setup outlasted its first proposed start (duration20 kept). Actual
editor first-date/Schedule/Apply acknowledged installation; the synthetic target
showed the real native pause. Confirmed Stop released it, disabled the account
schedule and retained balance0. Accept/review and second-account Skip survived
cold host restarts. The fixture pre-seeds one unrelated quest per account: accepted
recommendation appeared exactly once in addition to that seed; Skip added none.

On physical Pixel8Pro/API36, the same current shared UI showed the offer, accepted
once into the non-repeating editor, kept schedule off/balance0, then switched to a
second isolated account and saved Skip without an A review target or new quest.
No physical accessibility permission/claim/protection was enabled. TalkBack stayed
off. The first phone attempt preceded ready controls; it was retried only after the
actual QA field existed, not treated as a product failure or successful connection.

Emulator and phone native file/path contents/modes, accessibility/usage settings,
reverse mappings and the phone's temporary USB stay-awake setting are restored and
verified. One phone archive verification returned invalid USB output; it was not
accepted as a pass. A fresh scoped read verified files/directories/modes, then
remaining owned reverse mappings were restored and reverified. SDK credentials
were excluded. Both fixture runs cleaned their own users/manifest and servers;
the owned emulator stopped and disposable DB stopped with labeled volume retained.

Development0006→0007 preserved count/content digests for all nine prior product
tables. Exact Alembic no-drift/RLS/ACL/constraints and runtime TLS/nonmutating own
generic read pass. No hosted Auth/user/provider/deletion/credential operation.
See the [phone offer](../core_plan_implementation_notes/artifacts/rn-09-recommendations/phone-offer.png)
and [native emulator pause](../core_plan_implementation_notes/artifacts/rn-09-recommendations/emulator-native-pause.png).
