# Apple, Google and development email setup

Status: 2026-10-29. Source implemented on `landing-page`, uncommitted. Provider
credentials, positive live sign-in and a signed native build remain pending.
Do not commit credentials or enable public provider switches before setup passes.

## Existing identity and ownership

The owner elected to continue authentication using the existing individual Apple
Developer membership. Disconnect is currently an app brand, not a registered
company. Seller-name conversion is separate work; do not create another Apple
team, transfer the app, rename bundle IDs or replace existing native entitlements.
The imported source records host bundle `com.AnishaDasgupta.DisconnectApp`, team
`KBW8M9TJN2` and App Group `group.com.AnishaDasgupta.DisconnectApp`. Verify these
in the signed-in portal before configuring capabilities. The imported `ios/`
project remains unchanged and is not yet a React Native host.

## Gmail SMTP (development only)

The owner selected the Disconnect Gmail account as the development sender.
Prepared Supabase form: host `smtp.gmail.com`, port `465`, sender name Disconnect,
sender and username equal to that Gmail address. The owner created and entered the app password directly, then saved the settings.
A fresh dashboard page confirmed custom SMTP enabled, the expected host/port,
and a hidden stored password. The agent did not access the secret. Personal Gmail is an authorized test
recipient, not a second sender configuration. No addresses or secrets need to be
recorded in the repository.

1. Owner signs in to the sender Google account and completes any verification.
2. Owner enables 2-Step Verification if needed, then creates an app password for
   Disconnect Supabase dev. Availability depends on account policy.
3. Owner enters the generated app password directly into Supabase SMTP Password
   and saves the prepared form. Never use the ordinary Gmail login password for SMTP.
4. Confirm saved custom SMTP state, then test the app's confirmation request and
   recovery with an owner-controlled account. A confirmed existing account may
   not receive another signup confirmation; use login/recovery appropriately.
5. Verify actual receipt, callback on the originating tab/device, resulting app
   session, reload and local sign-out. A Mail.send log is not inbox-delivery proof.

Gmail is temporary development infrastructure. Supabase warns that personal-mail
SMTP can affect delivery. Production transactional sending/domain work is pending.
Do not turn off email confirmation to work around delivery or verifier errors.

## Google OAuth

Use a Disconnect-owned Google Cloud project; do not reuse the legacy Firebase
project without owner selection. Configure the Google Auth consent screen and a
Web application OAuth client. Request only basic sign-in identity, not Gmail,
Calendar or Drive access. For a testing consent configuration, add owner-approved
test users. Do not publish the consent screen or purchase/enable billing implicitly.

Authorized JavaScript origins for this local increment: `http://localhost:8090`
and `http://localhost:8081`. Authorized Google redirect URI:
`https://eaisvwqfbgdkzdfmxkvm.supabase.co/auth/v1/callback`.
Google redirects to Supabase; the existing app allowlist then returns the PKCE
code to the initiating app flow. App callback URLs are not Google client secrets.

Owner creates/enters credentials directly. Store the Web client ID/secret only in
Supabase's Google provider settings; the secret never belongs in mobile env/code.
Keep nonce checks enabled. Once configured, enable `EXPO_PUBLIC_GOOGLE_ENABLED=true`
in the ignored mobile env and rebuild. Verify consent, canceled access, callback,
session restore and signout before considering the provider accepted.

## Apple native and OAuth

Native iOS uses Expo's official Apple authentication button and system sheet.
The adapter requests name/email, verifies returned state, gives Apple a SHA-256
nonce and gives Supabase the raw nonce for identity-token validation. Missing
repeat-grant name/email is valid. No client-side email matching/account merging.
First-grant name stays a user-bound local profile draft; backend profile integration
is still pending.

For the actual React Native host, preserve the existing app's bundle/team and
validate Sign in with Apple capability/provisioning alongside Screen Time targets.
Expo config declares `usesAppleSignIn` and the Apple plugin for future host setup;
no prebuild or legacy Xcode mutation has been performed. Configure the native
bundle ID in Supabase Apple client IDs, then set
`EXPO_PUBLIC_APPLE_NATIVE_ENABLED=true` only for a qualified signed development build.

Browser/Android Apple access additionally needs an Apple Services ID, associated
primary App ID, registered website domain and the same Supabase HTTPS callback URI
used above. Store its generated OAuth secret in Supabase, never the mobile bundle.
When both native and OAuth are configured, put the Services ID first in Supabase's
Apple client IDs, with the native bundle ID also allowed. Native-only setup does
not need an OAuth secret; the web OAuth secret expires and requires rotation
within Apple's six-month limit. Do not generate/store the private signing key in
the repository. Enable `EXPO_PUBLIC_APPLE_OAUTH_ENABLED=true` after web setup passes.

## Evidence and acceptance boundaries

- Live dashboard logs showed a confirmation request, Mail.send event, successful
  `/verify` and confirmed test-user state at 2026-10-29 12:36 UTC; last sign-in was
  absent. A later 15:01 UTC request was a repeated signup. This establishes server
  confirmation, not successful PKCE exchange, inbox delivery or app login.
