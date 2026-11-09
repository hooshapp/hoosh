# Native protection adapters

Consume `ProtectionIntegration` availability, then implement the shared `ProtectionService` port from `@disconnect/contracts` here.
RN-08b implements the Android read/usage-access adapter; RN-08c registers it through the Android-specific module. No enforcement adapter is implemented. Only `connected` exposes a service; connection alone does not prove permission or installation.

- Anisha (iOS): audit and retain the released Swift app's targets, App Groups, entitlements, stores, and event journal before adding a bridge.
- Ishmum (Android): establish supported capabilities and real-device behavior, then implement the same port with truthful capability flags.
- UI owners: read actual native status before displaying active protection; a saved server plan does not prove installation.

Do not put enforcement timers in React Native or depend on API/AI calls to enforce native rules. Native callbacks and expiry must operate independently of the JS process. Final session, override, and quest policies remain pending in `docs/Context (AGENT)/PM_QUESTIONS.md`.

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
