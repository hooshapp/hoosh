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
