# Native protection adapters

Consume `ProtectionIntegration` availability, then implement the shared `ProtectionService` port from `@disconnect/contracts` here.
RN-08b implements the Android read/usage-access adapter; RN-08c registers it. No enforcement adapter is implemented. Only `connected` exposes a service; connection alone does not prove permission or installation.

- Anisha (iOS): audit and retain the released Swift app's targets, App Groups, entitlements, stores, and event journal before adding a bridge.
- Ishmum (Android): establish supported capabilities and real-device behavior, then implement the same port with truthful capability flags.
- UI owners: read actual native status before displaying active protection; a saved server plan does not prove installation.

Do not put enforcement timers in React Native or depend on API/AI calls to enforce native rules. Native callbacks and expiry must operate independently of the JS process. Final session, override, and quest policies remain pending in `docs/Context (AGENT)/PM_QUESTIONS.md`.

RN-08 now supplies the [read-only status consumer and presentation contract](../../features/protection/README.md). It does not register an adapter or call native writes. Native owners must provide stable integration identity, actual foreground/route visibility and the desired device-native revision, and execute RN08-D01–D06 before live acceptance.

Android adapter: `android-usage-adapter.ts` wraps only validated capabilities,
authorization/status and explicit usage-access Settings. Its unsupported mode
means this build implements no protection mechanism; it is not an Android-wide
parity verdict. Every unsupported operation rejects. Package selection/events and
installed state remain unavailable. The count-only developer probe is separate
from the ProtectionService and never becomes a usage/savings summary. See the
[device runbook](../../../../../docs/qa/android-capability-probe.md).
