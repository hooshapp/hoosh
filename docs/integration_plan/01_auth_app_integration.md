# Integration 01 — Auth into the actual application

**Lead:** Anisha. **Consumer/native/API review:** Ishmum. **Status:** C05 local checks complete.
**Prerequisite:** INT-BASE-C01–C06. **Notes when started:**
`docs/integration_notes/plan_01_auth_app_integration_notes.md`.

## Outcome and current conflict

Use Anisha's signup/login/confirmation/recovery/provider screens and fuller
`SessionController` with the current working shared app. The base already has
Supabase login in `AppSessionBoundary`, `runtime.ts` and `session.ts`; the teammate
root separately constructs `AuthProvider` and its own SDK/session. Keeping both
would break refresh, storage, navigation and account isolation. Replace the
competing producer once, preserve the existing consumers and their safeguards.

Read both session implementations and their real-SDK tests before porting.
Primary paths: `apps/mobile/src/features/auth/`, `src/infrastructure/auth/`,
`src/features/account/{session-boundary,app-runtime-context}.tsx`,
`src/infrastructure/{api,query}/`, `src/app/_layout.tsx`, Auth/callback routes,
`packages/contracts/src/auth.ts` and core AUTH-01–09/13, RN-04–07.

## Final authority and route rules

- Supabase SDK owns credentials. One controller publishes canonical immutable
  `AuthSnapshot` and supplies `AuthSessionPort` and `AuthAccountActions`; the API
  client uses that same port. Raw tokens never enter React state/query keys/notes.
- Keep one AppState refresh owner and one Auth listener. API revalidation delegates
  to the same controller; callback handlers do not await SDK calls recursively
  inside the SDK event callback.
- Account UUID/session-generation changes invalidate private UI synchronously.
  Routine same-session refresh does not discard forms or remount the whole app.
- `/v1/me` must agree with SDK UUID before binding native ownership. Authenticated
  UI is not server authorization; missing API configuration is not a guest mode.
- Private routes stay closed during bootstrap, logout, recovery/code consumption
  and storage failure. Public callback/error routes remain reachable then.
- Normal Home/Quests/History/Settings stay the base implementation, wrapped in the
  existing account/query/native/weekly boundaries after their prerequisites hold.
- Current-device sign-out clears credentials/private work while retaining existing
  native rules/history. A different account never silently claims those rules.

| State | Destination / behavior |
|---|---|
| Startup / signing out | Stable loading/cleanup gate; no previous private screen flash |
| Signed out, no pending action | Intro if unseen, otherwise actual login/signup routes |
| Signup awaiting confirmation | Confirmation/resend view; user-without-session is not signed in |
| Matched recovery | Recovery-only route; no Home until completion/cancel reconciles credentials |
| Pending provider / callback | Resume/cancel/error flow through one callback controller |
| Signed in and usable | Account-scoped onboarding gate from Plan 02, then private app |
| SDK identity known, API offline | Explicit degraded account UI; no automatic new native claim/Apply |
| Configuration/storage unavailable | Retry/recovery appropriate to reason; private content hidden |

## Commit ledger

