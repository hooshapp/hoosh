# Durable Android selection — local editor verification

**Plan:** RN08-D03 / RN-09f, 2026-11-09, Ishmum.
**Contract:** [native global selection](../architecture/native-global-selection.md).
**Commit subject:** `feat(android): add revisioned local selection drafts and editor save`.

Use the existing [preview build/toolchain setup](android-selection-preview.md),
build/install both debug APKs with `adb install -r`, then start the native QA host:

```sh
# From apps/mobile/dev/native
npx expo start --dev-client --localhost --port 8094
```

Reverse task port 8094 and open the development client URL documented in the preview
runbook. Choose **Saved apps editor**. This renders the real shared AppsEditor,
with a labeled synthetic owner, not a signed-in account. Expo Go/iOS/release lack
the debug producer and cannot fabricate selection. No native protection is enabled.

1. Choose native apps and Use these choices. The editor becomes dirty; no file
   Save occurs yet. Reset/Screens/discard drops those draft changes.
2. Choose again and press Save selected apps. Require a successful native Save
   acknowledgment; remount and restart the app to verify the saved count persists.
3. Clear checks in the chooser and confirm, then Discard changes in the editor.
   The previous saved count returns. Canceling in the chooser preserves the prior
   editor draft instead of implicitly discarding the entire editor.
4. With unsaved edits, hardware/header Back offers Keep editing/Discard and leave.
   Backgrounding the chooser cancels it; old saved data remains. Cold process
   restart loses drafts while retaining saved choices.
5. Save an empty selection explicitly. It survives restart with its positive
   revision tombstone; no automatic record deletion/revision reset occurs.

## Native regression runner

```sh
adb shell am instrument -w -e probe selectionDraftChecks \
  com.hoosh.disconnect.dev.test/com.hoosh.disconnect.dev.UsageProbeInstrumentation
```

Expect `selectionDraftChecksPassed=22` and instrumentation result −1. The model
checks stage-versus-save, versions/owners/handles, no-op/changed/empty revisions,
missing candidates, release/restart, stale/concurrent Save, failed write, lost
acknowledgment, invalid owners and draft bounds. Actual Android AtomicFile cases
exercise reopen, owner isolation, backup recovery, corruption/oversized reads,
oversized-write preservation and concurrent compare-and-set. They use synthetic
package IDs in a uniquely created cache directory, deleted in finally; they never
read or delete the owner's saved QA selection. Failure emits a fixed marker and
case number, not raw exception messages/identities.

Existing `selectionPreviewChecks` (12) and `selection` discovery (10) modes remain
regressions. Component tests run on both native presets; no iOS implementation is
implied by mocks. Full root checks, release compile/manifest/class registration
isolation and production exports remain necessary. Exact observations, hashes,
cleanup and remaining gates are in the [sanitized evidence](../core_plan_implementation_notes/artifacts/rn-09f-selection/evidence.json)
and latest [Plan 04 notes](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md).

## Privacy and cleanup

Inspect only an unlocked, authorized device and this app. Do not commit a real app
list, raw logs, identifiers or screenshots containing personal app names. Never
use UI hierarchy dumps during TalkBack. Preserve the current-run settings/usage/
USB baseline, restore temporary settings, remove only task-created port/XML/Metro,
and retain app data/APKs. Do not delete all app data to test a cold start.

Auth/root/account binding, local deletion/transfer protocol, active-quest effects,
iOS, enforcement, signed release and remaining spoken/race/profile/device acceptance
are separate gates. The QA owner is not a production guest mode.


## Lifecycle/accessibility follow-up (2026-11-09)

The Saved apps editor now has explicit **Current test owner A/B**, Switch test
owner, End test owner, Resume test owner and Erase local test selection controls.
These exist only in the QA host. Switching/ending first unmounts the old editor and
fences native requests, then awaits local cleanup. Retention preserves saved data;
erasure removes only the synthetic owner's local selection. On failure Resume is
disabled and Retry local cleanup repeats the same intent. No Supabase account is
deleted. Real Auth must supply owner/session generation before production wiring.

```sh
adb shell am instrument -w -e probe selectionLifecycleChecks \
  com.hoosh.disconnect.dev.test/com.hoosh.disconnect.dev.UsageProbeInstrumentation
```

Expect `selectionLifecycleChecksPassed=17` and result −1. Cases exercise actual
main/worker controller callbacks with controlled owners/catalog/lock/persistence:
retention and all-lease expiration, erasure isolation/idempotency/failure/retry,
AtomicFile sidecars and partial-delete detection, locked/read-race handling,
unavailable candidate before Save, lock during an issued Save, end-owner before/
during write, other-owner/invalid-owner cleanup isolation and Activity teardown.
Latch-controlled races do not require removing personal apps or locking the phone.
Test cache directories are unique and cleaned in finally. Failure emits only fixed
marker/case index; no exception details or user inventory. Existing 22/12/10 modes
remain regression checks; do not mix historical counts into new case totals.

Physical checks should separately cover A/B retain/switch/erase, background/lock
with picker open, return/reload, and TalkBack pane/title, checkbox state and focus
return for Use these choices and Cancel. Native selection names must stay private.
Capture speech-output captions privately and record only static phrases or redacted
state results. Confirm audibility with the owner; captions/focus cannot prove
speaker output remotely. Never use uiautomator hierarchy dumps while TalkBack is
active. Preserve and restore the current Display speech output preference as well
as accessibility services/touch exploration/font/power/USB settings. Locked or
foreign-app screenshots are not acceptance evidence.

Current lifecycle evidence: [record](../core_plan_implementation_notes/artifacts/rn-09f-lifecycle/evidence.json)
and latest Plan 04 entry. Record pending physical cases honestly if the owner cannot
unlock/observe the device; no prior task's speech confirmation is reused.

Measured 2026-11-09/10 on Pixel 8 Pro/API 36: final 17 lifecycle and 22/12/10
regression cases pass. Serial A/B save/retain/switch/erase and background-return
flows pass. Pane/title and Cancel-to-Choose-apps captions observed privately; owner
reports checkbox announcement/double tap and Use these choices closes the picker.
Post-confirmation Choose apps focus is unverified; do not mark it passed from the
unit tests or closure alone. TalkBack was disabled by the owner during interruption
and stays off; original speech-caption preference is restored. See artifact and
latest notes for final lock/return/cleanup checkpoint and unchanged Auth/token,
production, other-profile/device and signed-release gates.

The continuation observed a locked phone with picker open, without a locked-screen
capture; unlock-return stays pending. Cleanup force-stopped only the QA app,
restored current-run phone settings/usage/reverse/speech preference, removed task
XML and stopped the owned Metro. Saved synthetic A/B selections were empty before
lock; application data/APKs retained. Restart the documented host for further QA.