- Shared callback handling persists intent, enforces flow/origin/path/age, and
  exchanges a code once even when query order differs between Router and browser.
- Reload resumes public OAuth waiting/cancellation; private routes stay gated.
- Cancel clears pending context and the SDK verifier via verified local signout.
- Native Apple sheet/entitlements, provider consent, real successful exchanges,
  inbox delivery, relay addresses and signed-device acceptance remain unverified.

Primary references:
- https://supabase.com/docs/guides/auth/auth-smtp
- https://support.google.com/accounts/answer/185833
- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/guides/auth/social-sign-in/auth-apple
- https://docs.expo.dev/versions/latest/sdk/apple-authentication/


## Saved SMTP and first live send check

After owner-assisted two-step verification and app-password setup, a fresh
Supabase page confirmed saved custom SMTP enabled on smtp.gmail.com:465, sender
name Disconnect and hidden stored password. No secrets were copied into code,
logs, chat or docs by the agent.

One app recovery request for the owner-approved existing test account completed
successfully. Auth logs show POST /recover returned 200, “User recovery requested:
request completed,” tied to the existing confirmed test user. No SMTP error was
reported for this request. This is request acceptance, not proof of inbox receipt
or successful callback/password reset. Owner inbox confirmation is pending.
The initiating localhost:8090 app tab remains open to retain its PKCE verifier.

The owner subsequently accepted Google Cloud account terms. A new unbilled
Hoosh Auth Dev project (`rational-oasis-513122-q0`) was created for development
Google sign-in. Consent configuration is prepared with Disconnect app name,
Hoosh support/contact email and External audience in testing mode. The owner accepted the Google API Services User Data Policy and created the
consent configuration. No OAuth client ID/secret has been created yet. Apple Developer sign-in/configuration
and both providers' live acceptance remain pending. No provider was enabled and no
new commits or pushes were made.


## Google account rename and sender update

The owner renamed the existing Google Account to the Hoosh address. Live Google
Email settings confirmed Hoosh as the primary Google Account email and the prior
Disconnect address as an alternate on that same account. This is not a separate
sender account. Supabase's outgoing sender address was updated to the new primary
address; sender display name stays Disconnect, matching the existing app design.
The SMTP host, port, stored app password and existing authentication username were
retained. No new credential was entered or exposed by the agent.

The first delivery test before the rename reached the owner's Gmail inbox,
confirmed by the owner's screenshot of the password-reset email. That proves
receipt for that recovery email; it does not prove signup-confirmation delivery,
code exchange, password update or signed-device behavior. A new recovery request
after the sender update was accepted by the app; new-sender inbox receipt is
pending owner confirmation. Keep its initiating app tab for the PKCE verifier.

The account rename does not rename GitHub/Supabase accounts or change app branding.
No old/new sender email address is hardcoded in the mobile runtime source/config.
Google/Apple provider credential setup and positive live acceptance remain pending.


### Sender retest outcome and recovery navigation fix

After the first sender-only update, the owner still saw the old From address.
Updated the SMTP username to the new Hoosh primary too, preserving the stored
app password. The subsequent POST /recover returned 200 without SMTP error.
The owner again reported the old From address; inspection of only the matching
SMTP test conversation in the sender's Sent folder confirmed that the latest
message still carries the old From address. Gmail Accounts and Import already
shows Hoosh as its default Send mail as identity. This is an unresolved external
sender-identity issue; Google rename propagation is a hypothesis, not a verified
cause. Do not call new-sender delivery accepted or send repeated blind tests.
Existing owned alternate address delivery works. Later test the new From header
again; avoid unrelated account migration, password rotation or identity unlinking.

During retest, canceling recovery returned to the app root because local signout
recreated navigation. ForgotPassword now explicitly returns to its own route after
cancellation. Added a regression check and verified cancellation in the live web
preview using a reserved example.test non-account (no real email recipient).
118 mobile tests, workspace typecheck, mobile lint, web/iOS Hermes exports and
whitespace checks passed. No native host changes, commits or pushes.


## Google client preparation after policy approval

Confirmed saved consent configuration in Hoosh Auth Dev
(`rational-oasis-513122-q0`). App name remains Disconnect; support and developer
contact use the new Hoosh email. Audience is External, publishing status Testing.
Saved only three non-sensitive scopes: openid, userinfo.email, userinfo.profile.
Sensitive/restricted scope lists remain empty. Saved the owner's Hoosh account
and previously authorized personal test account as the two test users.

The right-panel client form is prepared, not submitted:
- Application type: Web application (Supabase performs the provider exchange).
- Name: Disconnect Supabase Dev.
- JavaScript origins: http://localhost:8090 and http://localhost:8081.
- Redirect URI: https://eaisvwqfbgdkzdfmxkvm.supabase.co/auth/v1/callback.
- AI-powered agent option off.