| Part | Intended commit | State / prerequisite |
|---|---|---|
| INT-AUTH-C01 | `refactor(auth): consolidate the application session authority` | Checks passed in `0dfb490`. [C01 evidence](../integration_notes/plan_01_auth_app_integration_notes.md) |
| INT-AUTH-C02 | `feat(auth): connect account forms and public routes` | Checks passed in `4f07e6d`. [C02 evidence](../integration_notes/plan_01_auth_app_integration_notes.md#int-auth-c02--account-forms-and-public-navigation) |
| INT-AUTH-C03 | `feat(auth): integrate verified callback and recovery flows` | Local and fixture checks passed in `83815eb`; live acceptance pending. [C03 evidence](../integration_notes/plan_01_auth_app_integration_notes.md#int-auth-c03--verified-callback-password-recovery-and-providers) |
| INT-AUTH-C04 | `feat(auth): compose guarded account and native lifecycles` | Local checks passed in `7ac27c6`; user walkthrough unrecorded. [C04 evidence](../integration_notes/plan_01_auth_app_integration_notes.md#int-auth-c04--normal-root-account-cleanup-and-retained-protection) |
| INT-AUTH-C05 | `feat(auth): reconcile profile drafts and session upgrades` | Local checks passed; commit pending. [C05 evidence](../integration_notes/plan_01_auth_app_integration_notes.md#int-auth-c05--signup-name-and-session-upgrades) |
| INT-AUTH-C06 | `test(auth): verify integrated account and provider journeys` | Next; C01–C05; live resources for real evidence |

### INT-AUTH-C01 — One SDK/controller and compatible session behavior

1. Port the selected Auth runtime/controller/storage/error files with provenance.
   Wire its port into BASE's runtime seam; one instance supplies the HTTP client,
   account controller, forms and route snapshot. Construction has no network I/O
   during static export. Effects own startup and disposal.
2. Adapt controller lifecycle names (`start`/`stop`/foreground/retry) without a
   second state machine. Preserve both branches' tests for startup event races,
   late bootstrap, duplicate SDK events, StrictMode/hot reload and repeated dispose.
3. Keep generation changes for real identity/session replacement and logout intent.
   Project changes are a new storage/native namespace. Reject late token retrieval,
   refresh or response after owner/generation loss, including same UUID/new session.
4. Define one single-flight refresh path; retain typed unavailable vs known signed-
   out semantics. Do not convert an offline/expired session to a successful logout,
   return null for every token error, or retry protected mutations automatically.
5. Use native serialized SecureStore with validated size/error/backup handling.
   Adopt project-scoped tab sessionStorage for development web PKCE continuity;
   unavailable storage fails explicitly, never falls back to plaintext/localStorage.
   Keep web cross-tab behavior deliberate and tested.
6. Only remove the base producer/SDK construction after all consumers use the new
   producer. Thin compatibility imports may delegate temporarily; they must not
   construct a second runtime or permanently duplicate implementations.

**Validation:** real installed-SDK storage/signout/refresh tests plus session-port
and API token-acquisition regressions. Assert client/listener/AppState instance
counts and disposal. **Exit:** current app still signs in through one producer.

### INT-AUTH-C02 — Account forms and public navigation

1. Mount Anisha's actual sign-in/signup screens under public Auth routes. Register
   the intro, confirmation-waiting, forgot/reset and provider status routes only
   as implemented. Preserve links, dirty/back behavior, duplicate-submit guards,
   password visibility/autofill, keyboard/safe-area and request-pending states.
2. Validate email gently and preserve password bytes exactly. Signup policy follows
   configured Supabase validation; login must not reject a valid legacy password
   merely because signup hints have a higher minimum. Never persist a password.
3. Handle signup returning a user without a session: show neutral confirmation
   waiting, bounded resend/cooldown and return-to-login. Offline, rate-limit,
   duplicate-account and provider errors get fixed messages without raw SDK output.
4. Keep name as an operation-bound local draft, not Auth metadata authority. Store
   it only when it can be bound to the resulting verified UUID; C05 handles adoption.
5. Provider actions remain capability/configuration-gated. Google web evidence
   from another branch does not enable Android automatically; Apple remains
   unavailable until its portal/build/provider path is configured and verified.

**Validation:** form/component and router tests, back/deep-link attempts, smaller
screen/keyboard checks. **Exit:** actual forms call the single controller; no
placeholder auth screen or inaccessible working signup flow remains in normal use.

### INT-AUTH-C03 — Callback, confirmation, password recovery and providers

1. Port one initial-URL/foreground intake into the controller, with exact scheme,
   origin and path allowlists. Reject unexpected return URLs, duplicate parameters,
   mismatched action/provider, expired operations and callbacks for another account.
   Never log the full URL, code, verifier or token, even on exceptions.
2. Preserve PKCE verifier continuity, operation lifetime, deduplicated exchange,
   persisted consuming/logout markers, URL cleanup and cold-restart interrupted
   flow. Reused/uncertain exchanges show recovery rather than blindly exchanging again.
3. Confirmation on another device may verify the account without the initiating
   verifier/name draft. Offer normal sign-in; do not weaken callback correlation
   or infer account ownership from an email string. Stale links cannot replace B
   after account A requested them.
4. Password update requires the controller's matched recovery state, not a query
   flag or any signed-in session. Preserve cancellation, failed/expired reset,
   return-to-login and interrupted-cleanup behavior. SDK-verified session outcome
   determines the result; do not promise universal immediate token revocation.
5. Configure exact development callbacks in Android intent handling/iOS URL types
   and Supabase allowlists with Anisha. Use separate production config later.
   Provider cancellation/system-browser return and Apple nonce/error paths share
   the same controller and private-route gate.
6. Keep disabled-provider paths explicit if external setup is unavailable. Their
   deterministic handling can pass while live provider acceptance remains pending.

**Validation:** warm/cold/malformed/stale/cancel/replay callback tests; actual native
links using a signed development build when available. The
[Supabase mobile deep-link guide](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)
is a configuration reference; it does not replace this app's correlation checks.
**Exit:** no private-content escape or second link/session authority.

### INT-AUTH-C04 — Normal root, account cleanup and retained protection

1. Split session provisioning from private-data composition in `AppSessionBoundary`.
   Root can render public routes without nesting them inside a signed-in gate.
   Private branches retain `AccountDataProvider`, query lifecycle,
   `NativeOwnerBoundary` and `AccountWeeklyPlanBoundary` in their required order.
2. Consume the controller's link gate centrally so callback/recovery cannot coexist
   with interactive private tabs. Plan 02 supplies setup completion; until then
   preserve the current usable app rather than fabricate onboarding success.
3. At sign-out intent retire old account queries, forms, navigation state, toasts,
   provider operations and native leases before awaiting remote revocation. Verify
   local SDK/storage erasure; on failure lock private UI and preserve retry intent.
4. Preserve native rules on sign-out/refresh/root teardown. Owner cleanup expires
   old handles/drafts; it does not stop rules or move events. On B login, no A name,
   app counts, quest receipts, rewards, History or old navigation appears.
5. Binding requires matching `/v1/me`; an explicit confirmed native claim may stop
   a previous owner's local rules as the current product protocol specifies.
   Ordinary login/read/back navigation must not perform that claim.
6. Preserve device-native Stop/recovery where independently authorized even if the
   API is unavailable. Do not expose retained private records through the signed-
   out Auth screens to make Stop convenient; use native system/recovery controls.

**Validation:** actual root component tests plus A→B delayed API/native results,
same-user replacement, sign-out during refresh/mutation and offline revocation.
**Exit:** integrated root uses the working app and preserves ownership semantics.

### INT-AUTH-C05 — Signup-name handoff and session/storage upgrades

1. Use the existing profile read/save helper and revision contract. After matching
   the signup draft to the verified UUID, show explicit review/save; an existing
   profile is never overwritten automatically. Missing draft is normal on another
   device or after expiry. Clear only after confirmed save or explicit discard.
2. Preserve raw name edits, null-vs-omitted semantics, conflict review, uncertain
   response reconciliation and cancellation after scope replacement. No blind
   `expected_revision: 0` replay and no duplicate profile authority in metadata.
3. Inventory old session keys (`disconnect.auth.v1` and teammate project-specific
   storage/PKCE/logout keys) and installed build identities before migration.
   Default to retaining the new canonical key and requiring sign-in when two
   conflicting sessions exist. Never pick a session by matching email.
4. If unambiguous same-project session transfer is needed, read/validate through
   the SDK-supported path, write/read back securely and only then retire the old
   key. Preserve recoverable originals on failure; don't erase the whole Keychain.
   A legacy anonymous Swift session is never converted to a product account.
5. Pending links/verifiers only move when their operation/storage origin is valid;
   otherwise cancel with a clear retry path. Do not erase valid credentials merely
   because a link or local name draft is malformed. Record any controller repairs.
6. Keep session-key and callback changes upgrade-compatible or document an explicit
   reauthentication requirement; downgrade cannot resurrect a logged-out session.

**Validation/exit:** upgrade fixtures for no session, one valid legacy session,
conflicting projects/users, interrupted logout, failed secure write and stale name.
Real OS backup/reinstall/locked-storage checks remain separate device evidence.

### INT-AUTH-C06 — Integrated verification and handoff

1. Run combined session/storage/link/provider/form/root/account/native-boundary
   suites, `npm run check` and production export/isolation checks.
2. Exercise real email signup/confirmation/sign-in/restart/logout and password
   recovery with owner-entered disposable credentials when supplied. Validate
   `/v1/me` matches, profile saves and restored session uses the same user.
3. For each enabled provider, require actual native platform success/cancel/restart
   evidence before declaring it supported. Unconfigured switches stay off.
4. Record SDK version, platform/build/SHA, allowed callback form (no code), observed
   local-clear/remote-revocation result and exact limitations. Existing branch
   browser evidence is not new Android/iOS acceptance.
5. Handoff the single controller, link gate, profile-draft interface and account
   teardown contract to Plan 02 and VERIFY-C02. Update relevant AUTH/RN/SB ledgers
   only for exercised scope; do not mark every core plan done.

**Exit:** code integration and deterministic evidence complete; real acceptance
passed or explicitly pending. Without real accounts the code can be ready, but
the normal-account functional milestone cannot be claimed complete.

## Failure matrix and rollback

| Failure | Required result |
|---|---|
| API 401 / refresh failure / server outage | Existing bounded recovery; no recursive refresh or anonymous fallback |
| Link arrives during account replacement | Ignore/fail closed for old operation; never adopt into new scope |
| SecureStore timeout/deletion failure | Private UI locked, cleanup retryable; no plaintext fallback |
| Lost logout response / process dies mid-cleanup | Persisted intent resumes; refresh cannot resurrect old private access |
| New build has wrong public project/config | Explicit unavailable state; no attempts against another project |
| Legacy session/name draft cannot be trusted | Reauthenticate/review, preserve privacy; never match by email |

Rollback may disable an unverified provider/route or revert a coherent code unit.
Do not restore the old second session manager, clear installed protection, delete
accounts or roll back secure-storage/schema formats destructively. Retain enough
backward-compatible reading to keep current users recoverable.
