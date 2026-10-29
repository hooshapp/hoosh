# 02 — Mobile Authentication and Onboarding

**Plan date:** 2026-10-28\
**Owner:** Anisha (Supabase Auth/project setup SB-01–03, mobile Auth, onboarding, and iOS). Ishmum owns the API/product database and reviews shared integration changes.\
**Status:** Implementation plan; no parts below are implemented or verified by this document. Every commit hash remains pending.\
**Primary branch:** `area/auth-onboarding`; work on `task/auth/<part>` or `task/onboarding/<part>`, integrate working increments into `main`, then update active area branches.\
**Companions:** [shared contracts](00_shared_contracts.md), [Supabase foundation](01_supabase_foundation.md), [backend](03_backend_foundation.md), [React Native integration](04_react_native_integration.md), [PM answer log](<../Context (AGENT)/PM_QUESTIONS.md>).

## 1. Goal and delivery boundaries

Deliver a real Supabase-authenticated mobile session which the application can use independently of FastAPI being finished. The first integration milestone is sign-in → current access token → FastAPI `GET /v1/me` → verified identity displayed by the integration screen. The backend validates credentials; a locally available session is not proof that a protected API request has succeeded.

This plan then prepares resumable onboarding without guessing enforcement, rewards, or measurement rules. Full plan installation and the Figma celebration are later, gated parts. Account identity, onboarding completion, a saved plan, and confirmed native protection remain separate states.

### Delivery stages

| Stage | Included | Not implied |
|---|---|---|
| A — Initial Auth | Configuration, secure native storage, development web storage, session lifecycle, email/password flow, confirmation/recovery callbacks, routing, first identity integration | Production provider selection, mandatory login policy, profile row, completed onboarding, or active protection |
| B — Profile/onboarding preparation | Minimal profile handoff, local versioned onboarding drafts, agreed optional-question screens and activity selections | Server-side onboarding completion or approved session policy |
| C — Gated onboarding completion | Native permission/selection handoff, approved plan authoring/install flow, recovery and truthful completion | Android parity, rewards, usage forecasts, or an iOS migration audit that has not happened |
| D — Conditional providers | Only providers required by an explicit PM/store decision, configured and tested per platform | A functional provider because its logo is visible in Figma |

**Recommended implementation slice, not a PM answer:** use email/password for the first development integration. Keep email confirmation enabled for the representative test path. Production login requirements and sign-in methods remain Q17 / PD-09 / PD-10. Do not mark these decisions answered merely by implementing the development slice.

## 2. Current checkout and requirement traceability

Existing files are `src/app/(auth)/sign-in.tsx`, `sign-up.tsx`, `(onboarding)/welcome.tsx`, `src/app/index.tsx`, and root `_layout.tsx`. They are placeholders; the entry point currently redirects to Home, no session exists, and the Settings links are development navigation. `AccessTokenProvider` exists in `@disconnect/contracts`; the API client accepts it but does not supply it. Supabase SDK, secure session storage, and Auth route guards are not installed by the scaffold.

Primary requirements: FR-001–009, FR-018, FR-034; NFR-001/002/005/006/008/010/011. Native installation also implicates FR-010–017 and NFR-003/004, but their implementation belongs to later native/policy plans.

| Figma reference | Planned use / limitation |
|---|---|
| [Signup `18:2`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=18-2) | Name, email, password, continue, Google example. The name is not an authentication identifier. |
| [Login `27:59`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=27-59) | Email/password visual composition. Change the `email/username` placeholder to email-only for the proposed first slice; no username system exists. |
| [Landing `1:2`, `6:34`, `6:71`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=1-2) | Introductory narrative. An accessible skip and reduced-motion treatment are required; the playful scrolling action must not become a prerequisite for signing in. |
| [Gender `27:113`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=27-113), [age `48:79`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=48-79) | Optional questions with Skip. Gate collection on Q19/PD-17; neither changes restrictions. |
| [Apps `48:81`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=48-81), [activities `50:83`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=50-83) | Preference/selection screens. Actual controlled apps must ultimately come from the authorized native selection flow. |
| [Permission `50:85`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=50-85) | Explain, request, defer, and recover. iOS wording must not be copied to Android indiscriminately. |
| [Plan preparation `52:690`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=52-690), [suggestion `50:87`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=50-87) | State-driven preparation and approved suggested plan. No fabricated AI generation or delay. |
| [Manual plan `10556:120`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=10556-120) | Reuse the same eventual plan editor/model as Settings, not a separate allocator. |
| [Congratulations `50:89`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=50-89) | Only after the relevant setup outcome is known. Permission deferral must not produce a claim of installed protection. |
| [Settings `27:157`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=27-157), [stylebook `10611:12784`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=10611-12784) | Account integration and contextual visual tokens. Signup/login switching, reset, confirmation, sign-out, and errors are necessary additions, not fully specified Figma flows. |

Figma was rechecked during planning. It contains no wired prototype reactions, so navigation additions must be recorded as deliberate adaptations. Preserve charcoal auth/onboarding surfaces, Space Grotesk 300/400/500/700, authentic assets, safe areas, and source-specific control geometry. Do not turn this Auth task into a replacement design system.

## 3. Decisions, prerequisites, and non-goals

