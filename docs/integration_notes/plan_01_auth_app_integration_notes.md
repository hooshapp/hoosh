# Plan 01 — Auth into the actual app

**Checkpoint:** INT-AUTH-C02 local checks complete. **Next:** user visual review, then INT-AUTH-C03. **Owner / reviewer:** Anisha / Ishmum. **Branch:** `integration/shared-product`. **Base:** `6167e364e605728a18556af503469dcfb6d9b217`. **C01 commit:** `0dfb490`. **C02 commit:** Pending.

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

## INT-AUTH-C02 — Account forms and public navigation

**Date:** 2026-11-16. **Starting revision:** `0dfb490` (AUTH-C01). **Commit:** Pending. Source: landing-page `b6d61df5c8a2c1eacbe28a38e06b84b5bcd368d1` and live Figma frames `27:59` (sign-in), `18:2` (sign-up).

- Replaced both Expo Router placeholders with the actual Hoosh forms. `AuthScreen.tsx` keeps the source art and 393 px frame geometry, with responsive widths, scroll/keyboard handling, password visibility and working account-switch links. Sign-up collects name, email and password. Google artwork and its disabled control retain the Figma placement.
- The root mounts public navigation outside the account/native providers and gives guarded private routes an explicit public redirect. Initial navigation waits for Auth restoration so verified accounts can still open private deep links. Public routes share one runtime through `use-public-auth.ts`.
- Forms preserve password bytes, trim email in the controller, map errors to safe copy and suppress repeated submits. `confirm-email.tsx` provides neutral instructions, bounded resend and explicit cancel/return. An active signup request blocks new signup attempts until the existing flow is cleared.
- Added Expo Crypto 58.0.7 and platform crypto adapters for native PKCE. Email callback handling, password recovery and Apple/Google provider flows remain AUTH-C03. Hosted email delivery and physical-device keyboard behavior remain unverified.

### Verification

- Compared the browser renders with both Figma screenshots at 393 × 852. Checked the visible artwork bounds, field geometry and primary button position. At 320 × 568, verified typing, password visibility and switching back to login. The visual review server uses the actual Expo routes at localhost:8090 with dotenv disabled.
- Typecheck, lint (four existing warnings), 606 portable tests and 40 targeted component/crypto tests passed. The fixture routes covered signed-out deep links, login validation, login to Home, unavailable API identity, sign-out and neutral signup confirmation. Web export and Android debug assembly passed. Expo autolinking registered the Android Crypto module.
- For review use `/sign-in` and `/sign-up`. The running preview has no hosted configuration. A real verification-link return, password reset and provider sign-in are for AUTH-C03 and later acceptance.
