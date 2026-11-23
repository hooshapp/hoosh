# Plan 01 — Auth into the actual app

**Checkpoint:** INT-AUTH-C06 local checks complete. **Next:** INT-ONB-C01. Live auth acceptance remains open. **Owner / reviewer:** Anisha / Ishmum. **Branch:** `integration/shared-product`. **Base:** `6167e364e605728a18556af503469dcfb6d9b217`. **C01 commit:** `0dfb490`. **C02 commit:** `4f07e6d`. **C03 commit:** `83815eb`. **C04 commit:** `7ac27c6`. **C05 commit:** `ae49cd8`. **C06 commit:** Pending.

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

## INT-AUTH-C03 — Verified callback, password recovery and providers

**Starting revision:** `4f07e6d` (AUTH-C02). **Commit:** Pending. Provider and email screen source: landing-page `b6d61df5c8a2c1eacbe28a38e06b84b5bcd368d1`.

- Registered `/auth/callback` and `/auth/link-error`, plus forgot-password, reset-password and provider-pending routes. They share the existing controller. The public index resumes eligible stored recovery or provider activity. Callback errors navigate to a clean URL without exposing the code, verifier or provider error.
- Added explicit duplicate, action and provider parameter checks while retaining exact origin/scheme/path, pending flow ID, expiry and single-use PKCE checks. Updates require the matching recovery state, and the recovery session is cleared before normal login.
- Added the landing-page Apple native nonce bridge, browser OAuth adapters and the Apple/Google controls under the public flags. Android now registers `disconnect-dev://auth/callback` exactly and keeps the separate development-client scheme. The Expo config prepares Apple Sign In for the future RN iOS host. The existing Swift project, provisioning and Supabase settings were not edited.
- Development redirect configuration to verify during live acceptance: localhost ports 8081 and 8090 with `/auth/callback`, and `disconnect-dev://auth/callback` on native. The existing flow correlation remains mandatory. Enable each provider only on a development build configured for that provider.

### Verification and handoff

- Typecheck, lint, 609 unit tests and 52 targeted component/native-mock tests passed. Coverage includes malformed/duplicate/expired callbacks, account replacement, PKCE deduplication, unauthorized reset, and Apple nonce/cancel handling.
- Browser tests used the installed Supabase SDK and intercepted provider responses. Verified cold-reload confirmation in the same tab, replay rejection and clean URL, password update followed by local sign-out, and Apple/Google browser PKCE reaching Home. No real email or provider sign-in occurred.
- Web export and Android debug assembly passed. Inspected the packaged APK for the exact Android callback filter. Signed native callback handling and real provider/delivery acceptance remain pending. The fixture server was stopped; localhost:8090 remains the visual preview with providers disabled.
- Next is AUTH-C04, the shared root/account cleanup and normal-session walkthrough.

## INT-AUTH-C04 — Normal root, account cleanup and retained protection

**Starting revision:** `83815eb` (AUTH-C03). **Commit:** Pending.

- Separated the root's session startup/disposal from its public/private composition. The controller's held-access flag keeps incomplete signup, OAuth and recovery state outside account and native providers. Verified normal sessions continue through the existing app until Plan 02 connects onboarding.
- On account generation replacement, reset the actual app stack to Home, including when the incoming session has the same user ID. The private account scope retires old queries/forms and native leases. A routine token refresh retains the generation and existing navigation.
- Display remote revocation uncertainty on the public login screen after local sign-out. The controller hides private content at intent and owns local erasure/retry state. Android effect cleanup still expires previous handles and selection drafts without stopping installed rules or claiming a new owner. Independent native Stop remains available in its existing authorized account context.
- The normal-root fixture now uses the shared SessionController. Root checks cover restored recovery without a product token, late results during account replacement, stale back-stack cleanup, delayed remote revocation and native rules surviving local sign-out. The wider unit suite covers refresh fencing and uncertain mutations.

### Verification

Typecheck, web export, 609 unit tests and 74 targeted root/account/native-boundary tests passed. Lint passed with four existing warnings. Browser smoke confirmed an enabled email sign-in form and a signed-out redirect from `/settings`. The loopback API answered health checks and rejected a request without a session.

### Preview and handoff

The local preview at `http://localhost:8090/sign-in` uses the existing development Supabase project. The loopback API uses its public ES256 signing metadata and accepts CORS from the preview. No database connection was configured for this walkthrough. Apple/Google remain disabled for this preview. No real test user was signed in by the implementation run.

Manual walkthrough: sign in with an existing development test account, confirm Home opens, open Settings, select **Sign out of this device**, then revisit `/settings` and confirm login is shown. Owner-protected Android behavior remains a device test. Proceed with AUTH-C05 after review.

## INT-AUTH-C05 — Signup name and session upgrades

**Starting revision:** `7ac27c6` (AUTH-C04). **Commit:** Pending.

