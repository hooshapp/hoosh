# Native protection adapters

Consume `ProtectionIntegration` availability, then implement the shared `ProtectionService` port from `@disconnect/contracts` here.
There is no native adapter or successful mock in the current shell. Only `connected` exposes a service; connection alone does not prove permission or installation.

- Anisha (iOS): audit and retain the released Swift app's targets, App Groups, entitlements, stores, and event journal before adding a bridge.
- Ishmum (Android): establish supported capabilities and real-device behavior, then implement the same port with truthful capability flags.
- UI owners: read actual native status before displaying active protection; a saved server plan does not prove installation.

Do not put enforcement timers in React Native or depend on API/AI calls to enforce native rules. Native callbacks and expiry must operate independently of the JS process. Final session, override, and quest policies remain pending in `docs/Context (AGENT)/PM_QUESTIONS.md`.