| Dependency / question | Effect on this plan | Safe work while pending |
|---|---|---|
| Plan 00 contracts | Canonical `AuthSnapshot`, identity response, error classification, and session generation must be agreed before consumers integrate | Adapter/configuration tests and Figma component preparation |
| Plan 01 SB-01–03 development Supabase Auth configuration — owned by Anisha | Required for real provider calls, redirect allowlists, email behavior, and live identity tests | Controlled SDK test doubles; never a production bypass |
| Q17 / PD-09/10 | Required login, providers, sign-out/deletion policy | Development email/password flow; no claim that it establishes launch policy |
| Q18; native source audit; PD-14/15 | Permission deferral, actual native picker, current iOS upgrade path, Android behavior | Honest unsupported/deferred UI and a port boundary |
| Q19 / PD-17 | Demographic purpose, age range, minimum-age treatment | Optional-question components with synthetic test values; do not collect fields in a real release without the decision |
| Q02–Q10 / PD-01–05 | Session accounting, active windows, overrides, quest precedence, installation meaning | Local onboarding draft and approved activity preferences; no enforcement |
| Q20 / PD-16 | Personalization promises and tone | Deterministic supportive copy; no generated AI claim |
| Backend profile increment | Needed to persist display name as a product profile | Pending signup-name draft; identity Auth itself does not wait for a profile table |

Non-goals: a custom password database; FastAPI login/refresh endpoints; raw native app-token uploads; a native coordinator; deletion of real accounts; multi-device session-budget synchronization; calendar access; payments; MFA/phone/passwordless methods unless separately selected. App Store submission remains a separate release gate.

## 4. Auth architecture and ownership contracts

### 4.1 One session authority

Use a single Supabase client per app environment and one Auth provider/store. Supabase handles credentials and refresh. Application code does not copy refresh tokens into another store or run a competing timer. FastAPI receives access tokens only; the mobile app does not receive a database/service-role secret.

Consume the canonical `AuthSessionPort`/`AuthSnapshot` from `@disconnect/contracts`; AUTH-02 implements the session producer and AUTH-07 separately supplies `AuthAccountActions`. Snapshot states are `bootstrapping`, `signed_out`, `signed_in`, `unavailable`, and `signing_out`, all with `sessionGeneration`. The signed-in state includes the current user and `credentialStatus: ready | refreshing | unavailable`. The top-level unavailable state is reserved for bootstrap/configuration/storage situations that cannot establish a usable session, with the canonical reason and retryability. Raw credentials are absent from the render snapshot. Supabase user metadata and any locally decoded session ID are routing/display inputs only, not backend authorization. `user_id` remains the stable identity even if email changes.

`getAccessToken()` implements the existing `AccessTokenProvider` interface. Return `null` only for a known signed-out session. Bootstrap, sign-out-in-progress, unavailable configuration, and storage failures produce the canonical typed unavailable error. Surface transient refresh failures as typed errors. Do not convert every network failure into an account sign-out. When an identity is already known but refresh temporarily fails, retain the signed-in identity with unavailable credentials as defined by the canonical contract; do not claim a working API credential.

`revalidateSession(): Promise<void>` is the single-flight Auth action. Consumers re-read the canonical snapshot after it settles; they do not invent a second return-value state machine. The React Native integration owner may call it after a protected GET receives 401. A caller may replay an idempotent GET at most once, provided the user and `sessionGeneration` are unchanged. There is no automatic mutation replay. A 403, database 503, network timeout, or unknown-key/JWKS outage is not a reason to keep refreshing credentials. A verified API identity that differs from the SDK identity is rejected and isolated as an integration error; the app does not silently switch accounts to match the response.

### 4.2 Lifecycle sequencing

Register one Auth listener before resolving the initial session, and reconcile startup results against later events. An old startup read must not overwrite a newer sign-in or sign-out. Auth callback handling and startup must also converge through this coordinator.

Keep Auth event callbacks synchronous: record minimal state/lifecycle input and schedule subsequent work outside the callback. Do not call or await Supabase/Auth/profile APIs recursively inside that callback. Unsubscribe on provider disposal and avoid duplicate listeners during hot reload. Supported SDK events include initialization, sign-in/out, refresh, recovery, and user updates. [Auth event reference](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)

`sessionGeneration` increases for an actual identity/Auth-session change or sign-out intent. It does not increase for a normal access-token refresh or a duplicate event representing the same Auth session. The React Native owner cancels old requests and discards late responses using the captured user and generation. No result from user A can render after user B has become current.

Use one auth-owned native `AppState` subscription for SDK auto-refresh: start when active, stop when inactive, and reconcile when the app returns. A separate RN-owned query-focus/network subscription may exist, with its own cleanup, but it must not refresh Auth or create another auth listener. Delegate refresh coordination to the pinned supported SDK; verify that release's documented default before copying an older `processLock` example or forcing a legacy lock path. Newer coordination can differ from older tutorials. Keep event callbacks synchronous and never trigger refresh recursively from `TOKEN_REFRESHED`, regardless of SDK reentry improvements. Handle expiry during suspension without inventing a background JS enforcement service. Application code must not independently reuse captured refresh tokens. [Session guidance](https://supabase.com/docs/guides/auth/sessions), [SDK coordination migration](https://github.com/supabase/supabase-js/blob/master/packages/core/auth-js/migrations/lockless-coordination.md)

### 4.3 Backend handoff

Anisha implements the Supabase Auth side end to end, including SB-01–03. Ishmum
implements API token verification, product persistence and shared app consumers.
Build both sides against Plan 00, then connect real implementations when ready;
record the joint acceptance separately. No completed FastAPI implementation is
needed to test the Auth producer against a controlled consumer.

- Initial `GET /v1/me`: `{ "user_id": "<UUID>", "email": "<string or null>" }`; no database dependency.
- Later `GET /v1/profile`: `{ "profile": null }` when absent, otherwise the canonical profile envelope.
- Later `PATCH /v1/profile`: update/create only the current user's profile using `expected_revision`; first insertion uses 0, existing rows use their returned revision. The profile shape is `user_id`, nullable `display_name`, positive `revision`, `created_at`, `updated_at`.
- Display name: the server applies Plan 00's Python 3.12 `str.strip()` rule and the 80-code-point limit. Submit the raw draft or explicit null, use client validation only as advisory where normalization differs, and adopt the normalized API response. Null clears; omitted is unchanged. No age, gender, app selection, or onboarding-completion field is added to this first profile contract.
- SC-01 adopted the identity/profile split and updated TSD §8.3; follow the [accepted HTTP contract](../../packages/contracts/HTTP_API.md) and its fixtures. The endpoints remain future implementation, with one agreed shape.

