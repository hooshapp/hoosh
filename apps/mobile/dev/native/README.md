# Native UI QA in Expo Go

This separate developer project renders the actual shared components with explicitly
labeled local examples. Ishmum owns the Android run; Anisha can reuse it for shared
iOS presentation checks. It does not import Expo Router, Auth, API clients or native
protection adapters. Ordinary app exports must never include this directory or
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

Use **Screens** to choose among 19 pages, **State** to cycle Ready, Loading, Error,
Unavailable, Busy and Long text, and **Reset** to restore the local draft. State
changes also reset drafts. Not every component has a distinct presentation for
all six states; editor Loading uses unavailable and a missing monthly series
stays unavailable. Saving/accept/feed/retry callbacks only produce an explicit
UI-intent notice. No sample becomes a saved plan, earned reward, installed app or
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
