# Authentication foundation QA — 2026-10-29

Branch: `landing-page`. Source changes are uncommitted/unpushed at the owner's
request. Node 24.13.0, npm 11.6.2, Supabase JS/Auth 2.118.0, Expo 58.0.21,
SecureStore 58.0.2 and Expo Crypto 58.0.7. This evidence does not certify release.

## Automated evidence

- Workspace TypeScript including contract-consumer type tests: pass.
- Mobile ESLint: pass, zero warnings.
- Mobile tests: 69 Vitest + 33 Jest = 102 pass.
- Ruff and three API health/configuration tests: pass; no Auth API acceptance implied.
- Expo web export with local public configuration: pass.
- Separate web export with dotenv disabled and public Auth values empty: pass.
- `git diff --check`: pass; local `.env` is ignored. No iOS source edits.

Tests cover validation/error sanitization, native storage options and failure,
serialized cleanup, disabled/SSR web storage, per-project/tab storage and unique
SDK broadcast channels, session startup races, bounded stalled-storage bootstrap and late refresh rejection, token-free snapshots, duplicate
sessions, generation changes, coalesced refresh, transient credential failure,
invalid-session removal, sign-out isolation/removal failure and cleanup retry.

The pinned SDK is exercised with controlled HTTP responses for failed remote
revocation plus a refresh response arriving after local sign-out; the session is
not restored. This is SDK qualification, not a live provider/network outage test.

Account-flow tests cover confirmation without a session, no password persistence,
name draft identity binding, callback origin/context validation, deduplicated and
consumed codes, SDK recovery-event matching, restored recovery routing, cancellation,
resend cooldown, exact password bytes, form errors, double taps, confirmation resend,
recovery access denial without proof, and interrupted-flow entry routing.

## Browser evidence

- Final source export served locally, with read-only dashboard configuration
  inspection and owner-approved callback changes verified by reload.
- A synthetic invalid login reached the actual configured Supabase project and
  returned the generic incorrect-email/password UI; pending controls recovered.
  This proves a rejected request, not successful live authentication.
- Signed-out `/settings` redirected to login.
- A synthetic `type=recovery` callback without trusted pending context navigated
  to `/auth/link-error`, removed its query string, and exposed no reset/private UI.
  Return-to-app recovered to login. No captured warnings/errors during those checks.
- Forgot-password required-email validation and navigation work.
- Final login geometry at the current desktop viewport: fields 286×48 at y=368/438,
  Continue 244×48 at y=663, Google 244×48 at y=727. All five original local images
  load at their designed sizes. No horizontal overflow. Earlier UI checks also
  covered 393×852 and narrow 320×568 layouts; latest physical-device behavior is
  not established by those browser passes.
- Google remains disabled and labeled unconfigured. Additional switching/recovery
  links/status text are deliberate adaptations; normal Figma control positions
  remain intact and the added footer can be reached by scrolling.

## External configuration evidence

See [the setup runbook](../runbooks/supabase-development.md). Public project key
configured locally; no elevated key copied. Email/signup/confirmation are enabled;
Google is disabled. Owner approved Site URL and the three development callback
entries, all observed after reload. Public JWKS currently advertises ES256/P-256.

## Owner-assisted live acceptance — pending

The signup preview was prepared with the owner's chosen test email. New password
entry and signup submission are handed to the owner, as required by browser-tool
rules. No account was created by the agent and no password is recorded here.

Pending: successful signup/email delivery, confirmation callback and session,
login success, reload/session restoration, sign-out, recovery/update, and a second
account isolation test. Record observed outcomes without real recipient addresses,
passwords, session objects, codes or token-bearing URLs. Supabase built-in email
recipient/delivery constraints and any SMTP requirement remain unqualified.

## Separate acceptance gates

No signed iOS/Android build or real device: secure-storage capacity above 2 KB,
locked/unavailable storage, suspend/refresh, native cold/warm links, keyboard,
autofill, VoiceOver/TalkBack, Dynamic Type, reinstall/backup and existing-user
upgrade behavior are pending. The standalone legacy Swift host and Screen Time
extensions are unchanged and remain separate from React Native host integration.

M1 server-verified `/v1/me`, canonical consumer cache teardown under real API
traffic, profile persistence, full onboarding, native enforcement, Google/Apple,
production account policy and release evidence are pending. None is inferred from
cached SDK identity or the current main-tab placeholders.


## Social Auth checks — 2026-10-29

117 mobile tests pass (77 Vitest, 40 Jest), including native Apple nonce hashing,
state mismatch, missing token, cancellation and absent repeat-grant name/email;
SDK token delegation; OAuth callback deduplication, cancellation/stale callbacks,
restored intent, untrusted authorization URL rejection, configured Google UI
routing, and actual pinned SDK PKCE verifier removal. Typecheck, mobile lint,
static web and iOS JavaScript/Hermes exports and git diff whitespace checks pass.