The Auth owner never directly writes `public.profiles` through Supabase from the app. The backend/database owner owns the Alembic migration history. Auth configuration belongs to Supabase; product data mutations belong to the approved FastAPI API.

## 5. Session persistence and environment handling

### Native default: direct SecureStore, with an explicit acceptance gate

Install SDK-compatible `expo-secure-store` and the pinned Supabase JS SDK using the workspace package manager. Add a small asynchronous storage adapter implementing get/set/remove. Use an environment/project-specific SDK storage key. Serialize writes/removals so sign-out cannot be followed by a late refresh write that restores the signed-out session. Forward native errors as typed failures; do not silently fall back to AsyncStorage/plain files.

Do not enable biometric `requireAuthentication` for routine session reads in this first slice. It would introduce a new unlock/prompt behavior and could disrupt lifecycle restoration. Select device-only/accessibility settings deliberately with the native owner; do not assume credentials belong in the Screen Time App Group. Keep the credential store separate from the native restriction journal.

SecureStore is appropriate for secrets, but the documentation warns that large values can be rejected by the platform. Therefore test realistic serialized sessions, including provider-expanded metadata and values above 2 KB, on signed iOS and Android development builds. Size acceptance is a native completion gate, not a unit-test assumption. This plan does not implement custom cryptography or default to a custom chunking protocol. [SecureStore constraints](https://docs.expo.dev/versions/latest/sdk/securestore/)

If a realistic value fails, stop the affected native-auth acceptance and create a separate reviewed follow-up to choose a vetted secure large-value solution or a bounded adapter. If chunking is selected later, its design must include serialized operations, bounded total size, a generation manifest switched only after all pieces are written, detection of partial/corrupt reads, removal of old generations, and interruption tests. Do not put an improvised fallback into the login commit.

Test unavailable/locked storage, failed writes/removals, malformed serialized data, restart during refresh, and reinstall behavior. Credential restoration after reinstall and backup differs across platforms; verify the pinned SDK/native configuration instead of promising persistence. If stale keychain material survives a fresh install, apply an explicitly documented installation-boundary policy without changing native restrictions as a side effect. Coordinate backup-rule changes with Android/iOS owners.

### Development web target

Use a separate `.web.ts` adapter backed by tab-scoped `sessionStorage`, with an SSR guard. This supports PKCE verifier/session continuity during a callback reload on the same origin and tab. It is a development preview using test accounts, not a production browser-auth architecture. Storage is browser-readable; do not describe it as equivalent to native secure storage. Closing the tab can lose the session/verifier, and different tabs/origins are independent.

Restrict the development redirect origin explicitly. `localhost` and `127.0.0.1` have separate browser storage, so a flow started on one must return to the same one. If browser storage is disabled, show a recoverable storage error rather than pretending a durable session exists. Do not make the native adapter fall back to this web implementation.

### Configuration and logging

Use `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; validate both and the selected redirect target before creating a real client. Missing configuration yields an honest unavailable setup state and secret-free CI must still typecheck/export. The API's trusted issuer/audience/signing algorithms are server configuration, not client claims.

Never log passwords, access/refresh/provider tokens, authorization headers, callback URLs with codes, PKCE verifiers, or complete session objects. Observability may contain operation name, platform, category, duration, and a correlation ID. Use synthetic secrets in tests and redact URLs before capturing failures.

## 6. Callback, signup, and recovery protocol

Use Supabase's PKCE flow for selected redirect-based flows. Configure `detectSessionInUrl: false` and one application-owned callback controller. The SDK exchanges the code; application code does not derive tokens from URL fragments or trust callback query data as authenticated identity. PKCE codes have a short provider-controlled lifetime and are single-use; retain the initiating verifier and handle missing/consumed/expired codes. [PKCE guidance](https://supabase.com/docs/guides/auth/sessions/pkce-flow)

Proposed public route: `/auth/callback`, outside protected content but covered by the callback controller. Map it deliberately to a route such as `src/app/auth/callback.tsx`; do not assume a route group creates a URL prefix. Register exact development web and native callback targets in Plan 01. The existing `disconnect-dev` scheme is development-only; production schemes/domains must follow the native identity audit. Validate actual routing in signed builds, including cold start and a running app. [Native redirect configuration](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)

Track a bounded pending operation (confirmation, recovery, or selected OAuth flow) without storing a password. Validate scheme/origin/path against the configured allowlist, correlate the expected operation, and do not accept an arbitrary `next`/return URL. Handle both initial URLs and foreground link events through one deduplicated, single-flight controller. An unrecognized link cannot replace credentials or navigate into private content.

Do not run two exchanges for the same code because the router, Linking, and startup restoration each saw it. Keep codes/verifiers out of analytics. If a code was consumed but persistence failed, show recovery instructions; do not repeatedly exchange it or manufacture a local session. A callback from an old account/flow must not overwrite a newer deliberate session change.

### Signup

Figma's name field is product profile input. Retain it as a pending signup draft and submit it through the later profile API after authenticated identity is established. Do not use it as an authorization claim or silently add a second identity/profile authority in Auth metadata. If confirmation occurs on another device, that local name draft may be absent; allow entry later rather than blocking authentication.

`signUp` may return a user without a session while confirmation is pending. Show a confirmation-waiting state; do not mark signed-in, call protected APIs, complete onboarding, or award anything. Use neutral, enumeration-resistant feedback for duplicate/existing email cases. Trim email input, preserve password input exactly, and treat provider validation as authoritative. Prevent repeated submissions while one attempt is pending. [Password-based Auth](https://supabase.com/docs/guides/auth/passwords)

Resend is a real provider operation, with server rate limits and an accessible cooldown. Do not create unbounded retries or claim delivery because the request succeeded. An email scanner, a reused link, missing verifier, another device, another origin, or a closed development browser tab can invalidate the callback context; offer a fresh flow. Do not instruct users to disable confirmation as the solution.

### Password recovery

Provide forgot-password request, neutral acknowledgment, callback processing, recovery-authorized password form, and success/reauthentication behavior. Only a valid SDK recovery session and expected operation can enter the password-update action; a `type=recovery` query string alone is insufficient. Show which account is being updated without exposing unnecessary email details. Never navigate from a recovery callback straight into the general app and skip the reset form.

Handle mismatched confirmation, rejected password policy, expired/reused link, offline submission, cancellation, and switching accounts during recovery. Do not write either password to a resumable draft. After success, follow the SDK's verified session outcome and the agreed session policy; do not promise that all other devices are instantly logged out. [Recovery API](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)

## 7. Routing, account isolation, and native boundaries

Use the current Expo Router protected-route pattern for the pinned SDK. Auth callback and recovery routes remain reachable during startup/recovery, but cannot expose private screens. During `bootstrapping` or unavailable storage, show bounded loading/error/retry UI; do not flash Home and then redirect. Keep auth gate and future onboarding gate separate. [Protected routes](https://docs.expo.dev/router/advanced/protected/)

For Stage A, authenticate access to the first account/API integration screen; do not require nonexistent onboarding completion. The existing preview links may remain only in an explicitly development-only fixture entry, with a release/build check proving it cannot become an anonymous production bypass. Missing env settings must not automatically enable that entry. Production guest access is a PM decision, not an error fallback.

On sign-out intent, immediately increment the generation and stop starting user-scoped work. The integration owner cancels requests, clears in-memory/query caches and user-scoped drafts, and rejects late results. Supabase owns credential removal; inspect and test the pinned SDK's local sign-out/error behavior so a remote outage cannot leave a locally accessible previous account. Persist no queued mutation capable of being replayed as a different user. Do not clear unrelated device/native state as a shortcut.

Use current-device sign-out as the adopted initial development scope; global sign-out remains an explicit product/security choice. Distinguish local completion from remote revocation uncertainty. Already-issued JWTs can remain valid until expiry under signature-only verification; do not promise instant revocation. [Sign-out semantics](https://supabase.com/docs/reference/javascript/auth-signout)

Call the selected SDK's explicit `{ scope: 'local' }` operation and qualify its released behavior under offline/revocation failure; do not assume the method name makes every historical version network-independent. Pin a compatible release with demonstrated local-removal behavior. Verify storage removal and the in-memory SDK/controller state before reporting success. If native deletion fails, keep private UI locked, stop refresh/user work, surface retry/recovery, and do not invent a `SIGNED_OUT` event or call private SDK internals. SDK coordination, controller generation checks, and storage serialization must collectively reject a late refresh resurrection; serialization alone is not sufficient evidence. [Current SDK sign-out implementation](https://github.com/supabase/supabase-js/blob/master/packages/core/auth-js/src/GoTrueClient.ts)

Once actual restrictions exist, Q17 must define how they relate to sign-out, deletion, and account switching. Before then, Stage A does not install native rules, so credential removal neither activates nor clears restrictions. Do not later ship account switching over active native rules until an ownership/reconciliation policy and regression tests exist. Authentication failure must not accidentally turn off established native protection.

Account deletion is not implemented by adding a Supabase admin key to the app. Its later backend/native cleanup flow requires a separate destructive-action specification and confirmation UX. The current plan must not expose a button that reports deletion without that operation.

## 8. Commit sequence — Stage A

All paths below are relative to `apps/mobile/` unless stated otherwise. Each part is one coherent proposed commit with tests in the same commit. If a part grows beyond a reviewable change, split it before coding and update this plan; do not merge half-configured production flows.

Part IDs are stable task labels, not an instruction to delay all integration until every earlier number is finished. The shortest guarded M1 path is AUTH-01 → AUTH-02 → AUTH-03 → AUTH-07, with RN-01/RN-04 handoffs and configured disposable accounts. AUTH-04–06 complete callback/signup/recovery flows alongside or after that first sign-in proof, then AUTH-08 records the broader Auth acceptance. Their missing release behavior remains explicit; an early M1 demonstration is not permission to publish an incomplete authentication product.

### AUTH-01 — Configured client and platform storage adapters

- **Commit:** `feat(auth): add configured Supabase client and session storage`
- **Prerequisites:** Plan 00 identity/storage contracts and the configuration names in §5. Anisha owns SB-01–03 and supplies the actual project namespace/settings for live use; configuration/storage unit tests can begin with injected test settings before project setup is complete. Real credentials are required for live testing, not deterministic tests.
- **Files:** `package.json`, root `package-lock.json`; `.env.example`; proposed `src/infrastructure/auth/config.ts`, `supabase.ts`, `storage.native.ts`, `storage.web.ts`, and their tests. Native build-config edits require the native owner's review.
- **Work:** Install compatible dependencies; validate environment; create exactly one real client; configure PKCE/session persistence and SDK lock support; implement serialized SecureStore native operations and SSR-safe development `sessionStorage`; expose typed unavailable/configuration/storage errors. No UI sign-in or database calls yet.
- **Tests / acceptance:** Missing/partial env cannot create a bogus client; CI export needs no credentials; native storage never calls plaintext fallback; get/set/remove and failed operations propagate correctly; browser SSR access does not touch `window`; project/environment keys do not collide; overlapping set/remove cannot restore a removed generation. Secret-shaped fixtures never appear in logs.
- **Native gate:** Record the real-device large-session and reinstall/backup tests for AUTH-08. Passing a mocked SecureStore test is insufficient.
- **Rollback:** Revert client integration without changing Supabase users or native restriction data. Remove only credentials created by the test environment when explicitly intended.

### AUTH-02 — Session provider and token/lifecycle interface

- **Commit:** `feat(auth): coordinate session bootstrap refresh and lifecycle`
- **Prerequisites:** AUTH-01 and the exact Plan 00 `AuthSnapshot`/actions/generation contract.
- **Files:** proposed `src/features/auth/auth-provider.tsx`, `session-controller.ts`, `use-auth.ts`, tests; root `_layout.tsx` provider placement in a coordinated shared-file change.
- **Work:** Subscribe before initial restore; serialize reconciliation; install one AppState listener; implement the token provider and single-flight revalidation; route metadata only in snapshot; keep credentials internal. Coordinate disposal, HMR, initial callback, and transient refresh errors. Supply lifecycle hooks to the RN integration owner without importing their query/cache implementation.
- **Tests / acceptance:** Cold start with session/no session; startup read racing sign-in/out; duplicate sign-in; normal refresh does not change generation; account/Auth-session replacement does; concurrent callers share one refresh; disposal removes listeners; offline expired credentials produce typed degraded state without erasing a known identity; known-invalid refresh clears access and advances lifecycle. No Supabase method is recursively awaited inside the event listener.
- **Rollback:** Remove provider wiring while retaining safe credential serialization. Do not clear all app storage or invalidate external user accounts.

### AUTH-03 — Email/password sign-in screen

- **Commit:** `feat(auth): implement email password sign in`
- **Prerequisites:** AUTH-02; RN-01 shared interactive-component test harness/primitives; agreed development email/password scope. SB-03 test accounts are needed for live acceptance, not for deterministic form tests; FastAPI is not required.
- **Files:** `src/app/(auth)/sign-in.tsx`; proposed `src/features/auth/sign-in-form.tsx`, form/error helpers and tests. Reuse shared form primitives from the frontend plan through a small shared PR or a local feature component; do not duplicate a UI library.
- **Work:** Match Figma composition; email-only label; persistent accessible labels; email keyboard/autofill; secure password field; show/hide affordance if included; pending state, keyboard avoidance, validation, generic invalid-credential message, and retry. Add navigation only to an existing signup route; introduce the reset link with AUTH-06 when its destination exists. Preserve password bytes and prevent double submits. Do not add an unconfigured Google button as if it works.
- **Tests / acceptance:** Correct/wrong credentials, whitespace email, untouched password, required/invalid fields, server policy errors, offline/timeouts, rate limiting, repeated taps, large font, keyboard, screen-reader labels. Auth can succeed while FastAPI is down; UI must not interpret that as backend success.
- **Rollback:** Revert the sign-in UI, leaving a truthful unavailable state. Do not restore the current unguarded Home link in a production build.

### AUTH-04 — Single callback controller and public callback route

- **Commit:** `feat(auth): handle PKCE confirmation and recovery callbacks`
- **Prerequisites:** AUTH-02 and the callback URL contract plus SB-03 allowlist configuration; completed callback code is not a prerequisite for SB-03. RN-01 is required for route/component tests; signed native build/mapping is required only for native link acceptance, not web callback implementation.
- **Files:** proposed `src/app/auth/callback.tsx`, `src/features/auth/callback-controller.ts`, `callback-intent.ts`, tests; coordinated `app.config.ts` and root route changes only where required.
- **Work:** One warm/cold-start intake; allowlist origin/scheme/path; pending-operation correlation; deduplicated code exchange; error/cancel/used-link views; discard stale operation completions after a generation change. Handle development web callback reloads and clean the visible callback URL after consumption without logging it. Keep callback intake independent of profile/API availability.
- **Tests / acceptance:** Warm/cold app, duplicate events, malformed/untrusted URLs, no code, provider error, missing verifier, other-device/origin link, reused/expired code, cancelled flow, process interruption, callback while another user signs in. An arbitrary callback query cannot create an authenticated snapshot. Existing valid sessions are not erased merely because an unrelated old link is opened.
- **Rollback:** Disable starting redirect flows until compatible callback handling is restored. Keep users a way to retry sign-in; never redirect invalid callbacks into Home.

### AUTH-05 — Signup and confirmation waiting/resend

- **Commit:** `feat(auth): add signup and email confirmation states`
- **Prerequisites:** AUTH-03/04; Plan 01 email confirmation and redirect settings. Production scope remains pending PD-09/10.
- **Files:** `src/app/(auth)/sign-up.tsx`; proposed confirmation route, signup draft, resend operation and tests.
- **Work:** Name/email/password form, provider-aligned password hints, pending name draft, neutral response, explicit awaiting-confirmation state, resend and return-to-login. Create no product profile row in this Auth commit. Distinguish user-without-session from a real session.
- **Tests / acceptance:** Confirmation on/off in isolated test configurations; duplicate email neutral result; session-null signup; password rejection; resend rate limit; confirmation after restart; link in another context; callback failure; cancellation; no accidental protected call while awaiting confirmation. No password is persisted or logged.
- **Rollback:** Hide signup while retaining existing-user sign-in/recovery. Do not delete users created by signup or turn off confirmation globally to mask failures.

### AUTH-06 — Password recovery screens and update flow

- **Commit:** `feat(auth): add password recovery and reset flow`
- **Prerequisites:** AUTH-04; Plan 01 recovery email template/redirect tests.
- **Files:** proposed `src/app/(auth)/forgot-password.tsx`, `reset-password.tsx`, recovery feature/controller tests; reuse callback controller.
- **Work:** Request/reset forms, neutral acknowledgment, trusted recovery routing, password confirmation, submission/error/success states, safe cancellation. Keep recovery accessible while ordinary private content remains guarded. Show account context where needed and handle account replacement explicitly.
- **Tests / acceptance:** Existing/nonexistent email feedback does not leak account existence; expired/replayed link; wrong-origin link; missing recovery context; offline request/update; password mismatch/policy rejection; double submit; another user signs in mid-reset; restart during recovery. A query string alone cannot authorize password update.
- **Rollback:** Stop exposing a new recovery action until fixed; preserve provider recovery capability and clear user-facing instructions. No password is stored in retry queues.

### AUTH-07 — Route guards, sign-out, and identity transitions

- **Commit:** `feat(auth): guard private routes and isolate account transitions`
- **Prerequisites:** AUTH-02/03; RN-01 shared UI tests; SC-04 fixture/release-exclusion rules; RN-04 teardown interface for integrated account-data cleanup (the Auth controller can be unit-tested with injected hooks before RN-04). AUTH-04–06 are needed for their own callback/signup/recovery acceptance, not the initial guarded sign-in/sign-out proof. Native sign-out policy is a release gate once rules are connected.
- **Files:** `src/app/index.tsx`, root `_layout.tsx`, auth group layout; proposed route-guard and sign-out components/tests. Account settings placement is coordinated with the RN owner.
- **Work:** Protected-route guards; bootstrap/error states; callback/recovery exceptions; replace production preview escape links; local sign-out and server revocation-uncertainty reporting; same-user reauthentication and different-user transitions. Do not require unfinished onboarding to access the identity integration screen. Exclude fixture entry points from the release route/import tree and verify the built artifact has no fixture selector or callable bypass; `__DEV__` UI hiding or missing-env fallbacks alone do not prove exclusion.
- **Tests / acceptance:** Deep link/back navigation into private routes while signed out; no Home flash during hydration; missing configuration is unavailable, not anonymous production access; sign-out during fetch/refresh; remote sign-out failure; generation update before cache rendering; user A response cannot appear for B; restart after sign-out. Callback/recovery route regressions are added with AUTH-04/06 when those routes exist; do not register nonexistent screens merely to satisfy this guard commit. UI/API/native states remain distinct.
- **Rollback:** Restore a known guarded version or close the affected feature; never loosen guards to resolve integration trouble. Preserve native restriction state pending the actual policy.

### AUTH-08 — First authenticated integration and native acceptance evidence

- **Commit:** `test(auth): verify session lifecycle and API identity handoff`
- **Prerequisites:** AUTH-01–07, API-04/05, RN-05/06, and configured development project. This is downstream evidence; RN-05/06 and API-04/05 must not depend on AUTH-08 being finished. Native acceptance additionally requires a signed development build preserving audited identifiers/targets as appropriate.
- **Files:** feature/integration tests; proposed `docs/qa/auth-foundation.md`; coordinated fixture/development harness changes, without committing user tokens or credentials.
- **Work:** Exercise the integration milestone, capture exact tested app/SDK/platform/build versions and sanitized outcomes, test expired credentials and API outages, and complete secure storage size/lifecycle evidence. Record automated, browser, emulator, signed-device, and unverified cases separately.
- **Acceptance:** Auth works without profile tables; `/v1/me` identity matches Supabase current user; 401 gets one Auth revalidation and at most one same-generation GET replay; no write replay; 403/503/network errors remain classified; sign-out/account switch never leaks old UI. Native restart/foreground/background, large session, secure storage failure, link delivery, and backup/reinstall behavior have evidence before native Auth is marked complete. A browser pass alone can complete the development HTTP handoff, not native secure-session acceptance.
- **Rollback:** Disable the affected flow/provider or return to the last verified Auth increment. Investigate environment/provider configuration before changing core protection or relaxing token checks.

## 9. Bounded follow-on parts — onboarding and selected providers

These parts are planned handoffs, not permission to fill in missing product rules. They may be refined after the identity milestone, with their dependencies and tests retained.

### AUTH-09 — Profile handoff and local onboarding draft

- **Commit:** `feat(onboarding): add account scoped resumable draft`
- **Prerequisites:** AUTH-07 and canonical local draft contract; API-09/RN-07 profile handoff for persistent name submission. Local draft-controller tests can start before those profile producers, but the complete profile-handoff commit consumes their shared helper rather than duplicating it. Q17 identity ownership and draft-retention policy remain gates for real-user behavior.
- **Files:** proposed `src/features/onboarding/draft.ts`, `draft-storage.ts`, controller/tests; profile handoff in Auth feature; no direct database client mutations.
- **Work:** Versioned draft, explicit last valid step, account/project/install namespace, invalid-version recovery, minimal local persistence, and separation from credentials. Exclude passwords, raw iOS tokens, and inferred usage. Before authentication, a pending signup name belongs only to its local operation, not a trusted account. Attach it only after that operation's user identity matches the verified current account; a mismatched/expired/other-device draft is discarded or reconfirmed, never matched by email alone. Submit through the shared `PATCH /v1/profile` helper with revision checks; abort adoption after an account/generation change.
- **Acceptance:** Restart resumes only the current user's draft; account switch clears/quarantines old user material; corrupt/migrated draft recovers; failed write is visible; no stale request marks a later user's onboarding complete; profile conflict reloads/reviews instead of overwriting. Missing profile is different from failed profile fetch. First profile creation can retry by re-reading, not blindly replaying a mutation.
- **Boundary / recovery:** Onboarding is local only at this stage; there is no server `onboarding_completed` field in the first profile contract. A cross-device resume/completion requirement needs an explicit subsequent schema/API part. Quarantine incompatible drafts rather than guessing completed steps.

### AUTH-10 — Landing and agreed preference questions

- **Commit:** `feat(onboarding): build introduction and preference steps`
- **Prerequisites:** AUTH-09; Q19/PD-17 demographic collection decision; reviewed original assets and shared accessible controls. App-selection preference vs actual native control is explicitly distinguished.
- **Files:** `(onboarding)` route steps; feature components/validation/tests; source assets exported through the design workflow, not substitutes.
- **Work:** Accessible landing skip/reduced-motion flow; step navigation; optional demographic skip if retained; activity choices/custom entry; local draft writes and progress indicators. Validate selected values and long custom labels. Do not claim the static app examples are installed-app discovery or native selection. If this coherent part becomes too large, split introduction and preference questions into separately numbered commits before implementation.
- **Acceptance:** Back/skip/restart preserve intended values; no answer becomes an enforcement input by accident; large text/keyboard/screens readers work; empty custom input and repeated taps are handled; offline behavior is explicit; changed question list does not leave a hardcoded wrong `x of 7` indicator.
- **Boundary / recovery:** No unsupported age range or compulsory demographics. No real controlled-app selection until AUTH-11. Revert UI while retaining a readable versioned draft.

### AUTH-11 — Native selection and permission handoff

- **Commit:** `feat(onboarding): connect permission and app selection outcomes`
- **Prerequisites:** AUTH-09/10 draft/step flow; audited iOS bridge and/or measured Android adapter from their own plans; actual capability interface; Q18 / FR-006/018 behavior; source-compatible native build. An unsupported platform is a real result, not a successful mock.
- **Files:** permission/app-selection routes; `src/features/onboarding/protection-setup.ts` and tests; adapter port consumption. Swift/Kotlin implementations remain native-owned.
- **Work:** Explain then call native authorization/selection; map returned permission, cancellation, unsupported/error, selection count/revision; read fresh status on foreground; provide defer/retry/recovery. Reconcile Figma's app-before-permission order with the actual OS flow: an initial preference step can precede authorization, but authoritative selection uses the permitted native picker. Record the adaptation.
- **Acceptance:** Deny/defer/revoke/cancel/reselect; terminate during system prompt; permission changes outside app; status returns after navigating away; native revision changes while waiting; unsupported platform; no opaque token crosses into JS/API; no false active protection after permission alone.
- **Boundary / recovery:** Do not install guessed policies. No RN timer, network/AI dependency in enforcement, or global shield clearing on permission errors. Retain an honest incomplete/deferred setup path.

### AUTH-12 — Approved plan authoring and completion recovery

- **Commit:** `feat(onboarding): connect approved plan and truthful completion`
- **Prerequisites:** PM answers Q02–Q10 as applicable, approved plan schema/revision contract and persistence API from a later plan, native install/reconciliation behavior, AUTH-11. These dependencies are outside the first five foundation plans and must be planned before starting this part.
- **Files:** suggested/manual plan and completion routes; shared plan editor owned jointly with Settings; local operation journal/installation handoff tests.
- **Work:** Use one editor/validation model with Settings; make preparation reflect actual work; separate save success from native install success; recover after interruption between them; show pending/degraded/deferred outcomes; make the completion action idempotent. Never label illustrative estimates as measured savings or infer AI processing.
- **Acceptance:** Save succeeds/install fails; install succeeds/ack upload fails; API offline; session expires mid-save; stale revision conflict; repeated taps; app killed after save; restart with local install revision; permission deferred; plan changed on another device; auth user changed in flight. Celebration wording matches known outcome and never implies blocking when unavailable.
- **Boundary / recovery:** No hardcoded session allocator, reward values, completion evidence, or life-years forecast. Do not require deleting a server plan to recover local installation. Keep native behavior under its owner/coordinator.

### AUTH-13 — Required social providers only

- **Commit:** One reviewed provider commit at a time, such as `feat(auth): add configured Google sign in`; add another provider in a separate part if required.
- **Prerequisites:** Explicit Q17/PD-10 scope; provider credentials and exact redirects; applicable store review; native audit for capabilities/signing. Expand this part into numbered provider-specific commits before implementation when more than one provider is selected.
- **Files:** provider config, feature adapter/button/callback tests; native app config/entitlements only with native-owner review. Reuse existing callback/session lifecycle.
- **Work:** Prefer supported Supabase/Expo provider flows and SDK-managed PKCE/state/nonce handling; do not create a custom OAuth server. Expose only configured providers; distinguish cancellation from failure; do not store unnecessary provider access tokens. Handle private/absent email and existing-account/identity-linking behavior without merging by an unverified matching email.
- **Acceptance:** Each selected provider works on each promised platform/build; cancellation, revoked provider grant, duplicate callback, mismatched operation, no email, account replacement, large session metadata, and redirect configuration failure are tested. Do not treat a browser provider pass as signed iOS acceptance.
- **Release gate:** Google appearing in Figma does not settle iOS login-service obligations. Review the current relevant store requirements and exceptions with the chosen implementation. [Apple login-services guidance](https://developer.apple.com/app-store/review/guidelines/#login-services)
- **Rollback:** Stop offering the affected provider and restore a verified sign-in path while fixing configuration/SDK behavior. Preserve existing account identities and native rules; do not unlink identities or delete accounts as an automatic rollback.

## 10. Shared acceptance matrix

| Scenario | Expected behavior | Evidence owner |
|---|---|---|
| App starts with no session | Stable signed-out route; no protected API call | Auth |
| Restored valid session, API down | Auth remains known; API error shown separately | Auth + RN |
| Expired access token, valid refresh | One SDK refresh; current token handed off | Auth |
| Temporary refresh network failure | Degraded credentials, retry, no destructive sign-out | Auth + RN |
| Invalid/revoked refresh | Invalidate identity access, clear session material, cancel user work | Auth + RN |
| Late request from previous account | Result discarded regardless of HTTP success | RN, Auth emits generation |
| Sign-out races refresh or callback | Sign-out boundary wins; credentials are not resurrected | Auth |
| API 401 vs 403 vs 503 | One same-session GET revalidation path only for 401; other categories distinct | RN + backend |
| Signup needs confirmation | Awaiting-confirmation UI; no authenticated success | Auth + Supabase configuration |
| Recovery or confirmation code invalid | Recoverable link state; no invented session | Auth |
| Another-device PKCE callback lacks verifier | Explain/restart appropriate flow; no fallback to unverified tokens | Auth |
| Realistic >2 KB native stored session | Successful secure restore, or native acceptance remains incomplete with follow-up | Auth + native owner |
| Permission is denied/revoked | Onboarding can defer/recover without an active badge | Auth/onboarding + native |
| Profile save/install out of sync | Distinct pending/recovery states; no fake protection | Later plan + onboarding/native |
| Production preview bypass enabled | Build/release validation fails | Ishmum and Anisha |

## 11. Validation commands and evidence discipline

Use the actual root commands: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run mobile:export`; run affected backend integration checks with `npm run api:test` when verifying identity handoff. RN-01 owns the shared SDK-compatible Jest/React Native Testing Library setup; consume it rather than installing/configuring it again. Portable controller tests remain in Vitest; components and native-module adapters use the shared native/UI harness with disjoint globs. AUTH-01/02 portable work can begin before RN-01, while AUTH-03 and interactive guard tests consume that handoff. Browser tests do not prove native secure storage or system permission behavior.

Keep account credentials in the approved local/secret mechanism, not committed test fixtures. Test accounts must belong to the development project. No test changes a production user's password, revokes production sessions, or resets a real database. Record build ID, platform, app/SDK versions, and exact scenario; classify an unrun case as unverified.

Each commit includes its relevant tests and honest UI states. Avoid snapshot-only tests of copied text; focus on session races, unauthorized access, callback validation, persistence failure, account isolation, and the contract boundaries. Figma screenshots verify composition/overflow at baseline and larger text; they do not replace behavior tests.

## 12. Integration and review checkpoints

1. **Before AUTH-01:** Ishmum and Anisha review Plan 00 contracts, storage/environment choices, and shared-file ownership. Supabase configuration evidence is separate from checked-in code.
2. **After AUTH-02:** The RN owner can implement against a stable snapshot/token interface using explicit test fixtures. No backend completion needed.
3. **After AUTH-04/05:** Test confirmation callbacks with the Supabase owner before enabling broad signup use. Confirm exactly which URI/platform/origin passed.
4. **After AUTH-07:** Jointly verify guarded routing and identity transition teardown. Existing native restrictions are not touched by Auth changes.
5. **At AUTH-08:** Demonstrate the first real HTTP identity slice. Record native acceptance separately; do not mark untested platforms complete.
6. **Before AUTH-09–12:** Reconcile incoming PM answers, profile/plan contracts, and actual native source findings. No server onboarding-completion field or plan engine is added implicitly.
7. **Before release:** Confirm provider/login/minimum-age choices, account-deletion and native sign-out policies, email delivery, store login requirements, native large-session persistence, upgrade compatibility, and absence of development-only bypasses. These are concrete release dependencies, not reasons to postpone the independent foundation work.

## 13. Progress tracker

| Part | Stage / dependency | Status | Actual commit | Validation evidence |
|---|---|---|---|---|
| AUTH-01 | A; plans 00/01 configuration | Not started | Pending | Pending |
| AUTH-02 | A; AUTH-01 + canonical session contract | Not started | Pending | Pending |
| AUTH-03 | A; AUTH-02 + RN-01 | Not started | Pending | Pending |
| AUTH-04 | A; AUTH-02 + redirects | Not started | Pending | Pending |
| AUTH-05 | A; AUTH-03/04 | Not started | Pending | Pending |
| AUTH-06 | A; AUTH-04 | Not started | Pending | Pending |
| AUTH-07 | A; AUTH-02/03 + RN-01/04; callback regression checks later | Not started | Pending | Pending |
| AUTH-08 | A; Auth/API/RN handoff, native evidence separately | Not started | Pending | Pending |
| AUTH-09 | B; draft contract + profile increment | Awaiting prerequisite scope | Pending | Pending |
| AUTH-10 | B; AUTH-09 + collection decisions | Awaiting prerequisite scope | Pending | Pending |
| AUTH-11 | C; audited/measured native adapters | Awaiting native evidence | Pending | Pending |
| AUTH-12 | C; approved policy and future plan API/native plans | Awaiting product/implementation contracts | Pending | Pending |
| AUTH-13 | D; selected provider/store/native configuration | Conditional; not part of initial email slice | Pending | Pending |

Use `In progress`, `Ready for review`, and `Completed` only as real work advances. Preserve actual commit hashes and test evidence; planning is not a completed implementation commit.

## 14. Primary technical sources

These were consulted on 2026-10-28. Recheck the pinned SDK/provider behavior at implementation time. Provider facts support the constraints above; proposed architecture, commit boundaries, and UI adaptations are engineering decisions in this plan.

- [Supabase Expo React Native Auth quickstart](https://supabase.com/docs/guides/auth/quickstarts/with-expo-react-native-social-sign-in) — SDK/platform integration reference; do not copy tutorial logs containing session or storage values.
- [Supabase password-based Auth](https://supabase.com/docs/guides/auth/passwords) — signup/sign-in and confirmation behavior.
- [Supabase sessions](https://supabase.com/docs/guides/auth/sessions) — lifecycle, refresh rotation, and JWT/session distinction.
- [Supabase Auth events](https://supabase.com/docs/reference/javascript/auth-onauthstatechange) — event subscription and cleanup.
- [Supabase PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow) — code exchange and verifier constraints.
- [Supabase native deep linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking) — callback routing configuration.
- [Supabase password recovery](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail) — recovery/update flow.
- [Supabase sign-out](https://supabase.com/docs/reference/javascript/auth-signout) — sign-out scope and access-token caveats.
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) — native storage behavior and limits.
- [Expo Router protected routes](https://docs.expo.dev/router/advanced/protected/) — route gating for the installed Router generation.
- [Apple App Review login services](https://developer.apple.com/app-store/review/guidelines/#login-services) — release review input when selecting third-party login providers.
