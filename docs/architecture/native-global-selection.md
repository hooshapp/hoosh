# Native global app-selection transactions

**Plan:** existing RN08-D03 / RN-09f. **Owner:** Ishmum. **Version:** 1, 2026-11-09.
**Authority:** [PM ADR](pm-decisions-2026-11-09.md), Q09 / PD-18 settles global scope.
**Implementation scope:** Android debug producer and existing AppsEditor with an
explicit synthetic QA owner. Auth/root, iOS and production native capability remain
deferred. This document defines an implemented local transaction, not blocking.

## Owner, group and summaries

Owner key format is `<project-namespace>:<lowercase-user-uuid>`. The namespace is
1–64 lowercase letters/digits/underscore/hyphen. The future Auth-owned caller must
derive both fields from the configured project and current verified session scope,
and invalidate old work at account/session transitions. The string is a storage
partition, not authentication or proof of an account. No code here obtains tokens,
constructs an Auth session or supplies a default production/anonymous owner.

Every owner has exactly one device-local `global` group. Native package identities
remain native. Only this fixed summary crosses the port:

```ts
{
  draftId: string;          // native-generated UUID, ephemeral handle
  groupId: 'global';
  baseRevision: number;     // saved record this draft opened/rebased against
  draftVersion: number;     // changes when picker confirmation changes its draft
  selectedAppCount: number;
  savedAppCount: number;
  dirty: boolean;           // actual native set comparison, not just count comparison
}
```

Revision zero means no record yet; a read/begin does not create a saved file.
Saved revisions are positive and increase on changed sets only. Explicitly saving
empty after nonempty writes an empty record with an incremented revision; retaining
this tombstone prevents an old revision-zero draft from silently winning later.
No labels, package IDs, icons, search strings or native exception messages enter JS.
The decoder strips extras and validates safe integer/count/group/handle invariants.

## Transaction protocol

| Operation | Behavior |
|---|---|
| `selectionBegin(owner)` | Validate explicit owner, read saved state and allocate an ephemeral draft UUID/version 0; return summary only. Maximum eight open drafts per module. |
| `selectionPick(owner, draftId, draftVersion)` | Open native chooser with current draft. Search retains hidden checks; Cancel/Back/background preserve it. Use these choices stages the set, after eligibility/unlocked/focus validation. No disk save. |
| `selectionCommit(owner, draftId, draftVersion)` | Editor Save requeries eligibility while unlocked; compare saved revision with draft base. Atomic write only if the set changed, then read back/acknowledge before rebasing the draft. No-op Save keeps saved revision. |
| `selectionRelease(owner, draftId)` | Idempotently discard that owner's matching draft only, without deleting saved choices. A stale/wrong owner cannot release a newer owner's draft/picker. |

The picker intersects unavailable previous choices for presentation and warns about
them. Only explicit picker confirmation removes them from the draft; only editor
Save changes disk. Reopening, reading or failure never silently prunes saved apps.
Draft versions prevent late staging results; base revisions prevent stale saves.
Two same-owner editors may coexist, but only the first matching changed Save wins;
the other must explicitly discard/reload. Count equality is not set equality.

Picker/catalog/resource work and disk operations use one worker; dialog/request
state is on the main thread. Draft methods synchronize their memory; picker
confirmation stages on the main thread only after the pending/focus fence. Atomic
read/compare/write is protected by one process-wide lock across storage instances,
not merely the UI busy flag. This prototype has no extension or second-process
writer; a future multi-process producer must establish cross-process coordination.

## Storage and acknowledgment

Debug storage is under the app-private `noBackupFilesDir/selection-editor-debug-v1`.
Each owner gets a SHA-256 filename, not a raw user UUID/path. JSON contains only
schema version 1, global group, revision and sorted package IDs. Schema, identity
format, duplicate entries, maximum 512 selections and maximum 128 KiB are checked.
Missing records are empty; corrupt/new-schema/unreadable records are unavailable,
never replaced automatically with empty. Reads are bounded; oversized writes are
rejected before opening the atomic writer. No custom encryption claim is made.

Use [Android AtomicFile](https://developer.android.com/reference/android/util/AtomicFile)
start/finish/fail and recovery reads, plus post-write readback because filesystem
failures can be reported without the desired new record. The API does not supply
writer locking, so the process lock above spans the entire compare-and-set.
[Context.noBackupFilesDir](https://developer.android.com/reference/android/content/Context#getNoBackupFilesDir())
provides the selected no-backup location. This is device-local debug storage, not
account/cloud synchronization, OS selection-token storage for iOS or installed rules.

## Failure, lifecycle and recovery

- Native failures return fixed `ERR_SELECTION_*` codes, without inventories or
  exception text. Wrong owner/handle, stale draft, conflict, unavailable/changed
  candidate, missing bridge and storage faults do not fabricate success.
- Known picker cancellation keeps the previous draft. Unavailable/removed apps
  retain edits and require reviewing the chooser. Conflict/expired draft requires
  explicit reload; no automatic overwrite/rebase or blind mutation retry.
- An uncertain Save may have reached disk. The UI blocks retry, preserves the
  visible draft and offers reload to inspect the authoritative record. A late
  acknowledgment after scope replacement cannot render in the replacement scope.
- Background cancels the native picker. Activity/module destruction clears drafts,
  not saved data. Release is FIFO after an already-issued Save: leaving does not
  promise to undo a committed write. Module shutdown drains issued writes and
  cleanup instead of interrupting atomic writes. Cold start reads saved state.
- The consumer keys owner changes immediately, fences old async results, releases
  late begin handles and prevents duplicate pick/save/discard while pending.
  Hardware Back and header Back require confirmation for unsaved changes. QA footer
  Screens/Reset intentionally bypass the guard and release/remount the draft.

## Integration and remaining gates

The isolated QA page uses a clearly labeled synthetic `qa-development` owner;
this fixed owner never enters the real Router or release export. The reusable
NativeAppsEditor receives an explicit port/owner; it does not register capabilities
or import Auth. Real Settings Apps remains unavailable pending Auth-owned scope and
production adapter integration. Existing ProtectionService pickApps/getSelectedApps
are unchanged; its old two-method shape is not silently reinterpreted as staging.
The preview factory is compile-time disabled in release; the release module
registers no selection transaction methods and contains no debug implementation.

Before enabling real account/device selection: wire the session-generation owner,
review account switch isolation, preserve native nudges/product data at sign-out,
and implement coordinated account deletion/local erasure and acknowledgment. Define
how global edits affect active quest occurrences and installed configuration; a
saved selection revision is not an installed-rule revision. No quest-specific picker
or cross-device allowance is introduced. Anisha keeps iOS/Auth ownership.