- Signup and first-time native Apple can store a 24-hour local name suggestion under the project and SDK user ID. Settings reads it through the account scope only after matching the verified `/v1/me` identity. **Use signup name** copies it into the editor. **Save changes** still uses the loaded profile revision and sends the editable raw value through the existing profile API. An existing profile is never overwritten automatically.
- A confirmed save of the adopted draft or explicit **Discard signup name** clears the matching draft ID. Conflict, uncertain save, owner replacement and local storage failure preserve the suggestion for later review. Optional name storage failure does not break an otherwise verified session. Stale, malformed or old unversioned names are not eligible.
- The existing Android development ID (`com.hoosh.disconnect.dev`) uses SecureStore. Keep the project-scoped `disconnect.auth.v1.<project-host>` family, including SDK verifier and logout keys. Native users whose only credential was in the retired unscoped shared key sign in again. Explicit local logout removes and checks only the old shared session, verifier and user keys, then clears its persisted logout intent. Interrupted logout retries that cleanup. Link cancellation does not retire the old shared keys.
- Web uses the current tab's scoped storage. The pre-integration shared web runtime used memory-only credentials. The Swift pilot (`com.AnishaDasgupta.DisconnectApp`) remains separate. No anonymous pilot identity, credential, bundle configuration or Keychain group is imported or changed.
- Unreadable or expired pending-flow metadata keeps private access locked until the user explicitly clears the session. Startup does not erase valid credentials merely because the associated metadata cannot be interpreted. The canonical callback origins and scheme are unchanged.

### Verification

Typecheck, lint, web export, 613 unit tests and 84 targeted profile/root/native-storage tests passed. Lint has four existing warnings. The tests cover reviewed adoption with the current profile revision, explicit discard, uncertain writes, expired names and account scope rejection, exact legacy cleanup and retry, and malformed pending metadata. Keychain/backup/reinstall checks on physical devices and the hosted account walkthrough remain for later acceptance.

## INT-AUTH-C06 — Integrated verification and handoff

**Starting revision:** `ae49cd8cc4797023688339266ea6837b7107c5de` (AUTH-C05). **Commit:** Pending. Supabase JS and Auth SDK 2.119.0, Expo 58.0.21, React Native 0.88.1. Local checks used Node 24.20.0 and npm 11.19.0.

- The first full run exposed a stale tab-navigation fixture. Updated `components/navigation/main-tab-bar.test.tsx` to supply a public Auth runtime and assert the real Hoosh heading while retaining the navigation/back coverage.
- Used Chrome and an isolated loopback Expo server with intercepted Supabase and FastAPI responses. Exercised email signup confirmation in the same tab after reload, replay rejection and clean callback URL, matching `/v1/me` identity, explicit signup-name adoption at the existing profile revision, a confirmed save, session/profile restore, local sign-out and protected deep-link rejection. Password recovery updated the password and cleared the local session. Simulated Apple and Google browser flows both reached Home. The isolated fixture server was stopped after testing.
- The live development preview remains at `http://localhost:8090/sign-in`. Its local API responds at `http://127.0.0.1:8000/healthz`. A database connection was not configured here. Apple and Google remain disabled in that preview. No live account credentials, real email, real provider sign-in, database profile save, or signed physical-device behavior was exercised.
- Development callbacks remain `http://localhost:8081/auth/callback`, `http://localhost:8090/auth/callback`, and `disconnect-dev://auth/callback`, with a pending flow match required. C06 local evidence does not supersede the signed iOS host, Android device, mail delivery, provider cancellation/restart and storage/backup acceptance gates.

### Local evidence

The final `npm run check` passed with 613 unit tests, 859 component tests (two skipped), six Android standalone guards and 682 default API tests (287 deselected). Generated OpenAPI and HTTP types matched. Production web export passed preview isolation and artwork integrity. Android and iOS JavaScript bundles exported successfully. The provider fixture confirmed local logout and private-route removal. Remote revocation failure and its local-clear reporting are covered by the deterministic suite.

### Handoff

Plan 02 consumes the existing `AppAuthProducer` and account scope, the link hold in `AppSessionBoundary`, `SignupNameHandoff` for verified review and save, and the account generation/teardown boundary. Add onboarding routing only after the auth flow is settled. Keep the existing private app available until setup has an account-scoped result. VERIFY-C02 should record the real-account walkthrough, managed API/profile evidence, and installed-device callback behavior separately from browser fixtures.


## VERIFY-C02 — independent Auth validation supplement, November22

Parent `212d386`; production Auth unchanged. Added real pinned Supabase SDK
refresh/logout/new-client restore regression in `src/infrastructure/auth/sdk.test.ts`
lines46–121. Controlled HTTP/storage only: logout remains authoritative when refresh
settles late and server revocation returns503, stored session is absent on a new
client, and deliberate later login works. No hosted user/password/provider operation.
299 combined Auth/account/root/profile/quest checks, TypeScript and focused lint
passed; see Plan05 C02 notes/receipt for exact scope. Live provider/confirmation,
real B writes/return-to-A and OS-storage/native acceptance remain open. No runtime
fix, bypass, rebuild or deployment required; owner retains commit/push control.


## VERIFY-C04 — Android provider packaging supplement

Standalone filtering previously dropped the three reviewed provider switches.
They now survive with strict boolean validation/default-off behavior; two new
regressions pass (eight total guards). Final internal APK visibly enables Google
and Apple actions on signup/login. Credentials/provider configuration unchanged;
provider consent, callbacks and real A/B authentication were not retested here.
Expo/Android display name now Hoosh; package/callback identifiers unchanged.
See Plan05 C04 receipt for exact build hashes and pending acceptance.