The dashboard records the test user as confirmed after `/verify`, with no last
sign-in. Do not equate that with inbox delivery or successful app authentication.
Custom SMTP and provider credentials await owner account access/secret entry.
No native Xcode files changed. Real provider consent, positive app session,
Gmail inbox receipt, recovery and signed-device flows remain pending.

Live web review of the social increment: signup validation and switching to login
passed, both unconfigured provider actions were disabled with explanatory copy,
and lower actions were reachable through scrolling. No horizontal overflow at
the observed 1280x720 viewport. The browser viewport override did not take effect,
so narrow-screen visual acceptance for this increment is still pending. The
Jest native component fixtures use 393x852; they do not replace that browser/device
check. iOS Hermes export passed, but this is not an Xcode/signed-device build.


### Saved Gmail SMTP / live recovery request

Owner completed the app-password entry and saved SMTP. A fresh dashboard page
confirmed custom SMTP enabled, smtp.gmail.com:465, Disconnect sender name, and
hidden stored password. A single app recovery request completed; Auth logs show
POST /recover 200 and the existing confirmed test user. No SMTP error reported.
Inbox receipt, original-tab callback, password update and subsequent login remain
pending. Keep the original app tab to preserve its PKCE verifier. This evidence
does not establish successful signup confirmation delivery or native/provider
acceptance. No code changes or test reruns were necessary for this dashboard-only
configuration change.


### Sender rename / inbox evidence

Owner screenshot confirms actual receipt of the earlier recovery email in Gmail.
Google Email settings then confirmed the Hoosh primary email and prior Disconnect
alternate on the same Google Account. Saved only the outgoing sender-address
change in Supabase, retaining Disconnect display name and the existing SMTP
credential. The app accepted a recovery retest; receipt from the updated sender
and positive callback/password-update/login acceptance are still pending.
No runtime email address is hardcoded in mobile source/config. This dashboard-only
change does not establish Google/Apple OAuth or native acceptance.


### Follow-up: actual From header and cancellation regression

The sender-only retest and the retest with new SMTP username both returned 200.
Owner still reported the old actual From address. The newest message in the
sender's narrowly filtered SMTP test conversation confirms the old From header;
Gmail Send mail as settings already show Hoosh as the default. SMTP authentication
and delivery work, but new-sender identity remains unaccepted. No more repeated
blind messages were sent. Google rename propagation is only a possible cause.

Recovery cancellation initially returned to root in the real browser. Fixed it
with an explicit recovery-route replacement after cleanup. The new regression
check passes; a live reserved example.test request/cancel returned to the recovery
form at /forgot-password. Original human test tab/verifier preserved. Validation:
118 mobile tests (77 Vitest + 41 Jest), workspace types, mobile lint, web and iOS
Hermes exports, and diff whitespace checks pass. This is not signed-device or
positive reset/Google/Apple acceptance. No commits/pushes.


### Google consent and client preparation

Owner accepted the User Data Policy and created consent configuration. Confirmed
Google Auth overview no longer shows the initial setup wizard. Saved External /
Testing audience and two owner-controlled test addresses; verified two rows after
save. Saved three non-sensitive identity scopes only (openid, userinfo.email,
userinfo.profile); Data Access reports saved, and sensitive/restricted lists are
empty. The Web client form is prepared with the two known local origins and the
project's exact Supabase callback. Credential creation is an owner handoff.
Supabase Google remains disabled with empty credential fields, nonce checks kept
on. No live Google sign-in, client secret, native acceptance or fresh code-test
claim is implied by this dashboard-only work.


### Google development web acceptance passed

Owner saved Google credentials/provider enablement directly. Verified Google
ENABLED from a fresh Supabase provider list; confirmation remains on, anonymous
and manual identity linking off. Enabled only the ignored public Google dev flag
and exported web/iOS Hermes bundles successfully. Actual Google -> Supabase PKCE
-> authenticated Home/Settings passed using the Hoosh Google account. Settings
showed the new Hoosh address; reload retained the authenticated session. Local
signout passed and direct private /settings returned to /sign-in. A separate retry
auto-signed in through the existing Google grant and was cleaned up; cancellation
was not exercised live. Google client secret was not read or stored by the agent.

Signed-device Google, Apple, positive email reset/signup-confirmation, revoked
grants and API/profile integration still require acceptance. Current 118 tests
remain the preceding source-validation evidence; only config/build/live checks
were performed in this step. No native host changes, commits or pushes.
