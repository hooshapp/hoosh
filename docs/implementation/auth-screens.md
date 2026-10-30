# Signup, login and email account flows

Implemented on `landing-page`; changes remain uncommitted and unpushed at the
user's request. This replaces the earlier UI-only increment's unavailable actions.

## Implemented scope

Figma `ukmD2ZidJ9UR2XxUkvdPoJ`: signup `18:2`, login `27:59`. Shared React Native
forms preserve the original dinosaur, glow, sparkle, star and Google artwork,
Space Grotesk and existing charcoal/green tokens. Original SVGs remain in
`apps/mobile/assets/auth/originals`; the manifest records source nodes and hashes.

- Email/password signup and login, masked passwords, autofill hints, keyboard
  navigation, safe areas, scrollable forms, validation, pending/error/retry states.
- One Supabase client/session controller per provider, canonical token-free
  snapshots, session generations, startup event reconciliation, single-flight
  refresh and one AppState refresh owner. Same-user token refresh keeps generation;
  account/auth-session replacement and sign-out intent invalidate it.
- Direct serialized SecureStore on native, device-only/when-unlocked with no
  biometric requirement or plaintext fallback. Size/storage failures remain errors.
- Tab-scoped development web sessionStorage. A unique SDK channel per page maps
  to stable per-project tab keys, avoiding cross-tab SDK session broadcasts while
  retaining same-tab reload/PKCE continuity. Other tabs/origins cannot supply the
  initiating verifier. Browser storage is not equivalent to native SecureStore.
- Signup confirmation waiting/resend with cooldown, email recovery, SDK PKCE
  exchange, matched recovery-only password update, cancellation and re-login.
- Callback origin/scheme/path and pending-operation correlation, bounded lifetime,
  deduplicated exchange, persisted consuming marker, and URL cleanup through a
  dedicated error route. A query parameter alone cannot authorize password update.
  Pending/recovery/interrupted flows keep private tabs gated, including cold start.
- Current-device SDK sign-out: access closes immediately; stored/in-memory session
  removal is verified. A persisted logout intent supports interrupted cleanup.
  Local storage failure keeps private UI locked; remote revocation uncertainty is
  distinguished from confirmed local erasure. Native restrictions are untouched.
- Name remains a user-bound local profile draft; it is not an Auth identity or
  uploaded as Auth metadata. Profile API integration remains a later increment.

## Deliberate adaptations

Login is email-only because no username system exists. Added switching/recovery
links and necessary account-status screens absent from the static Figma frames.
Signup/new-password UI proposes eight characters, subject to provider validation
and later production policy; login accepts existing shorter passwords unchanged.
Google artwork is preserved, with the provider action disabled and visibly labeled
unconfigured. The subsequent social increment is recorded below.

`expo-crypto` supplies native standard random/UUID/SHA-256 operations needed by
Supabase PKCE; no application encryption/chunking protocol was introduced. This
small native WebCrypto compatibility layer and SecureStore still require signed
native build/device acceptance.

## Validation boundary

See [auth foundation QA](../qa/auth-foundation.md) for exact current evidence.
Automated tests include real pinned-SDK local sign-out during revocation failure
and a delayed refresh, plus injected SDK/controller, storage, form and route tests.
These are not proof of email delivery, successful live signup/session restoration,
server-verified API identity, or signed iOS/Android behavior.

## Remaining work

Complete live signup → email confirmation → login → restart → logout and recovery
using owner-entered test credentials. Finish signed native tests for large sessions,
locked storage, keyboard/autofill/accessibility, deep links, reinstall/backup and
upgrade behavior. The imported standalone Swift host is not converted to React
Native by this change. AUTH-08/M1 API identity, profile handoff, subsequent
onboarding, live Google/Apple setup and production policy/release gates remain pending.


## Apple/Google increment — 2026-10-29

Apple native iOS and Apple/Google browser PKCE adapters are implemented, with
public build switches remaining off until provider setup and live acceptance.
Both account screens expose provider actions; unavailable setup stays explicit.
The original Figma artwork and email form are retained; Apple adds an official
native system button (web uses a text button). Browser callbacks and email flows
share the same controller, secure persistence and private-route gate. A restored
OAuth request has a public cancel/resume screen. See
[provider setup and evidence](../runbooks/social-auth-development.md).

Typecheck, mobile lint, 118 mobile tests (77 Vitest + 41 Jest), static web export, iOS JavaScript/Hermes bundle export
and diff whitespace checks pass. Native/system and real provider flows are not
established by these checks. The owner handles commits and pushes.


Live follow-up: recovery cancellation now explicitly restores the recovery route
after local session cleanup, preventing an unintended return to the start screen.
Verified in browser with a reserved example.test non-account and a focused
regression check. Hoosh SMTP sender/login changes are saved, but the most recent
email still has the old owned alternate From address; see the provider runbook.


Google is now configured and enabled in the ignored local development env. Live
web Google authorization/callback, new-email identity, reload restoration, local
signout and private-route blocking passed. Apple stays disabled pending portal
configuration. Web/iOS Hermes exports passed; signed-device acceptance is separate.
