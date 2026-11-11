# Native protection adapters

Consume `ProtectionIntegration` availability, then implement the shared `ProtectionService` port from `@disconnect/contracts` here.
RN-08b implements the Android read/usage-access adapter; RN-08c registers it through the Android-specific module. No production enforcement adapter is registered; the debug coordinator below is isolated. Only `connected` exposes a service; connection alone does not prove permission or installation.

- Anisha (iOS): audit and retain the released Swift app's targets, App Groups, entitlements, stores, and event journal before adding a bridge.
- Ishmum (Android): establish supported capabilities and real-device behavior, then implement the same port with truthful capability flags.
- UI owners: read actual native status before displaying active protection; a saved server plan does not prove installation.

Do not put enforcement timers in React Native or depend on API/AI calls to enforce native rules. Native callbacks and expiry must operate independently of the JS process. Read the PM answers and the 2026-11-10 Ishmum-authorized defaults in `docs/architecture/android-intervention-defaults.md`; feature/production acceptance remains separate.

RN-08 now supplies the [read-only status consumer and presentation contract](../../features/protection/README.md). RN-08c registers the Android read-only adapter with stable identity and actual foreground/route visibility; desired native revision is null because no policy is installed. It calls no enforcement writes. Native owners still supply actual installed policy/revision and the remaining RN08-D01–D06 evidence before full live acceptance.

Android adapter: `android-usage-adapter.ts` wraps only validated capabilities,
authorization/status and explicit usage-access Settings. Its unsupported mode
means this build implements no protection mechanism; it is not an Android-wide
parity verdict. Every unsupported operation rejects. Package selection/events and
installed state remain unavailable. The count-only developer probe is separate
from the ProtectionService and never becomes a usage/savings summary. See the
[device runbook](../../../../../docs/qa/android-capability-probe.md).

RN-08d verifies this Android read/permission slice on Pixel Android 16, including
actual Home Settings return/revoke/cold-start, keyguard/null versus empty/zero,
Metro/API-independent Kotlin reads, Expo Go absence and large-text controls. Phone
settings/connections were restored. Exact evidence and remaining physical/release
limits are in the runbook; no session engine, enforcement or whole-Android parity
claim follows from these checks.


### Separate local selection transaction port

`selection-editor.ts` defines explicit owner/draft/revision/Save/release operations
and strict count-only decoding. It is separate from the unchanged ProtectionService
pickApps/getSelectedApps contract. The debug Android producer does not cause the
registered read-only usage adapter to advertise selection/protection support.
The isolated QA consumer supplies a synthetic owner; real account/Router binding
remains deferred. See [contract](../../../../../docs/architecture/native-global-selection.md)
and [runbook](../../../../../docs/qa/android-durable-selection.md).


`SelectionOwnerLifecyclePort.selectionEndOwner(owner, eraseLocalSelection)` is the
separate local cleanup handoff: retain saved selection at sign-out/owner changes,
or erase that owner's selection after fencing/draining issued work. It never
deletes an Auth account or clears installed rules. Real Auth must invalidate old
UI and supply the consumer generation; current controlled QA A/B tests do not wire
Auth or enable production capabilities. Failed cleanup must remain paused/retry.

### Explicit Android intervention coordinator

`intervention-coordinator.ts` is the typed debug coordinator contract/strict status
and event-ID decoder, separate from the unchanged read-only production registration.
It consumes an explicit synthetic owner, native lifetime handle, compiled finite
windows, saved selection revision and session policy. App identities stay native.
No Auth SDK/default production owner or implicit `ProtectionService.applyRules`
activation is added. Config revision is native evidence, not a saved backend draft.

Opening a handle validates the owner; bridge teardown/owner cleanup expires old
handles before later writes. Sign-out retention leaves native reasons/events owned
by the original account. Erasure drains through the native actor, verifies removal
and blocks reopen on failure until retry succeeds. Real full deletion still must
coordinate selection/Auth/backend/other-device stores. Native events are not rewards.
See `docs/qa/android-interventions.md` and the approved provisional policy record.


### Explicit-owner intervention status reader

`intervention-protection-reader.ts` prepares the existing shared read types for the
debug finite-window coordinator. It requires an explicit verified owner and native
read method; no default identity, Auth import, permission request or rule write.
One native actor snapshot supplies coherent fields. Strict decoding rejects active
without authorization/revision/reasons, invalid/duplicate reason IDs and incorrect
capabilities; unknown inventory extras are dropped. Dispose on owner/scope loss to
reject pending/future reads; disposal does not erase installed native policy.

The native QA host composes this reader with the existing protection mapper/card
and explicit desired revision intent. Production registration still uses the
read-only usage adapter. Do not fill ProtectionService.applyRules with a success
stub: recurring LocalRuleSpec and compiled windows plus session policy differ.
Actual production owner binding, recurrence compilation and write/event adapters
remain future integration. See the [Android runbook](../../../../../docs/qa/android-interventions.md).
