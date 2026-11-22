# C04 verification — November 20, 2026

Implementation is connected. Physical acceptance is pending; activation remains
compiled off. Do not mark elapsed Screen Time behavior or C04 acceptance passed
from browser/model results.

## Figma plan screens

Open <http://127.0.0.1:8091/?view=plan> to review the actual onboarding plan
components with sample selections: suggestion, manual setup, preparation and
completion. This preview does not save account data or activate Screen Time.
See [the Figma review](plan_screen_figma_review.md) for implementation and checks.
The C04 review below is a developer validation aid, not the Figma plan screen.

## Check now in localhost

From the repository root, run `npm run mobile:ui` if the preview is not already
running, then open <http://127.0.0.1:8091/?review=c04>.

This dedicated browser-only review uses the app's plan validator, fields, buttons
and iOS status card. It does not log in, save account data, choose apps or install
native protection. It is separate from the normal app and release entry.

1. Confirm **iPhone testing pending** appears and Apply remains disabled.
2. Choose weekdays, enter `09:00`–`17:00`, `America/New_York`, 3 sessions and
   5 minutes. Select **Review plan**. Expect the reviewed values and **Nothing
   has been installed**. Edits must clear the prior review.
3. Enter 0 sessions or 0 minutes, or remove all days. Expect a validation message
   and disabled Review. Restore valid values and confirm Review works again.
4. Enter `22:00`–`07:00`. Review must remain disabled until **Ends the next day**
   is selected. Confirm the resulting review contains `next_day: true`.
5. Enter an unknown zone such as `Fake/Zone`, invalid time `25:00`, or letters in
   the numeric fields. Expect validation; restoring valid values clears it.
6. Keyboard-tab through fields and choices, scroll to the bottom, and check
   labels/errors/buttons remain reachable in your browser size.

Native quest Apply/cancel, recurrence, grants and recovery cannot execute in a
browser. Automated tests exercise those native/model boundaries separately. The
review page never supplies a fake installed state or simulated permission grant.

## Automated verification

- `npm run typecheck --workspace @disconnect/mobile`
- `npm run test:unit --workspace @disconnect/mobile`
- Focused native-owner, weekly journey, iOS setup and quest-panel component suites.
- `scripts/check-ios-adapter.sh BOOTED_SIMULATOR_UUID`: native compiler, commands,
  store/selection, owner isolation, transactions, grant recovery, expiry candidates,
  clock availability and real SDK/gate construction checks. No protection is enabled.
- Full simulator host/extension build. A build is not physical timing evidence.

## Deferred until a physical iPhone is available

Identify the build/bundle/data impact before installation: the shared host can
replace the Swift pilot because its bundle ID is retained. Do not install silently.

- Native picker Save vs Cancel; allow/deny/revoke authorization and access restore.
- Real short/long elapsed expiry while the target stays foreground; record requested
  deadline, callback time and observed shield time separately. Candidate alarms pad
  the OS interval to 15 minutes and ceil SDK endpoints by up to 999 ms, without
  changing exact private ledger deadlines. Callback delay remains unverified.
- Reentry without extending a running session; independent app sessions; overlapping
  weekly/quest reasons; weekly Stop leaves quests active and cancellation affects
  only its occurrence. Resume must be explicit after an account/device claim.
- Offline/host termination, lock/sleep, reboot, clock rollback/forward changes,
  saved-zone midnight, DST, travel and actual monitor capacity/partial failures.
- Pending request recovery, lost acknowledgment, account change and retained counts;
  reject unsupported boot-clock access rather than inventing a replacement clock.

C05 event attribution/reward measurements and C06 release acceptance remain separate.

## Recorded result for this checkpoint

TypeScript passed; 661 unit and 64 focused component tests passed. Native
model/store/command checks and real simulator SDK/gated bridge projection checks
passed. Full simulator host/extension build and browser preview build passed.
Focused changed-file lint passed; full lint had four existing unrelated warnings.
The live browser review passed valid review, zero-count rejection and overnight
validation. Physical permission prompts, actual shield delivery/expiry and signed
release acceptance are **not tested**.