Owner must create the credential and keep its Client Secret private. Supabase's
Google provider form was inspected and left disabled, with blank Client IDs and
Client Secret fields; Skip nonce checks and Allow users without an email are off.
After credential creation, owner enters the ID/secret directly there and saves
provider enablement. No OAuth secret has been seen, copied or stored by the agent.
The mobile Google development switch has subsequently been enabled and live web
acceptance is recorded below. No paid trial/billing setup, code changes, commits or pushes in this
configuration-only step. Apple setup and the Gmail actual-From issue remain pending.


## Google enabled and live web acceptance

Owner created the Web OAuth client, entered its ID/secret directly into Supabase,
and saved provider enablement. A fresh provider list confirmed Google ENABLED and
Apple DISABLED; email confirmation remains on, anonymous sign-in/manual linking off.
The agent did not open or copy the generated/stored OAuth secret. Only the public
EXPO_PUBLIC_GOOGLE_ENABLED=true switch was added to the ignored mobile env.
Web and iOS Hermes exports passed with that switch; the local preview was updated
without removing assets needed by existing tabs. No new source logic in this step.

Live web run at localhost:8090:
- Google button enabled; Google authorization and Supabase PKCE callback succeeded.
- App Home opened; Settings showed the new Hoosh account email, signed in.
- Reload restored the session and identity in Settings.
- Local signout completed; a direct /settings navigation returned to /sign-in.
- A second attempted interruption test auto-completed through Google's existing
  sign-in grant before it could be canceled. Its extra session was signed out and
  the temporary tab closed. Do not claim live Google denial/cancellation coverage.
- No provider token, verifier, password or secret was copied into project files.

This qualifies the successful development web flow, not signed-device Google
Auth, account revocation/linking, API identity/profile integration or production
release. Existing source test count is 118; no code-test rerun was needed for the
configuration-only switch. Apple portal sign-in is now a password/verification
handoff for the existing individual membership; do not create another Apple team.
The Gmail actual-From alias issue remains separate and unresolved.

## Apple setup progress — October 30, 2026

With the owner's specific approval, saved Sign in with Apple as a primary
capability on the existing `com.AnishaDasgupta.DisconnectApp` App ID. A fresh
read confirmed that only `APPLE_ID_AUTH` changed; App Groups and the existing
Family Controls settings were preserved. Apple requires provisioning profiles
using this App ID to be regenerated before future builds.

Registered Services ID `com.AnishaDasgupta.Hoosh.auth.dev`, described as
Hoosh Web Sign In Development. The owner approved its web authentication
configuration, which was saved and reopened to verify the callback trust:

- Primary App ID: `com.AnishaDasgupta.DisconnectApp` (team `KBW8M9TJN2`).
- Domain: `eaisvwqfbgdkzdfmxkvm.supabase.co`.
- Return URL: `https://eaisvwqfbgdkzdfmxkvm.supabase.co/auth/v1/callback`.

The owner completed key registration/download after the credential-creation
handoff. A fresh Apple key inventory confirmed `Hoosh Auth Development`, key ID
`QD55YMP8ND`, Sign in with Apple only, created October 30. The private `.p8`
remains outside the repository. A local Node crypto helper generated the OAuth
client-secret JWT without logging its contents. Synthetic signature/claim/lifetime
and invalid-input checks passed; the actual signature was self-verified. The
secret is in a temporary directory mode 0700 with file mode 0600, outside Git.
It expires April 28, 2027 at 16:26 UTC; replace it before that date. Do not copy
the private key or generated JWT into docs, source, environment files or chat.

The owner pasted the generated JWT into Supabase and saved the provider directly.
A fresh providers page confirmed Apple ENABLED and Google ENABLED, with email
confirmation on and anonymous sign-in/manual linking off. Enabled both public
Apple development flags in the ignored local env. Web and iOS Hermes exports
passed; updated the web preview while preserving existing auth-tab assets.

Live Continue with Apple reached Apple's account/password page with Services ID
`com.AnishaDasgupta.Hoosh.auth.dev` and the exact Supabase HTTPS callback. The
owner then completed password/verification/consent, allowing callback exchange,
restoration and signout acceptance below. Apple currently labels the consent/login
prompt DisconnectApp, reflecting the existing Apple app identity. Do not claim
that this prompt or the live store listing has already been renamed.

After the owner completed Apple's password/verification/consent prompts, live
web acceptance passed: returned to Hoosh Home, Settings showed an authenticated
account, reload restored the session, local signout completed and a direct
`/settings` request redirected to the login page. No tokens or callback codes
were captured in documentation. This establishes the successful development
web path; native signed-device behavior, live denial/revocation, private relay
email delivery and App Store release remain unverified. No auth source changes
were required in this configuration step; existing 118 tests were not rerun.
Web/iOS Hermes exports and `git diff --check` passed. The intended public app name is
Hoosh; the previously verified live App Store listing still says DisconnectApp.
Saving auth capabilities does not rename or publish that listing. No native
source, bundle identity, commits or pushes were changed in this portal step.
