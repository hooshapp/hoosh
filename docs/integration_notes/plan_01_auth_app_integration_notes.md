# Plan 01 — Auth into the actual app

**Checkpoint:** INT-AUTH-C01 local checks complete. **Next:** INT-AUTH-C02. **Owner / reviewer:** Anisha / Ishmum. **Branch:** `integration/shared-product`. **Base:** `6167e364e605728a18556af503469dcfb6d9b217`. **Commit:** Pending.

## INT-AUTH-C01 — Consolidate the application session authority

Source: Anisha’s landing-page `b6d61df5c8a2c1eacbe28a38e06b84b5bcd368d1`. The [plan](../integration_plan/01_auth_app_integration.md) owns the execution order. The Foundation workflow passed on `6167e36` before this increment ([run](https://github.com/hooshapp/hoosh/actions/runs/43808718279)).

- Ported the session controller, its link-state helpers and their source tests under `features/auth/`. The link machinery is available to later Auth increments. This increment provides no public callback routes or new form screens. Any restored in-progress link holds private routes and token access. The baseline gate offers explicit session cleanup.
- `infrastructure/auth/{runtime,supabase,config,errors}.ts` wires the selected controller into the existing API/account scope. The SDK initializes only during startup, disables URL detection and automatic startup refresh, uses PKCE and bounds its transport. The controller handles foreground refresh, single-flight revalidation, immutable identity snapshots and owner/generation fencing. Legacy anon public key configuration remains supported.
- `infrastructure/auth/{auth-storage,auth-storage.web,serialized-storage}.ts` ports serialized device-only SecureStore and tab-scoped browser sessionStorage with separate SDK channel keys. Storage failures invalidate private access. The old unscoped storage key remains untouched and may require a fresh login until AUTH-C05. The baseline session helper remains reachable only from older test fixtures.
- `features/account/session-boundary.tsx` keeps the baseline login form and detaches account/native providers during a pending link. Tests exercise the selected controller through this login gate, along with installed-SDK sign-out, storage, bootstrap, resume and stale-token coverage. The current auth behavior and migration boundary are also recorded in `infrastructure/auth/README.md`.

### Verification

- Typecheck and lint passed. Lint reported four existing warnings.
- The full mobile suite passed with 606 unit tests and 819 component tests. Two existing tests were skipped. The installed Supabase 2.119.0 SDK exercised password sign-in, token rotation, local sign-out through a simulated revocation failure and a late refresh. The baseline form test exercised the selected controller with a fixture SDK.
- Production web export and both mobile JS exports completed with dotenv disabled. Preview isolation and asset verification passed. Native signing, provider actions and hosted account behavior were outside these checks.

### Next checkpoint

AUTH-C02 connects the actual Figma-derived sign-in, sign-up and public routes. Review their phone-width layout before connecting callback and recovery screens in AUTH-C03. Hosted sign-in and physical-device behavior still need acceptance testing.
