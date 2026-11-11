# Native UI QA in Expo Go

This separate developer project renders the actual shared components with explicitly
labeled local examples. Ishmum owns the Android run; Anisha can reuse it for shared
iOS presentation checks. It does not import Expo Router, Auth, API clients or native
production protection adapters. Ordinary app exports must never include this directory or
`dev/shared/ui-samples.ts`.

## Open on the phone

From the repository root, after the normal root `npm ci`:

```sh
npm run mobile:qa:android
```

Connect the Mac and phone to the same trusted Wi-Fi and scan the terminal QR in
an Expo Go version supporting this project's SDK 58. Metro uses port 8090. The
project is named **Disconnect UI QA**. Do not install dependencies in this nested
project, add another lockfile, or run prebuild over the existing iOS application.
If Metro reports an incompatible Expo Go runtime, resolve that compatibility
before interpreting a failure as an app regression.

For USB automation, enable Developer options and USB debugging and accept the
computer's debugging prompt. Verify an authorized device with `adb devices -l`.
If LAN access is unavailable, `adb reverse tcp:8090 tcp:8090` allows opening
`exp://127.0.0.1:8090` in Expo Go on the connected Android phone.
Do not record device serials, account tokens, email addresses or personal screens.

Use **Screens** to choose among 23 pages (19 source examples plus four native diagnostics), **State** to cycle Ready, Loading, Error,
Unavailable, Busy and Long text, and **Reset** to restore the local draft. State
changes also reset drafts. Not every component has a distinct presentation for
all six states; editor Loading uses unavailable and a missing monthly series
stays unavailable. For ordinary UI examples, saving/accept/feed/retry callbacks only produce an explicit
UI-intent notice. Native diagnostics have the explicit real local effects documented below. No UI sample becomes a saved plan, earned reward, installed app or
measured usage. The footer is QA chrome, not the actual navigation bar. Its Screens
and Reset controls intentionally bypass draft retention for test setup.

Examples shared with the web specimen live in `../shared/ui-samples.ts` so the two
previews do not drift. Feature controllers still own real wire schemas and saves.
The asset inventory uses original root dimensions, with horizontal scrolling for
wide assets instead of resizing them. Literal source emoji remain text.

## Android acceptance run

Record date, device model, OS, Expo Go/build version, font scale, steps, observed
result and a cropped app screenshot for each failure. Mark skipped checks as
pending. Record fixes and rerun affected flows in the Plan 04 notes. Restore any
system font/display settings to their original values after the run.

1. Inspect Home, Quests, History, Settings and all editors/details in Ready and
   available failure/busy states. Verify original SVGs and Dino expressions load.
2. At the phone's normal and enlarged font/display settings, inspect long labels,
   scroll to the final action and verify no overlap with system bars or QA footer.
   Include Activities search/custom input, quest times/duration and profile input.
3. Open the software keyboard, reach the final form action and dismiss it. Open
   dirty-exit and quest cancellation prompts: safe action receives focus, Android
   Back keeps the draft, explicit discard exits, and busy actions cannot repeat.
4. With TalkBack, inspect traversal, selected/check states, errors, availability
   messages and modal focus/return. Speech must be observed on the device; mocked
   accessibility calls and DOM labels are not speech evidence.
5. Return to Home after background/foreground, loss/restoration of connectivity
   and a fresh launch. Local QA drafts may reset on remount; no persistence or
   protection behavior is claimed. Do not run destructive memory/permission tests
   against the released app.

## Actual app navigation is a separate run

Start the ordinary shell from the repository root:

```sh
npm run mobile -- --go --lan --port 8081
```

Open its different QR/project in Expo Go. Test all four tabs, selected labels,
scroll-to-bottom clearance, detail navigation, dirty quest exits via header Back
and Android hardware Back, and safe unavailable states. This real Router run is
required: the QA project's component Back buttons do not prove hardware route
removal, deep links or tab behavior. The actual app intentionally has unavailable
live values; populated examples exist only in the separate QA project.

Expo Go can establish shared UI observations. A signed development/release build
and actual adapters are still needed for native protection, permissions, process
restoration and integration acceptance. Do not mark RN10-D01/D02/D06 complete from
a successful bundle request, browser screenshot or component test.

## Current evidence

RN-10b recorded compile-only results before a phone was connected. RN-10c now
records actual Pixel 8 Pro / Android 16 / Expo Go 58.0.5 observations at system
font scales 1.15 and 2.0. See [the current QA record](../../../../docs/qa/mobile-accessibility.md)
and [physical-run evidence](../../../../docs/core_plan_implementation_notes/artifacts/rn-10c/README.md)
for the exact passed cases, discovered issues and remaining acceptance. Compilation
is still separate from device execution; Expo Go is not a signed standalone build.

When switching between the QA project and the ordinary Router project, close the
previous Expo Go experience first. In this run, a stale HMR connection registered
the Router entry against the nested QA server and stopped Metro; restart Metro and
reopen the intended project if this occurs. It is a development-server failure, not
a successful app lifecycle result. Do not inspect screenshots while the device is
locked or another app is foreground; ask the owner to unlock before continuing.


### RN-10d development-host follow-up

The 2026-11-07 Pixel run used the existing Android development build and current
JavaScript, including the real Router separately from this sample project. See
[RN-10d reproduction/evidence](../../../../docs/core_plan_implementation_notes/artifacts/rn-10d/README.md).
Days checked speech/focus and Profile error/busy controls are sample evidence only.
Do not run `uiautomator dump` while TalkBack is active; it disturbed assistive focus.
Use screenshots/direct input for speech, and hierarchy automation only with the
service off. Preserve/restore the owner's current settings rather than older run
baselines. Production exports and local debug execution do not certify a signed
release, Auth integration or protection.


### Temporary native app-selection preview

In an Android debug development build, **Android selection preview** opens the
app-owned native chooser for actual current-profile launcher candidates. Its
footer identifies real native diagnostics; State is disabled. Search, check,
Cancel and Use temporarily affect only native memory; React Native sees a count
and revision. Reset/Screens release its ephemeral QA owner. No app is blocked or
saved to an account. Expo Go/iOS/release have no preview methods and show an
explicit unavailable fallback. Build/run, exact evidence, privacy and cleanup:
[selection preview runbook](../../../../docs/qa/android-selection-preview.md).
Never commit owner app lists, raw phone logs or screenshots containing app names.


### Saved apps editor (debug only)

The **Saved apps editor** entry reuses the real AppsEditor and a native durable
transaction under a clearly labeled synthetic owner. Use these choices in the
picker only stages a draft; Save selected apps persists it. Discard/Reset/Screens
release the draft, preserving saved data; cold process restart reloads the saved
count. State is disabled. No account/Auth/Router or blocking integration is claimed.
See [contract](../../../../docs/architecture/native-global-selection.md) and
[checks/runbook](../../../../docs/qa/android-durable-selection.md). Do not clear app
data or commit owner inventories to demonstrate persistence.


The Saved apps editor's A/B controls are isolated lifecycle diagnostics. Switch/
End first unmount the old consumer and await native end-owner retention. Resume
opens a fresh generation; Erase local test selection erases only that synthetic
owner's local selection after issued writes drain. Failed cleanup keeps Resume
disabled and Retry repeats the same intent. No hosted account deletion/Auth action.
The [runbook](../../../../docs/qa/android-durable-selection.md) distinguishes
actual physical observations from deterministic native/JS tests.

### Android interventions

The **Android interventions** page is an isolated, clearly labeled native test for
owner A. Save the separate test APK's **Disconnect test target** in Saved apps
editor first, then review the native access disclosure and explicitly enable only
Disconnect intervention test in Android Accessibility settings. Two-minute test
installs use 15-second per-app sessions, two/day and UTC; these are fixture values.
Stop/cancel, explicit native refresh, drain/ack and owner-local erasure controls
never delete an Auth account or clear the saved global selection. Native lifetime
handles are released on completion/unmount; installed native policy survives JS
bridge teardown until explicit stop/erase/expiry. Production exports exclude this
page and release has neither service implementation nor bridge registrations.

Follow `docs/qa/android-interventions.md` for the 46-case native runner and actual
phone acceptance. Builds/JVM cases do not establish service/device or store approval.
Do not use UIAutomation dumps with a live service under test; restore the owner's
original accessibility/disclosure/power/connection state after testing.


The RN-08 lifecycle continuation adds actual task removal and feedback-interruption
controls, plus the existing shared protection card fed by a strict explicit-owner
native snapshot reader. Diagnostic windows are now explicitly ten minutes / 7.5
minutes; sessions remain 15 seconds, two/day UTC. Relaunch cannot infer the desired
revision from a stored native read. This diagnostic page can install a local test;
its footer now says so. Main app/Auth/root, production recurring-rule writes and
iOS remain unchanged. Follow the [intervention runbook](../../../../docs/qa/android-interventions.md)
for Metro-stopped, task-removal, permission re-enable and TalkBack acceptance,
including exact baseline restoration and the no-UIAutomation-while-active rule.


### Weekly schedule development flow

Open **Weekly schedule** for the real explicitly scoped local owner-A consumer.
Choose scheduled apps, fill a complete PlanDraft, Preview, then explicitly Apply.
Update changes an enabled schedule; Resume activates a stopped schedule; Stop
retains its settings/allowance history. Preview and field edits never install.
Use Android interventions to review access or erase the local test coordinator
when finished. This page can install local weekly interventions; it is not a
sample or account/API save. No Auth/iOS/production root changes. Detailed setup,
actual acceptance, DST choices and cleanup are in the
[weekly runbook](../../../../docs/qa/android-weekly-schedule.md). This standalone flow brought the host to
24 pages (19 source samples and five real native diagnostics); App journey below
adds the sixth diagnostic.

### Shared product journey

Open **App journey** to use the actual shared Home/Settings screens and existing
inline editors with the real Android weekly-plan port and explicitly labeled
synthetic owner. Choose/save the owned test target, stage days/hours/sessions,
Preview, Apply, inspect Home, and Stop before cleanup. Home's other unavailable
outcomes stay unavailable. The preview owns its Home/Settings/Close navigation;
its Close confirmation cannot be bypassed by the QA footer. No production
Auth/root routing is connected. The host now has **25 pages: 19 source samples
and six real native diagnostics**. Read the
[journey runbook](../../../../docs/qa/android-home-settings-journey.md) for native
build requirements, actual evidence and exact restoration boundaries.
